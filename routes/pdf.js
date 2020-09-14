const express = require('express')
const router = express.Router()
const models = require("../models/index")
const fs = require('fs')
const moment = require('moment')
const sequelize = require('sequelize')
const Op = sequelize.Op
const request = require('request')
const ejs = require('ejs')
const htmlToPDF = require('html-pdf')
const sourcePDFDirectory = __dirname + '/../public/pdf'
const destinationPDFDirectory = __dirname + '/../pdf'
const clientInformationObject = require('./utils/errorHandler')
const { stream } = require('../logger/logger')
const { isSet } = require('lodash')


const getFicheInterventionHTML = async (idRDV) => {
    const rdv = await models.RDV.findOne({
        include: [
            { model: models.Client },
            { 
                model : models.User,
                include : { 
                    model: models.Structure 
                } 
            }
        ],
        where: {
            id: idRDV
        }
    })

    let htmlOutput = undefined

    const fiche_intervention = rdv.User !== null ? `${sourcePDFDirectory}/fiche_intervention_${rdv.User.Structures[0].nom}.ejs` : `${sourcePDFDirectory}/fiche_intervention_EW.ejs`

    ejs.renderFile(fiche_intervention, { layout : false, rdv }, (err, html) => {
        if(err) {
            html = "<h1>pdf incorrect</h1>"
            console.error(err)
        }
        
        htmlOutput = html
    })

    return {
        rdv,
        html : htmlOutput
    }
}

const getAgencyHTML = async (ids, date) => {
    // models.RDV.findAll({
    //     include: [
    //         {model: models.Client},
    //         {model: models.User},
    //         {model: models.Etat},
    //     ],
    //     where: {
    //         id: {
    //             [Op.in]: req.params.id.split('-')
    //         },
    //         statut: 1,
    //         idVendeur: {
    //             [Op.not] : null
    //         }
    //     },
    //     order: [['idVendeur', 'asc']],
    // }).then(findedRdv => {
    //     res.render('../pdf/agency', {layout: false, rdvs: findedRdv, date: req.params.date, moment: moment});
    // }).catch(err => {
    //     console.log(err)
    // })

    const listeRDV = await models.RDV.findAll({
        include: [
            {model: models.Client},
            {model: models.User},
            {model: models.Etat},
        ],
        where: {
            id: {
                [Op.in]: ids.split('-')
            },
            statut: 1,
            idVendeur: {
                [Op.not] : null
            }
        },
        order: [['idVendeur', 'asc']],
    })

    let htmlOutput = undefined
    ejs.renderFile(`${sourcePDFDirectory}/agency.ejs`, { layout : false, rdvs : listeRDV, date, moment }, (err, html) => {
        if(err) {
            html = "<h1>pdf incorrect</h1>"
            console.error(err)
        }
        
        htmlOutput = html
    })

    return htmlOutput
}


router.post('/fiche-client' , async (req, res, next) => {
    const { rdv, html } = await getFicheInterventionHTML(req.body.id)

    rdv.Client.nom = rdv.Client.nom.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    const pdf = `${rdv.Client.nom}_${rdv.Client.cp}.pdf`

    htmlToPDF.create(html, { 
        height : "1123px",
        width : "794px",
        orientation : "portrait",
        
    }).toFile(`${destinationPDFDirectory}/${pdf}`, (err, { filename = undefined }) => {
        if(err) console.error(err)
        res.send(pdf)
    })
});

router.post('/agency' , async (req, res, next) => {
    const ids = typeof req.body.ids == 'string' ? req.body.ids : req.body.ids.join('-')
    const date = req.body.name.split('-').join('_')

    const html = await getAgencyHTML(ids, date)

    const pdf = `agency_du_${date}.pdf`

    htmlToPDF.create(html, { 
        height : "794px",
        width : "1123px",
        orientation : "landscape",
    }).toFile(`${destinationPDFDirectory}/${pdf}`, (err, { filename = undefined }) => {
        if(err) console.error(err)
        res.send(pdf)
    })
});

