const express = require('express')
const moment = require('moment')
const { BelongsToMany } = require('sequelize')
const models = global.db
const sequelize = require("sequelize")
const router = express.Router()
const Op = sequelize.Op
const clientInformationObject = require('./utils/errorHandler');
const isSet = require('./utils/isSet');

router.get('/' ,(req, res, next) => {
    res.redirect('/vendeur/dirco_dashboard');
});

router.get('/tableau-de-bord' ,(req, res, next) => {

    let idDependence = []
    req.session.client.Usersdependences.forEach((element => {
        idDependence.push(element.idUserInf)    
    }))

    if(idDependence.length == 0){
        idDependence.push(1000) 
        idDependence.push(1001) 
    }

    models.sequelize.query("SELECT CONCAT(Users.nom, ' ', Users.prenom) as commercial, count(RDVs.id) as count FROM RDVs LEFT JOIN Users ON RDVs.idVendeur=Users.id LEFT JOIN UserStructures ON Users.id=UserStructures.idUser LEFT JOIN Structures ON UserStructures.idStructure=Structures.id WHERE idVendeur IN (:dependence) AND date LIKE :date AND statut = 1 GROUP BY commercial", { replacements: {dependence: idDependence, date: moment().format('YYYY-MM-DD')+'%'}, type: sequelize.QueryTypes.SELECT})
    .then(findedRdvToday => {
        models.sequelize.query("SELECT CONCAT(Users.nom, ' ', Users.prenom) as commercial, count(RDVs.id) as count FROM RDVs LEFT JOIN Users ON RDVs.idVendeur=Users.id LEFT JOIN UserStructures ON Users.id=UserStructures.idUser LEFT JOIN Structures ON UserStructures.idStructure=Structures.id WHERE idVendeur IN (:dependence) AND date LIKE :date AND statut = 1 GROUP BY commercial", { replacements: {dependence: idDependence, date: moment().add(1, 'days').format('YYYY-MM-DD')+'%'}, type: sequelize.QueryTypes.SELECT})
        .then(findedRdvTomorow => {
            res.render('./vendeur/dirco_dashboard', { extractStyles: true, title: 'Tableau de bord | FUEGO', description :'Tableau de bord Directeur Commercial', session: req.session.client, options_top_bar: 'commerciaux', today: findedRdvToday, tomorow: findedRdvTomorow});
        });
   });
});

router.get('/rendez-vous' ,(req, res, next) => {
    let idDependence = []
    req.session.client.Usersdependences.forEach((element => {
        idDependence.push(element.idUserInf)    
    }))

    if(idDependence.length == 0){
        idDependence.push(1000) 
        idDependence.push(1001) 
    }

    models.RDV.findAll({
        include: [
            {model : models.Client},
            {model : models.Historique},
            {model : models.User, where : { 
                id: { 
                    [Op.in] : idDependence
                }
            },include: models.Structure},
            {model : models.Etat},
            {model : models.Campagne}
        ],
        where: {
            date : {
               [Op.substring] : [moment().format('YYYY-MM-DD')]
            },
            statut: 1
        },
        order: [['date', 'asc']],
    }).then(findedRdvs => {
        // nombre de jour(s) pour aller au prochain jour de travail
        let hopToNextDay = 1

        // samedi
        if(moment().day() === 5) {
            hopToNextDay = 2
        } 

        models.RDV.findAll({
            include: [
                {model : models.Client},
                {model : models.Historique},
                {model : models.User, where : { 
                    id: { 
                        [Op.in] : idDependence
                    }
                },include: models.Structure},
                {model : models.Etat},
                {model : models.Campagne}
            ],
            where: {
                date : {
                   [Op.substring] : [moment().add(hopToNextDay, 'day').format('YYYY-MM-DD')]
                },
                statut: 1
            },
            order: [['idVendeur', 'asc'],['date', 'asc']],
        }).then(findedRdvsp => {
            res.render('vendeur/dirco_rdv', { extractStyles: true, title: 'Tableau de bord | FUEGO', description:'Tableau de bord Commercial', findedRdvs: findedRdvs, findedRdvsp: findedRdvsp, session: req.session.client, options_top_bar: 'commerciaux'});
        }).catch(function (e) {
            console.log('error', e);
        });
    }).catch(function (e) {
        console.log('error', e);
    });
});

