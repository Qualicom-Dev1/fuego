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

module.exports = router;