router.get('/zones-geographiques.pdf', async (req, res) => {
    let zones = undefined
    let infoObject = undefined

    try {
        // récupère toutes les zones
        zones = await models.Zone.findAll({
            order : [['id', 'ASC']]
        })

        if(zones === null || zones.length === 0) throw "Impossible de créer le PDF car aucune zone existante."

        // conversion en objet classique
        zones = zones.map(zone => {
            return {
                id : zone.id,
                nom : zone.nom,
                deps : zone.deps,
                affichage_titre : zone.affichage_titre
            }
        })

        // pour chaque zone, récupération des sous-zones
        for(const zone of zones) {
            // récupération des sous-zones
            let sousZones = await models.SousZone.findAll({
                where : {
                    idZone : zone.id
                },
                order : [['id', 'ASC']]
            })

            if(sousZones == null || sousZones.length === 0) {
                sousZones = []
            }
            // s'il y a des sous-zones
            else {
                // conversion en objet classique
                sousZones = sousZones.map(sousZone => {
                    return {
                        id : sousZone.id,
                        idZone : sousZone.idZone,
                        nom : sousZone.nom,
                        deps : sousZone.nom,
                        affichage_titre : sousZone.affichage_titre
                    }
                })

                // pour chaque sous-zone, récupération des agences
                for(const sousZone of sousZones) {
                    let agences = await models.Agence.findAll({
                        where : {
                            idSousZone : sousZone.id
                        },
                        order : [['id', 'ASC']]
                    })

                    if(agences === null || agences.length === 0) {
                        agences = []
                    }
                    // s'il y a des agences
                    else {
                        // conversion en objet classique
                        agences = agences.map(agence => {
                            return {
                                id : agence.id,
                                idSousZone : agence.idSousZone,
                                nom : agence.nom,
                                deps : agence.deps,
                                affichage_titre : agence.affichage_titre
                            }
                        })

                        // pour chaque agences récupération des vendeurs
                        for(const agence of agences) {
                            let vendeurs = await models.AppartenanceAgence.findAll({
                                where : {
                                    idAgence : agence.id
                                },
                                include : [
                                    { model : models.User }
                                ],
                                order : [['id', 'ASC']]
                            })

                            if(vendeurs === null || vendeurs.length === 0) {
                                vendeurs = []
                            }
                            
                            // conversion en objet classique
                            vendeurs = vendeurs.map(vendeur => {
                                // mise en tête du département principal du vendeur
                                vendeur.User.dep = Number(vendeur.User.dep) < 10 ? `0${vendeur.User.dep.toString()}` : vendeur.User.dep.toString()
                                const listeDeps = vendeur.deps.split(',')
                                // retrait du département principal
                                listeDeps.splice(listeDeps.indexOf(vendeur.User.dep), 1)
                                // ajout au début du département principal
                                listeDeps.unshift(vendeur.User.dep)

                                return {
                                    id : vendeur.User.id,
                                    prenom : vendeur.User.prenom,
                                    nom : vendeur.User.nom,
                                    deps : listeDeps
                                }
                            })

                            agence.vendeurs = vendeurs
                        }
                    }

                    // on ajoute la liste des agences à la sous-zone
                    sousZone.agences = agences
                }
            }

            // on ajoute la liste de sous-zones à la zone
            zone.sousZones = sousZones
        }

        // création du pdf
        let htmlOutput = undefined

        ejs.renderFile(`${sourcePDFDirectory}/zones_geographiques.ejs`, { zones }, (err, html) => {
            if(err) {
                throw err
            }

            htmlOutput = html
        })

        const pdf = 'zones_geographiques.pdf'

        htmlToPDF.create(htmlOutput, {
            height : "1123px",
            width : "794px",
            orientation : "portrait"
        }).toStream((err, stream) => {
            if(err) {                
                throw err
            }
            else {
                stream.pipe(res)
            }
        })
        // }).toFile(`${destinationPDFDirectory}/${pdf}`, (err, { filename = undefined }) => {
        //     if(err) {
        //         throw err
        //     }
        //     else {
        //         res.send(pdf)
        //     }
        // })
    }
    catch(error) {
        infoObject = clientInformationObject(error)
        console.error(`Erreur création pdf zones géo : ${infoObject.error}`)
        
        res.send(infoObject.error)
    }
})

// router.get('/client/:Id' , (req, res) => {
//     models.RDV.findOne({
//         include: {
//             model: models.Client
//         },
//         where: {
//             id: req.params.Id
//         }
//     }).then(findedRdv => {
//         models.User.findOne({
//             include: {
//                 model: models.Structure
//             },
//             where: {
//                 id: findedRdv.idVendeur
//             }
//         }).then(findedUsers => {
//             res.render('../pdf/fiche_intervention_'+findedUsers.Structures[0].nom, {layout: false, rdv: findedRdv});
//         }).catch(err => {
//             console.log(err)
//         })
//     }).catch(err => {
//         console.log(err)
//     })
// });