router.get('/agenda' ,(req, res, next) => {

    let idDependence = []
    req.session.client.Usersdependences.forEach((element => {
        idDependence.push(element.idUserInf)    
    }))

    // ajout de lui même pour que le commercial puisse s'appliquer des rdv à lui même
    idDependence.push(req.session.client.id) 

    if(idDependence.length == 0){
        idDependence.push(1000) 
    }
    
    models.User.findAll({
        where: {
            id: {
                [Op.in] : idDependence,
            }
        },
        order: [['nom', 'asc']],
    }).then(findedUsers => {
        models.Event.findAll({
            include : [
                {model: models.User}
            ],
            where : {
                idCommercial: {
                    [Op.in] : idDependence
                }
            },
            order: [['start', 'DESC']],
        }).then((findedEvents) =>{
            res.render('./vendeur/dirco_agenda', { extractStyles: true, title: 'Agenda | FUEGO',  description :'Agenda Directeur Commercial', session: req.session.client,options_top_bar: 'commerciaux', findedEvents: findedEvents, findedUsers:findedUsers});
        })
}   )
});

router.get('/historique' ,(req, res, next) => {
    let idDependence = []
    req.session.client.Usersdependences.forEach((element => {
        idDependence.push(element.idUserInf)    
    }))

    if(idDependence.length == 0){
        idDependence.push(1000) 
        idDependence.push(req.session.client.id) 
    }

    models.RDV.findAll({
        include: [
            {model : models.Client},
            {model : models.Historique},
            {model : models.User, where : { 
                id: { 
                    [Op.in] : idDependence
                }
            },include: models.Structure},
            {model : models.Etat},
            {model : models.Campagne}
        ],
        where: {
            date : {
               [Op.substring] : [moment().subtract(1, 'day').format('YYYY-MM-DD')]
            },
            idEtat: {
                [Op.not]: null
            }
        },
        order: [['idVendeur', 'asc'],['date', 'asc']],
    }).then(findedRdvs => {
        res.render('./vendeur/dirco_histo', { extractStyles: true, title: 'Historique | FUEGO',  description :'Historique Directeur Commercial', findedRdvs: findedRdvs ,options_top_bar: 'commerciaux',  date: moment().subtract(1, 'days').format('DD/MM/YYYY')});
    })
});

router.post('/historique' ,(req, res, next) => {
    let idDependence = []
    req.session.client.Usersdependences.forEach((element => {
        idDependence.push(element.idUserInf)    
    }))

    if(idDependence.length == 0){
        idDependence.push(1000) 
        idDependence.push(req.session.client.id) 
    }

    models.RDV.findAll({
        include: [
            {model : models.Client},
            {model : models.Historique},
            {model : models.User, where : { 
                id: { 
                    [Op.in] : idDependence
                }
            },include: models.Structure},
            {model : models.Etat},
            {model : models.Campagne}
        ],
        where: {
            date : {
                [Op.between] : [moment(req.body.datedebut, 'DD/MM/YYYY').format('MM-DD-YYYY'), moment(moment(req.body.datefin, 'DD/MM/YYYY').format('MM-DD-YYYY')).add(1, 'days')]
            },
            idEtat: {
                [Op.not]: null
            }
        },
        order: [['idVendeur', 'asc'],['date', 'asc']],
    }).then(findedRdvs => {
        res.send(findedRdvs)
    })
});


