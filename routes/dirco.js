const express = require('express')
const moment = require('moment')
const models = require("../models/index")
const sequelize = require("sequelize")
const router = express.Router()
const Op = sequelize.Op

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

    // models.sequelize.query("SELECT CONCAT(Clients.nom, '_', cp) as title, date as start, DATE_ADD(date, INTERVAL 2 HOUR) as end, backgroundColor FROM RDVs LEFT JOIN Clients ON RDVs.idClient=Clients.id LEFT JOIN Users ON RDVs.idVendeur=Users.id LEFT JOIN UserStructures ON Users.id=UserStructures.idUser LEFT JOIN Structures ON UserStructures.idStructure=Structures.id LEFT JOIN Depsecteurs ON Clients.dep=Depsecteurs.dep LEFT JOIN Secteurs ON Secteurs.id=Depsecteurs.idSecteur WHERE idVendeur IN (:dependence) AND statut=1", { replacements: {dependence: idDependence}, type: sequelize.QueryTypes.SELECT})
    models.sequelize.query("SELECT CONCAT(Users.nom, ' ', Users.prenom, ' : ', Clients.prenom, ' ', Clients.nom, ' (', Clients.cp, ')') as tooltip, CONCAT(Users.nom, ' ', Users.prenom) as title, date as start, DATE_ADD(date, INTERVAL 2 HOUR) as end, RDVs.source as source FROM RDVs LEFT JOIN Clients ON RDVs.idClient=Clients.id LEFT JOIN Users ON RDVs.idVendeur=Users.id WHERE idVendeur IN (:dependence) AND statut=1", { replacements: {dependence: idDependence}, type: sequelize.QueryTypes.SELECT})
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
            if(element.allDay == 'false'){
                findedAbs[index].allDay = false
            }else{
                findedAbs[index].allDay = true
            }
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
            }).done((findedEvents) => {
                res.send({findedEvents: findedEvents})
            })
        })
    })
});

router.post('/agenda/ajoute-event' , (req, res, next) => {
    let idDependence = []
    idDependence.push(req.session.client.id) 

    req.session.client.Usersdependences.forEach((element => {
        idDependence.push(element.idUserInf)    
    }))

    if(idDependence.length === 0){
        idDependence.push(1000) 
    }

    let pattern = 'YYYY/MM/DD HH:mm'
    console.log(`All day : ${req.body.allDay === 'true'}`)
    if(req.body.allDay === 'true') {
        pattern = 'DD/MM/YYYY'
    }
    req.body.start = moment(req.body.start, pattern).format('YYYY/MM/DD HH:mm')
    req.body.end = moment(req.body.end, pattern).format('YYYY/MM/DD HH:mm')

    models.Event.create(req.body).done( (createdEvent) => {
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
            }).done((findedEvents) => {
                res.send({findedEvents: findedEvents})
            })
        })
    })
});

module.exports = router;