// router.get('/agency/:id/:date' , (req, res) => {
//     models.RDV.findAll({
//         include: [
//             {model: models.Client},
//             {model: models.User},
//             {model: models.Etat},
//         ],
//         where: {
//             id: {
//                 [Op.in]: req.params.id.split('-')
//             },
//             statut: 1,
//             idVendeur: {
//                 [Op.not] : null
//             }
//         },
//         order: [['idVendeur', 'asc']],
//     }).then(findedRdv => {
//         res.render('../pdf/agency', {layout: false, rdvs: findedRdv, date: req.params.date, moment: moment});
//     }).catch(err => {
//         console.log(err)
//     })
// });

router
.get('/rapportActivite_:dates.pdf', async (req, res) => {
    const data = req.session.dataRapportActivite
    req.session.dataRapportActivite = undefined

    const dates = req.params.dates

    try {
        if(!dates) throw "La date de début et la date de fin doivent être précisées."

        const [dateDebut, dateFin] = dates.split('_')

        if(!dateDebut.match(/\d{2}-\d{2}-\d{4}/)) throw "Le format de la date de début est incorrect."
        if(!dateFin.match(/\d{2}-\d{2}-\d{4}/)) throw "Le format de la date de fin est incorrect."

        if(!data) {
            res.redirect(`/manager/rapportActivite/create?dateDebut=${moment(dateDebut, 'DD-MM-YYYY').format('DD/MM/YYYY')}&dateFin=${moment(dateFin, 'DD-MM-YYYY').format('DD/MM/YYYY')}`)
        }

        // création du pdf
        let htmlOutput = undefined

        ejs.renderFile(`${sourcePDFDirectory}/rapportActivite.ejs`, { ...data }, (err, html) => {
            if(err) {
                throw err
            }

            htmlOutput = html
        })

        const pdf = `rapportActivite_${moment(data.dateDebut, 'DD/MM/YYYY').format('DD-MM-YYYY')}_${moment(data.dateFin, 'DD/MM/YYYY').format('DD-MM-YYYY')}.pdf`

        htmlToPDF.create(htmlOutput, { 
            height : "794px",
            width : "1123px",
            orientation : "landscape",            
        }).toStream((err, stream) => {
            if(err) {                
                throw err
            }
            else {
                stream.pipe(res)
            }
        })
    }
    catch(error) {
        const infoObject = clientInformationObject(error)
        res.send(infoObject.error)
    }
})
.get('/rapportAgency_:dates.pdf', async (req, res) => {
    const data = req.session.dataRapportAgency
    req.session.dataRapportAgency = undefined

    const dates = req.params.dates

    try {
        if(!dates) throw "La date de début et la date de fin doivent être précisées."

        const [dateDebut, dateFin] = dates.split('_')

        if(!dateDebut.match(/\d{2}-\d{2}-\d{4}/)) throw "Le format de la date de début est incorrect."
        if(!dateFin.match(/\d{2}-\d{2}-\d{4}/)) throw "Le format de la date de fin est incorrect."

        if(!data) {
            res.redirect(`/directeur/rapportAgency/create?dateDebut=${moment(dateDebut, 'DD-MM-YYYY').format('DD/MM/YYYY')}&dateFin=${moment(dateFin, 'DD-MM-YYYY').format('DD/MM/YYYY')}`)
        }

        // création du pdf
        let htmlOutput = undefined

        ejs.renderFile(`${sourcePDFDirectory}/rapportAgency.ejs`, { ...data }, (err, html) => {
            if(err) {
                throw err
            }

            htmlOutput = html
        })

        const pdf = `rapportAgency_${moment(data.dateDebut, 'DD/MM/YYYY').format('DD-MM-YYYY')}_${moment(data.dateFin, 'DD/MM/YYYY').format('DD-MM-YYYY')}.pdf`

        htmlToPDF.create(htmlOutput, { 
            height : "794px",
            width : "1123px",
            orientation : "landscape",            
        }).toStream((err, stream) => {
            if(err) {                
                throw err
            }
            else {
                stream.pipe(res)
            }
        })
    }
    catch(error) {
        const infoObject = clientInformationObject(error)
        res.send(infoObject.error)
    }
})

module.exports = router;