router.post('/event' ,(req, res, next) => {
    let idDependence = []
    req.session.client.Usersdependences.forEach((element => {
        idDependence.push(element.idUserInf)    
    }))

    if(idDependence.length == 0){
        idDependence.push(1000) 
        idDependence.push(req.session.client.id) 
    }

    // models.sequelize.query("SELECT CONCAT(Clients.nom, '_', cp) as title, date as start, DATE_ADD(date, INTERVAL 2 HOUR) as end, backgroundColor FROM RDVs LEFT JOIN Clients ON RDVs.idClient=Clients.id LEFT JOIN Users ON RDVs.idVendeur=Users.id LEFT JOIN UserStructures ON Users.id=UserStructures.idUser LEFT JOIN Structures ON UserStructures.idStructure=Structures.id LEFT JOIN DepSecteurs ON Clients.dep=DepSecteurs.dep LEFT JOIN Secteurs ON Secteurs.id=DepSecteurs.idSecteur WHERE idVendeur IN (:dependence) AND statut=1", { replacements: {dependence: idDependence}, type: sequelize.QueryTypes.SELECT})
    models.sequelize.query("SELECT CONCAT(Users.nom, ' ', Users.prenom, ' : ', Clients.prenom, ' ', Clients.nom, ' (', Clients.cp, ')') as tooltip, CONCAT(Users.nom, ' ', Users.prenom) as title, date as start, DATE_ADD(date, INTERVAL 2 HOUR) as end, RDVs.source as source FROM RDVs LEFT JOIN Clients ON RDVs.idClient=Clients.id LEFT JOIN Users ON RDVs.idVendeur=Users.id WHERE idVendeur IN (:dependence) AND statut IN (1)", { replacements: {dependence: idDependence}, type: sequelize.QueryTypes.SELECT})
    .then(findedEvent => {
        res.send(findedEvent)
    });
});

router.post('/abs' ,(req, res, next) => {
    let idDependence = []
    req.session.client.Usersdependences.forEach((element => {
        idDependence.push(element.idUserInf)    
    }))

    if(idDependence.length == 0){
        idDependence.push(1000) 
        idDependence.push(req.session.client.id) 
    }

    models.sequelize.query("SELECT CONCAT(Users.prenom, ' ', Users.nom, ' : ', IF(LENGTH(motif), motif, 'Aucun motif')) as tooltip, CONCAT(Users.nom,' ', Users.prenom) as title, start as start, end as end, allDay FROM Events JOIN Users ON Events.idCommercial=Users.id WHERE Events.idCommercial IN (:dependence)", {replacements : {dependence: idDependence} ,type: sequelize.QueryTypes.SELECT})
    .then(findedAbs => {
        findedAbs.forEach((element, index) => {
            findedAbs[index].allDay = element.allDay
        })
        res.send(findedAbs)
    });
});

router.post('/agenda/delete' ,(req, res, next) => {
    
    models.Event.destroy({
        where: {
            id: req.body.id
        }
    }).then( deleteEvent => {
        let idDependence = []
        req.session.client.Usersdependences.forEach((element => {
            idDependence.push(element.idUserInf)    
        }))

        if(idDependence.length == 0){
            idDependence.push(1000) 
            idDependence.push(req.session.client.id) 
        }

        models.User.findAll({
            where: {
                id: {
                    [Op.in] : idDependence,
                }
            },
            order: [['nom', 'asc']],
        }).then(findedUsers => {
            models.Event.findAll({
                include: [
                    {model: models.User}
                ],
                where: {
                    idCommercial : {
                        [Op.in]: idDependence
                    }
                },
                order : [['start', 'DESC']]
            }).then((findedEvents) => {
                res.send({findedEvents: findedEvents})
            })
        })
    })
});

router.post('/agenda/ajoute-event' , async (req, res) => {
    let infos = undefined
    let events = undefined

    try {
        const { body } = req
        if(!isSet(body.idCommercial)) throw "Un commercial doit être sélectionné."
        if(!isSet(body.motif)) throw "Un motif doit être saisi."

        const vendeur = models.User.findOne({
            include : [
                { 
                    model : models.Role,
                    where : {
                        typeDuRole : 'Commercial'
                    }
                }
            ],
            where : {
                id : body.idCommercial
            }
        })
        if(vendeur === null) throw "Aucun commercial correspondant à celui sélectionné."

        let patternDateTime = 'DD/MM/YYYY HH:mm'
        let patternDate = 'DD/MM/YYYY'
        let formatDateTime = 'YYYY-MM-DD HH:mm'
        let formatDate = 'YYYY-MM-DD'

        // cas classique de juste un événement
        if(!body.isRecurrence) {
            // cas classique d'un événement sur une certaine durée
            if(!body.allDay) {
                if(!isSet(body.start) || !isSet(body.end)) throw "Les dates de début et de fin d'événement doivent être définies."
                
                body.start = moment(body.start, patternDateTime).format(formatDateTime)
                body.end = moment(body.end, patternDateTime).format(formatDateTime)

                if(moment(body.end).isBefore(moment(body.start))) throw "La date de fin doit se trouver après la date de début."                
            }
            // un événement sur un jour complet
            else {
                if(!isSet(body.start)) throw "La date de l'événement doit être définie."

                body.start = moment(body.start, patternDate).format(formatDate)
                body.end = body.start
            }

            // création de l'événement
            const event = await models.Event.create(body)
            if(event === null) throw "Une erreur est survenue lors de la création de l'événement."
        }       
        // cas d'un événement récurent        
        else {
            if(!isSet(body.start) || !isSet(body.end)) throw "Les dates de début et de fin d'événement doivent être définies."   
            // lundi = 1 vendredi = 7
            if(!isSet(body.jourRecurrence) || body.jourRecurrence < 1 || body.jourRecurrence > 7)  throw "Le jour de répétition de l'événement doit être difini."

            body.jourRecurrence = Number(body.jourRecurrence)
            let horaireDebut = '00:00'
            let horaireFin = '00:00'

            // événement récurent qui ne dure que sur une certaine plage horaire
            if(!body.allDay) {
                horaireDebut = moment(body.start, patternDateTime).format('HH:mm')
                horaireFin = moment(body.end, patternDateTime).format('HH:mm')
                
                body.start = moment(body.start, patternDateTime).format(formatDate)
                body.end = moment(body.end, patternDateTime).format(formatDate)

                if(moment(body.end).isBefore(moment(body.start))) throw "La date de fin doit se trouver après la date de début."                
            }
            // un événement sur un jour complet
            else {
                body.start = moment(body.start, patternDate).format(formatDate)
                body.end = moment(body.end, patternDate).format(formatDate)

                if(moment(body.end).isBefore(moment(body.start))) throw "La date de fin doit se trouver après la date de début."  
            }

            // recherche de toutes les occurences de jours correspondants à la récurence demandée et création des événements en conséquence
            const tabCreateEvents = []

            let isBetween = true
            let currentDateDebut = moment(`${body.start} ${horaireDebut}`)
            let currentDateFin = moment(`${body.start} ${horaireFin}`)
            
            // si l'événement comprends la nuit ex débute le mardi à 17h et se termine le mercredi à 10h, on décale la date courante de fin d'une journée pour que le lendemain matin puisse être compris dedans
            if(currentDateDebut.isAfter(currentDateFin)) currentDateFin = currentDateFin.add(1, 'day')

            while(isBetween) {
                // on vérifie que notre période se situe bien entre la date de début et la date de fin
                if(currentDateDebut.isBetween(`${body.start} ${horaireDebut}`, `${body.end} ${horaireFin}`, undefined, '[]') && currentDateFin.isBetween(`${body.start} ${horaireDebut}`, `${body.end} ${horaireFin}`, undefined, '[]')) {
                    // on vérifie que le jours en cours est celui voulu
                    if(currentDateDebut.get('day') === body.jourRecurrence) {
                        // création de l'événement
                        tabCreateEvents.push(models.Event.create({
                            idCommercial : body.idCommercial,
                            start : currentDateDebut.format(formatDateTime),
                            end : currentDateFin.format(formatDateTime),
                            motif : body.motif,
                            allDay : body.allDay
                        }))
                    }

                    currentDateDebut = currentDateDebut.add(1, 'day')
                    currentDateFin = currentDateFin.add(1, 'day')
                }
                // si hors période on peut sortir de la boucle
                else {
                    isBetween = false
                }
            }

            // création de tous les événements
            if(tabCreateEvents.length === 0) throw "Aucun événement correspondant à vos critères."
            await Promise.all(tabCreateEvents)
        }

        // récupération de l'id du commercial en cours et de ses subalternes pour récupérer leurs événements
        let listeIdsVendeurs = [req.session.client.id]
        req.session.client.Usersdependences.forEach((dependance => {
            listeIdsVendeurs.push(dependance.idUserInf)    
        }))
        
        events = await models.Event.findAll({
            include: [
                { model: models.User }
            ],
            where: {
                idCommercial : {
                    [Op.in]: listeIdsVendeurs
                }
            },
            order : [['start', 'DESC']]
        })
        if(events === null) throw "Une erreur est survenue lors de la récupération des événements."

        infos = clientInformationObject(undefined, "L'événement a bien été créé.")
    }
    catch(error) {
        events = undefined
        infos = clientInformationObject(error)
    }

    res.send({
        infos,
        events
    })
});

router
.get('/rapportAgency', (req, res) => {
    const yesterday = moment().subtract(1, 'day')
    const dateDebut = dateFin = yesterday.format('DD/MM/YYYY')

    res.render('vendeur/dirco_rapportAgency', { extractStyles: true, title: 'Rapport d\'agency | FUEGO', description:'Rapport d\'agency', session: req.session.client, options_top_bar: 'commerciaux', dateDebut, dateFin });
})
.get('/rapportAgency/create', async (req, res) => {
    let dateDebut = req.query.dateDebut
    let dateFin = req.query.dateFin

    try {
        if(!isSet(dateDebut)) throw "Une date de début doit être sélectionnée."
        if(!isSet(dateFin)) throw "une date de Fin doit être sélectionnée."

        dateDebut = `${moment(dateDebut, 'DD/MM/YYYY').format('YYYY-MM-DD')} 00:00:00`
        dateFin = `${moment(dateFin, 'DD/MM/YYYY').format('YYYY-MM-DD')} 23:59:59`

        const data = {}

        // récupération de la liste des commerciaux qui dépendent du dirco
        const listeIdCommerciaux = []
        listeIdCommerciaux.push(req.session.client.id)
        req.session.client.Usersdependences.forEach((element => {
            listeIdCommerciaux.push(element.idUserInf)    
        }))

        // récupération du compte pour chaque état
        let nbParEtat = await models.RDV.findAll({
            attributes : [
                [sequelize.col('Etat.nom'), 'etat'],
                [sequelize.fn('COUNT', sequelize.col('RDV.id')), 'nb']
            ],
            include : [
                { 
                    model : models.Etat,
                    attributes : []
                }
            ],
            where : {
                statut : 1,
                date : {
                    [Op.between] : [dateDebut, dateFin]
                },
                idVendeur : {
                    [Op.in] : listeIdCommerciaux
                }
            },
            group : 'RDV.idEtat',
            order : [[sequelize.col('nb'), 'DESC']]
        })

        let total = 0

        // on cherche à récupérer le détail des rdvs que s'il y en a
        if(nbParEtat === null || nbParEtat.length === 0) {
            nbParEtat = [{
                etat : "TOTAL",
                nb : total
            }]

            data.listeRdvs = []
        }
        else {
            // parcours les états pour s'il y en a un à null le passer à "SANS RAPPORT"
            // et compte du nombre total            
            nbParEtat = nbParEtat.map(item => {
                const etat = JSON.parse(JSON.stringify(item))

                if(etat.etat === null) etat.etat = "SANS RAPPORT"

                total += etat.nb

                return etat
            })

            nbParEtat.push({
                etat : "TOTAL",
                nb : total
            })

            // récupération des vendeurs dans chaque zone
            const idVendeursParZone = await models.AppartenanceAgence.findAll({
                attributes : [
                    [sequelize.col('Agence.SousZone.Zone.nom'), 'nomZone'],
                    'idVendeur'
                ],
                include : [
                    {
                        model : models.Agence,
                        attributes : [],
                        include : [
                            {
                                model : models.SousZone,
                                attributes : [],
                                include : [
                                    {
                                        model : models.Zone
                                    }
                                ]
                            }
                        ]
                    }
                ],
                where : {
                    idVendeur : {
                        [Op.in] : listeIdCommerciaux
                    }
                },
                order : [[sequelize.col('nomZone'), 'ASC']]
            })

            const rdvsZones = []
            let zone  = {
                nom : '',
                listeIdsVendeurs : []
            }
            
            // récupération des infos rdvs pour chaque zone
            for(let i = 0; i < idVendeursParZone.length + 1; i++) {
                const item = (i < idVendeursParZone.length) ? JSON.parse(JSON.stringify(idVendeursParZone[i])) : { nomZone : '', idVendeur : 0 }

                if(zone.nom !== item.nomZone) {
                    if(i !== 0) {
                        let listeRdvsZone = await models.RDV.findAll({
                            attributes : [
                                [sequelize.col('RDV.date'), 'date'],
                                [sequelize.fn('CONCAT', sequelize.col('Client.prenom'), " ", sequelize.col('Client.nom')), 'client'],
                                [sequelize.fn('CONCAT', sequelize.col('User.prenom'), " ", sequelize.col('User.nom')), 'vendeur'],
                                [sequelize.col('Client.cp'), 'cp'],
                                [sequelize.col('Client.dep'), 'dep'],
                                [sequelize.col('Client.ville'), 'ville'],
                                [sequelize.col('RDV.commentaire'), 'commentaire'],
                                // [sequelize.col('Client.source'), 'source'],
                                [sequelize.col('Etat.nom'), 'etat'],
                            ],
                            include : [
                                { 
                                    model : models.Client,
                                    attributes : []
                                },
                                { 
                                    model : models.User,
                                    attributes : []
                                },
                                { 
                                    model : models.Historique,
                                    attributes : []
                                },
                                { 
                                    model : models.Etat,
                                    attributes : []
                                },
                            ],
                            where : {
                                statut : 1,
                                date : {
                                    [Op.between] : [dateDebut, dateFin]
                                },
                                idVendeur : {
                                    [Op.in] : zone.listeIdsVendeurs
                                }
                            },
                            order : [
                                [sequelize.col('dep'), 'ASC'],
                                [sequelize.col('date'), 'ASC']
                            ]
                        })

                        if(listeRdvsZone === null || listeRdvsZone.length === 0) {
                            zone.listeRdvsZone = []
                        }
                        else {
                            listeRdvsZone = listeRdvsZone.map(item => {
                                const rdv = JSON.parse(JSON.stringify(item))
                
                                if(rdv.commentaire === null) rdv.commentaire = ''
                                if(rdv.source === null) rdv.source = ''
                                if(rdv.etat === null) rdv.etat = 'SANS RAPPORT'
                                if(rdv.vendeur === null) rdv.vendeur = ''
                
                                const date = moment(rdv.date, 'DD/MM/YYYY HH:mm').format('DD/MM/YYYY')
                                const heure = moment(rdv.date, 'DD/MM/YYYY HH:mm').format('HH:mm')
                
                                rdv.date = date
                                rdv.heure = heure
                
                                return rdv
                            })

                            zone.listeRdvsZone = listeRdvsZone
                        }
                        
                        zone.listeIdsVendeurs = undefined
                        rdvsZones.push(zone)
                    }

                    zone = {
                        nom : item.nomZone,
                        listeIdsVendeurs : []
                    }
                }
                
                zone.listeIdsVendeurs.push(item.idVendeur)
            }

            data.zonesRdvs = rdvsZones
        } 

        data.nbParEtat = nbParEtat
        data.dateDebut = moment(dateDebut).format('DD/MM/YYYY')
        data.dateFin = moment(dateFin).format('DD/MM/YYYY')

        req.session.dataRapportAgency = data

        res.redirect(`/pdf/rapportAgency_${moment(data.dateDebut, 'DD/MM/YYYY').format('DD-MM-YYYY')}_${moment(data.dateFin, 'DD/MM/YYYY').format('DD-MM-YYYY')}.pdf`)
        
        // res.send(data)
    }
    catch(error) {
        const infoObject = clientInformationObject(error)
        res.send(infoObject.error)
    }
})

module.exports = router;