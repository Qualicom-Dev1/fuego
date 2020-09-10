const express = require('express');
const router = express.Router();
const models = require("../models/index");
const moment = require('moment');
const sequelize = require('sequelize')
const Op = sequelize.Op;
const _ = require('lodash')
const config = require('./../config/config.json');
const dotenv = require('dotenv')
const colors = require('colors');
const clientInformationObject = require('./utils/errorHandler');
const isSet = require('./utils/isSet');
const { reject } = require('lodash');
dotenv.config();

const ovh = require('ovh')(config["OVH"])

router.get('/' , (req, res, next) => {
    res.redirect('/manager/tableau-de-bord');
});

router.get('/tableau-de-bord' ,(req, res, next) => {
    res.render('manager/manager_dashboard', { extractStyles: true, title: 'Tableau de bord | FUEGO', description:'Tableau de bord manager Marketing', session: req.session.client, options_top_bar: 'telemarketing'});
});

router.post('/statistiques' ,(req, res, next) => {
    let resultatmois = []
    let resultatsemaine = []
    let resultatjour = []

    let idDependence = []
    req.session.client.Usersdependences.forEach((element => {
        idDependence.push(element.idUserInf)    
    }))

    idDependence.push(req.session.client.id)

    models.sequelize.query("SELECT CONCAT(Users.nom, ' ',Users.prenom) as nomm, Actions.nom, Etats.nom as etat ,count(Historiques.id) as count FROM Historiques LEFT JOIN RDVs ON Historiques.id=RDVs.idHisto LEFT JOIN Users ON Users.id=Historiques.idUser LEFT JOIN Actions ON Actions.id=Historiques.idAction LEFT JOIN Etats ON Etats.id=RDVs.idEtat WHERE Users.id IN (:idUsers) AND Historiques.createdAt BETWEEN :datedebut AND :datefin GROUP BY nomm, Actions.nom, Etats.nom",
        { replacements: { 
            idUsers: idDependence,
            datedebut: moment().startOf('month').format('YYYY-MM-DD'), 
            datefin: moment().endOf('month').add(1, 'days').format('YYYY-MM-DD')
    }, type: sequelize.QueryTypes.SELECT}
    ).then(findedStatsMois => {
            models.sequelize.query("SELECT CONCAT(Users.nom, ' ',Users.prenom) as nomm, Actions.nom, Etats.nom as etat ,count(Historiques.id) as count FROM Historiques LEFT JOIN RDVs ON Historiques.id=RDVs.idHisto LEFT JOIN Users ON Users.id=Historiques.idUser LEFT JOIN Actions ON Actions.id=Historiques.idAction LEFT JOIN Etats ON Etats.id=RDVs.idEtat WHERE Users.id IN (:idUsers) AND Historiques.createdAt BETWEEN :datedebut AND :datefin GROUP BY nomm, Actions.nom, Etats.nom",
            { replacements: { 
                idUsers: idDependence,
                    datedebut: moment().startOf('week').format('YYYY-MM-DD'), 
                    datefin: moment().endOf('week').add(1, 'days').format('YYYY-MM-DD')
                }, type: sequelize.QueryTypes.SELECT}
                ).then(findedStatsSemaine => {
                    models.sequelize.query("SELECT CONCAT(Users.nom, ' ',Users.prenom) as nomm, Actions.nom, Etats.nom as etat ,count(Historiques.id) as count FROM Historiques LEFT JOIN RDVs ON Historiques.id=RDVs.idHisto LEFT JOIN Users ON Users.id=Historiques.idUser LEFT JOIN Actions ON Actions.id=Historiques.idAction LEFT JOIN Etats ON Etats.id=RDVs.idEtat WHERE Users.id IN (:idUsers) AND Historiques.createdAt BETWEEN :datedebut AND :datefin GROUP BY nomm, Actions.nom, Etats.nom",
                    { replacements: { 
                        idUsers: idDependence,
                            datedebut: moment().format('YYYY-MM-DD'), 
                            datefin: moment().add(1, 'days').format('YYYY-MM-DD')
                        }, type: sequelize.QueryTypes.SELECT})
                        .then(findedStatsJours => {
        
                            res.send({findedStatsMois : findedStatsMois, findedStatsSemaine : findedStatsSemaine, findedStatsJours : findedStatsJours});
                        
                        }).catch(err => {
                            console.log(err)
                        })
            }).catch(err => {
                console.log(err)
            })
        }).catch(err => {
            console.log(err)
        })
});

router.get('/directives' ,(req, res, next) => {
    let idDependence = []
    req.session.client.Usersdependences.forEach((element => {
        idDependence.push(element.idUserInf)    
    }))

    idDependence.push(req.session.client.id)

    models.User.findAll({
        include: [  
            {model: models.Role, include: models.Privilege},
            {model: models.Directive},
            {model: models.Structure ,include: models.Type}
        ],
        where : {
            id: {
                [Op.in]: idDependence
            }
        }
    }).then(findedUsers => {
        if(findedUsers){
            models.Campagne.findAll({
                where : {
                    etat_campagne : 1
                }
            }).then((findedCampagnes) => {
                models.Client.aggregate('source', 'DISTINCT', {plain: false})
                .then(findedSource => {
                    models.Client.aggregate('type', 'DISTINCT', {plain: false})
                    .then(findedType => {
                    let i = 0
                        findedUsers.forEach((element, index, array) => {
                            addCount(element).then((result) => {
                                findedUsers[index].dataValues.count = result
                                i++
                                if(i == array.length){
                                    callback()
                                }
                            })
                        })
                        function callback(){
                            res.render('manager/manager_directives', { extractStyles: true, title: 'Menu', session: req.session.client, options_top_bar: 'telemarketing', findedUsers : findedUsers, findedSource : findedSource, findedType : findedType, findedCampagnes : findedCampagnes, _ : _});
                        }
                    })
                })
            })
        }else{
            req.flash('error_msg', 'Un problème est survenu, veuillez réessayer. Si le probleme persiste veuillez en informer votre superieur.');
            res.redirect('/menu');
        }
    }).catch(function (e) {
        req.flash('error', e);
    });
});

router.post('/update/directives' ,(req, res, next) => {

    let idDependence = []
    req.session.client.Usersdependences.forEach((element => {
        idDependence.push(element.idUserInf)    
    }))

    idDependence.push(req.session.client.id)

    models.Directive.findOne({ where: {idUser : req.body.idUser}})
    .then((directive) => {
        if(directive) {
            directive.update(req.body).then((event) => {

                models.User.findAll({
                    include: [  
                        {model: models.Role, include: models.Privilege},
                        {model: models.Directive},
                        {model: models.Structure ,include: models.Type}
                    ],
                    where : {
                        id: {
                            [Op.in]: idDependence
                        }
                    }
                }).then(findedUsers => {
                    if(findedUsers){
                        models.Campagne.findAll({
                            where : {
                                etat_campagne : 1
                            }
                        }).then((findedCampagnes) => {
                        let i = 0
                        findedUsers.forEach((element, index, array) => {
                            addCount(element).then((result) => {
                                console.log(result)
                                findedUsers[index].dataValues.count = result
                                i++
                                if(i == array.length){
                                    callback()
                                }
                            })
                        })
                        function callback(){
                            res.send({findedUsers:findedUsers, findedCampagnes:findedCampagnes, _:_})
                        }
                        })
                    }else{
                        req.flash('error_msg', 'Un problème est survenu, veuillez réessayer. Si le probleme persiste veuillez en informer votre superieur.');
                        res.redirect('/menu');
                    }
                }).catch(function (e) {
                    req.flash('error', e);
                });
            });
        }else{
            models.Directive.create(req.body).then((event) => {
                models.User.findAll({
                    include: [  
                        {model: models.Role, include: models.Privilege},
                        {model: models.Directive},
                        {model: models.Structure ,include: models.Type}
                    ],
                    where : {
                        id: {
                            [Op.in]: idDependence
                        }
                    }
                }).then(findedUsers => {
                    if(findedUsers){ 
                        odels.Campagne.findAll({
                            where : {
                                etat_campagne : 1
                            }
                        }).then((findedCampagnes) => {
                        let i = 0
                        findedUsers.forEach((element, index, array) => {
                            addCount(element).then((result) => {
                                findedUsers[index].dataValues.count = result
                                i++
                                if(i == array.length){
                                    callback()
                                }
                            })
                        })
                        function callback(){
                            res.send({findedUsers:findedUsers, findedCampagnes:findedCampagnes, _:_})
                        }
                    })
                    }else{
                        req.flash('error_msg', 'Un problème est survenu, veuillez réessayer. Si le probleme persiste veuillez en informer votre superieur.');
                        res.redirect('/menu');
                    }
                }).catch(function (e) {
                    req.flash('error', e);
                });
            });;
        }
    })
});

router.get('/agenda' ,(req, res, next) => {
    let StructuresId = []
    req.session.client.Structures.forEach(s => {
        StructuresId.push(s.id)
    })
    models.Structuresdependence.findAll({
        where : {
            idStructure: {
                [Op.in] : StructuresId
            }
        },
        attributes: ['idUser']
    }).then(findedStructuredependence => {
        let dependence = []
        findedStructuredependence.forEach((element) => {
            dependence.push(element.idUser)
        })
        models.User.findAll({
            where: {
                id: {
                    [Op.in] : dependence,
                }
            },
            order: [['nom', 'asc']],
        }).then(findedUsers => {
            models.Event.findAll({
                include: [
                    {model: models.User, 
                        where: {
                                id: {
                                    [Op.in] : dependence
                                }
                            }
                    }
                ],
                order : [['start', 'DESC']]
            }).done( (findedEvents) => {
                res.render('manager/manager_agenda', { extractStyles: true, title: 'Agenda | FUEGO', description:'Agenda manager', session: req.session.client, options_top_bar: 'telemarketing', findedUsers: findedUsers, findedEvents: findedEvents})
            })
        })
    })
});

router.post('/agenda/delete' ,(req, res, next) => {
    
    models.Event.destroy({
        where: {
            id: req.body.id
        }
    }).then( deleteEvent => {
        let StructuresId = []
        req.session.client.Structures.forEach(s => {
            StructuresId.push(s.id)
        })

        models.Structuresdependence.findAll({
            where : {
                idStructure: StructuresId
            },
            attributes: ['idUser']
        }).then(findedStructuredependence => {
            let dependence = []
            findedStructuredependence.forEach((element) => {
                dependence.push(element.idUser)
            })
            models.User.findAll({
                where: {
                    id: {
                        [Op.in] : dependence,
                    }
                },
                order: [['nom', 'asc']],
            }).then(findedUsers => {
                models.Event.findAll({
                    include: [
                        {model: models.User, 
                            where: {
                                    id: {
                                        [Op.in] : dependence
                                    }
                                }
                        }
                    ],
                    order : [['start', 'DESC']]
                }).done((findedEvents) => {
                    res.send({findedEvents: findedEvents})
                })
            })
        })
    }).catch(e => {
        res.send('error')
    })
});

router.post('/agenda/ajoute-event' ,(req, res, next) => {
    let StructuresId = []
    req.session.client.Structures.forEach(s => {
        StructuresId.push(s.id)
    })

    let pattern = 'YYYY/MM/DD HH:mm'
    if(req.body.allDay === 'true') {
        pattern = 'DD/MM/YYYY'
    }
    req.body.start = moment(req.body.start, pattern).format('YYYY/MM/DD HH:mm')
    req.body.end = moment(req.body.end, pattern).format('YYYY/MM/DD HH:mm')

    models.Event.create(req.body).done( (createdEvent) => {
        models.Structuresdependence.findAll({
            where : {
                idStructure: StructuresId
            },
            attributes: ['idUser']
        }).then(findedStructuredependence => {
            let dependence = []
            findedStructuredependence.forEach((element) => {
                dependence.push(element.idUser)
            })
            models.User.findAll({
                where: {
                    id: {
                        [Op.in] : dependence,
                    }
                },
                order: [['nom', 'asc']],
            }).then(findedUsers => {
                models.Event.findAll({
                    include: [
                        {model: models.User, 
                            where: {
                                    id: {
                                        [Op.in] : dependence
                                    }
                                }
                        }
                    ],
                    order : [['start', 'DESC']]
                }).done((findedEvents) => {
                    res.send({findedEvents: findedEvents})
                })
            })
        })
    })
});

router.get('/objectifs' ,(req, res, next) => {
    let StructuresId = []
    req.session.client.Structures.forEach(s => {
        StructuresId.push(s.id)
    })
    models.Structuresdependence.findAll({
        where : {
            idStructure: StructuresId
        },
        attributes: ['idUser']
    }).then(findedStructuredependence => {
        let dependence = []
        findedStructuredependence.forEach((element) => {
            dependence.push(element.idUser)
        })
        models.User.findAll({
            where: {
                id: {
                    [Op.in] : dependence,
                }
            },
            order: [['nom', 'asc']],
        }).then(findedUsers => {
            res.render('manager/manager_objectifs', { extractStyles: true, title: 'Objectifs | FUEGO', description:'Objectifs manager', session: req.session.client, options_top_bar: 'telemarketing', findedUsers : findedUsers});
        })
    })
});

router.post('/objectifs/rdv' ,(req, res, next) => {
    models.RDV.findAll({
        include: [
            {model: models.User},
            {model: models.Client}
        ],
        where: { date : {
            [Op.between]: [req.body.datestart, req.body.dateend], 
        }
    }}).then(findedRdvs => {
        res.send({findedRdvs : findedRdvs});
    })
});

router.post('/objectifs/abs' ,(req, res, next) => {
    models.sequelize.query("SELECT * FROM Events WHERE start <= CONCAT(:date, '00:00:00') AND end >= :date", {replacements: { date: req.body.date}, type: sequelize.QueryTypes.SELECT})
    .then(findedAbs => {
        res.send({findedAbs : findedAbs});
    })
});

async function getListeRdvs(user, dateDebut = undefined, dateFin = undefined) {
    let StructuresId = []
    let StructuresDeps = []

    user.Structures.forEach(structure => {
        StructuresId.push(structure.id)
        structure.deps.split(',').forEach(dep => {
            StructuresDeps.push(dep)
        })
    })

    if(!isSet(dateDebut) && !isSet(dateFin)) {
        dateDebut = `${moment().format('YYYY-MM-DD')} 00:00:00`
        dateFin = `${moment().format('YYYY-MM-DD')} 23:59:59`
    }    

    let whereDate = {}

    if(isSet(dateDebut) && isSet(dateFin)) {
        whereDate = {
            date : {
                [Op.between] : [dateDebut, dateFin]
            }
        }
    }
    else if(isSet(dateDebut)) {
        whereDate = {
            date : {
                [Op.gte] : dateDebut
            }
        }
    }
    else if(isSet(dateFin)) {
        whereDate = {
            date : {
                [Op.lte] : dateDebut
            }
        }
    }

    return models.RDV.findAll({
        include: [
            {
                model : models.Client,
                include : {
                    model : models.Historique,
                    order : [['Historiques.id', 'desc']]
                }
            },
            {
                model : models.Historique, 
                include: [
                    {
                        model : models.User, 
                        include : [
                            { model : models.Structure }
                        ]
                    }
                ]
            },
            {model : models.User},
            {model : models.Etat},
            {model : models.Campagne}
        ],
        where: {
            // date : {
            //     [Op.between] : [dateDebut, dateFin]
            // },
            ...whereDate,
            [Op.or] : [
                {
                    [Op.and] : [      
                        {
                            '$Historique->User->Structures.id$': {
                                [Op.in] : StructuresId
                            }
                        },    
                        {          
                            '$Client.dep$': {
                                [Op.in] : StructuresDeps
                            }
                        }
                    ]
                },
                { 
                    source : {
                        [Op.in] : ['BADGING', 'PARRAINAGE', 'PERSO']
                    } 
                }
            ]
            // '$Historique->User->Structures.id$': {
            //     [Op.in] : StructuresId
            // },
            // '$Client.dep$': {
            //     [Op.in] : StructuresDeps
            // }
        },
        order: [['date', 'asc']],
    })
}

// ajoute le booléen hasNewDate à tous les RDVs et le passe à true à ceux qui ont un état de repositionnement (DEM SUIVI, REPO COMMERCIAL, REPO CLIENT) avec un nouveau rdv de déjà fixé
function addHasNewDate(listeRdvs) {
    for(let i = 0; i < listeRdvs.length; i++) {
        const rdv = listeRdvs[i]
        let hasNewDate = false
        // si DEM SUIVI ou REPO COMMERCIAL ou REPO CLIENT
        if([2,12,13].includes(Number(rdv.idEtat))) {
            rdv.hasNewDate = false
            // recherche si un nouveau RDV a été pris
            for(const historique of rdv.Client.Historiques) {
                // si l'historique est antérieur ou celui traité, on passe
                if(rdv.Historique.id >= historique.id) continue
                // s'il y a un historique plus récent avec un rdv, on indique q'un rdv a bien été pris
                if(Number(historique.idAction) === 1) {
                    rdv.hasNewDate = true
                    hasNewDate = true
                    break
                }
            }
        }

        // conversion en objet classique puis ajout de la nouvelle propriété afin qu'elle puisse être envoyée
        listeRdvs[i] = rdv.toJSON()
        listeRdvs[i].hasNewDate = hasNewDate
    }

    return listeRdvs
}

router.get('/liste-rendez-vous' , async (req, res) => {
    res.render('manager/manager_listerdv', { extractStyles: true, title: 'Liste RDV', description:'Liste des rendez-vous Manager', session: req.session.client, options_top_bar: 'telemarketing', date: moment().format('DD/MM/YYYY')});
});

router.post('/liste-rendez-vous' ,async (req, res) => {
    let infoObject = undefined
    let listeRdvs = undefined
    let dateDebut = req.body.datedebut
    let dateFin = req.body.datefin

    try {
        if(!isSet(dateDebut) && !isSet(dateFin)) throw "Une date de début ou de fin doit être choisie."

        if(isSet(dateDebut)) dateDebut = `${moment(dateDebut, 'DD/MM/YYYY').format('YYYY-MM-DD')} 00:00:00`
        if(isSet(dateFin)) dateFin = `${moment(dateFin, 'DD/MM/YYYY').format('YYYY-MM-DD')} 23:59:59`

        listeRdvs = await getListeRdvs(req.session.client, dateDebut, dateFin)

        if(listeRdvs === null || listeRdvs.length === 0) {
            infoObject = clientInformationObject(undefined, "Aucun RDV disponible.")
        }
        else {  
            listeRdvs = addHasNewDate(listeRdvs)
        }        
    }
    catch(error) {
        infoObject = clientInformationObject(error)
        listeRdvs = undefined
    }

    res.send({
        infoObject,
        listeRdvs
    })
});

router.post('/liste-rendez-vous/delete-rendez-vous' ,(req, res, next) => {
    models.RDV.findOne({
        where: {
            id : req.body.id 
        }
    }).then(findedRdv => {
        findedRdv.destroy()
        .then(() => {
            models.Historique.findOne({
                where: {
                    idRdv : req.body.id 
                }
            }).then(findedHisto => {
                findedHisto.destroy()
                .then(() => {
                    res.send('OK')
                })
            })
        }).catch(function (e) {
            req.flash('error', e);
        });
    });
});

router.post('/compte-rendu' ,(req, res, next) => {

    models.RDV.findOne({
        include: [
            {model : models.Client},
            {model : models.Historique, include: [
                {model : models.User, include : [
                    {model : models.Structure}
                ]}
            ]},
            {model : models.User},
            {model : models.Etat},
            {model : models.Campagne}
        ],
        where: {
            id: req.body.id
        }
    }).then(findedRdv => {
        if(!findedRdv){
            req.flash('error_msg', 'Un problème est survenu, veuillez réessayer. Si le probleme persiste veuillez en informer votre superieur.');
            res.redirect('/menu');
        }
        let StructuresId = []
        req.session.client.Structures.forEach(s => {
            StructuresId.push(s.id)
        })
        models.Structuresdependence.findAll({
            where : {
                idStructure: StructuresId
            },
            attributes: ['idUser']
        }).then(findedStructuredependence => {
            let dependence = []
            findedStructuredependence.forEach((element) => {
                dependence.push(element.idUser)
            })
            models.User.findAll({
                where: {
                    id: {
                        [Op.in] : dependence,
                    }
                },
                order: [['nom', 'asc']],
            }).then(findedUsers => {
                if(findedUsers){
                    let accesFicheClient = false

                    if(["Manager", "Admin"].includes(req.session.client.Role.nom)) {
                        accesFicheClient = true
                    }

                    res.send({ findedRdv: findedRdv, findedUsers: findedUsers, accesFicheClient });
                }else{
                    req.flash('error_msg', 'Un problème est survenu, veuillez réessayer. Si le probleme persiste veuillez en informer votre superieur.');
                    res.redirect('/menu');
                }
            }).catch(function (e) {
                console.log('error', e);
            });
        }).catch(function (e) {
            console.log('error', e);
        });  
    }).catch(function (e) {
        console.log('error', e);
    });
});

router.post('/update/compte-rendu' , async (req, res) => {
    let infoObject = undefined

    req.body.idUser = req.session.client.id
    req.body.idEtat = req.body.idEtat == '' ? null : req.body.idEtat
    req.body.idVendeur = req.body.idVendeur ==  '' ? null : req.body.idVendeur
    if(isSet(req.body.datenew)) req.body.datenew = moment(req.body.datenew, 'DD/MM/YYYY HH:mm').format('YYYY-MM-DD HH:mm')

    try {
        try {
            ovh.request('GET', '/sms/', async (err, service_sms) => {
                if(err) throw `Erreur ovh service sms : ${err}`

                const findedRdv = await models.RDV.findOne({
                    include: [
                        {model : models.Historique, include: models.Client }  
                    ],
                    where: {
                        id: req.body.idRdv
                    }
                })
                
                let exist = false
                let number = getNumber(findedRdv.Historique.Client.tel1, findedRdv.Historique.Client.tel2, findedRdv.Historique.Client.tel3)    
                
                ovh.request('GET', '/sms/'+service_sms[0]+'/jobs/', (err, result3) => {
                    let i = 0
                    if(typeof err == 'undefined'){
                        result3.forEach((element, index, array) => {
                            ovh.request('GET', '/sms/'+service_sms[0]+'/jobs/'+element, (err, result2) => {
                                if((result2.receiver) == "+33"+number){
                                    exist = result2.id
                                }
                                i++
                                if(i === array.length) {
                                    if(req.body.statut == 1){
                                        if(exist == false){
                                            let diff = moment(moment(findedRdv.date, 'DD/MM/YYYY HH:mm').format('YYYY-MM-DD')).add(8, 'hours').diff(moment(), 'minutes')
                                            if(diff > 0 && number){
                                                console.log('send message')
                                                let content = {
                                                    "charset" : "UTF-8",
                                                    "class" : "phoneDisplay",
                                                    "coding" : "7bit",
                                                    "differedPeriod" : diff, 	
                                                    "message" : "Bonjour M./MME. " + findedRdv.Historique.Client.nom + ", nous confirmons votre RDV de ce jour à " + moment(findedRdv.date, 'DD/MM/YYYY HH:mm').format('HH:mm') + " avec notre technicien. Visitez notre site internet www.hitech-habitats-services.com",
                                                    "noStopClause" : true,
                                                    "priority" : "high",
                                                    "receivers" : ["+33"+number],
                                                    "senderForResponse" : true,
                                                    "validityPeriod" : 2880
                                                }
                                                /*ovh.request('POST', '/sms/'+service_sms[0]+'/jobs/', content , (err, result2) => {
                                                    console.log(err || result2);
                                                })*/
                                            }
                                        }else{
                                            console.log('allready send message')
                                        }
                                    }else{
                                        if(exist != false){
                                            ovh.request('DELETE', '/sms/'+service_sms[0]+'/jobs/'+exist, (err, result) => {
                                                console.log('delete message')
                                            })
                                        }
                                    }
                                }
                            })
                        })
                    }
                })
            })
        }
        catch(error) {
            console.error(error)
        }

        // cherche le rdv
        const rdv = await models.RDV.findOne({
            include: [
                {model : models.Client},
                {model : models.Historique, include: [
                    {model : models.User, include : [
                        {model : models.Structure}
                    ]}
                ]},
                {model : models.User},
                {model : models.Etat},
                {model : models.Campagne}
            ],
            where: {
                id: req.body.idRdv
            }
        })

        if(rdv === null) throw "Le RDV est introuvable"

        // on vérifie s'il existe un historique en hors critère pour le retirer (cas d'une erreur)
        if(Number(req.body.statut) !== 2) {
            const historique = await models.Historique.findOne({
                where : {
                    idClient : rdv.idClient,
                    idAction : 5
                },
                order : [['id', 'DESC']]
            })

            if(historique !== null) {
                historique.destroy()
            }
        }
        
        // statut hors critère
        // création d'un historique en hors critères
        if(Number(req.body.statut) === 2) {
            const temp_histo = {
                idAction : 5,
                idCampagne: rdv.Historique.idCampagne,
                sousstatut : req.body.sousstatut,
                commentaire : req.body.commentaireHC,
                dateevent: moment(rdv.date, 'DD/MM/YYYY HH:mm').format('YYYY-MM-DD HH:mm'),
                idClient: rdv.Historique.idClient,
                idUser: rdv.Historique.idUser
            }

            const historique = await models.Historique.create(temp_histo)
            // req.body.idHisto = historique.id
        }
        // compte rendu hors critère
        if(Number(req.body.idEtat) === 14) {      
            req.body.commentaire = req.body.commentaireHC

            // màj de l'historique de rdv en cours
            rdv.Historique.sousstatut = req.body.sousstatut
            rdv.Historique.commentaire = req.body.commentaire
            // await rdv.Historique.save()
        }        

        // retrait du sous statut et du commentaire s'il y en avait un et qu'il n'y en a plus
        if(rdv.Historique.sousstatut && !req.body.sousstatut) {
            rdv.Historique.sousstatut = null
        }
        if(rdv.Historique.commentaire && (!req.body.commentaire || !req.body.commentaireHC)) {
            rdv.Historique.commentaire = null
        }

        const tabPromises = [
            // met à jour l'historique si des modifs ont été apportées
            rdv.Historique.save(),
            // met à jour le rdv
            rdv.update(req.body),
            // crée le log de la modification du rdv
            models.logRdv.create(req.body)
        ]

        await Promise.all(tabPromises)

        // si le statut est à repositionner et qu'une date est fixée on crée l'historique du rappel
        if(Number(req.body.statut) === 3 && isSet(req.body.dateRappel)) {
            const historique = await models.Historique.create({
                idAction : 8,
                idCampagne: rdv.Historique.idCampagne,
                dateevent: moment(req.body.dateRappel, 'DD/MM/YYYY HH:mm').format('YYYY-MM-DD HH:mm'),
                idClient: rdv.Historique.idClient,
                idUser: rdv.Historique.idUser,
                commentaire : isSet(req.body.commentaireRappel) ? req.body.commentaireRappel : null
            })

            if(historique === null) throw "Erreur lors de la création du rappel."

            rdv.Client.currentAction = 8
            await rdv.Client.save()
        }
        // si le rdv est reporté
        else if(req.body.datenew != "" && typeof req.body.datenew != 'undefined') {
            const temp_histo = {
                idAction: 1,
                idCampagne: rdv.Historique.idCampagne,
                dateevent: req.body.datenew,
                idClient: rdv.Historique.idClient,
                idUser: rdv.Historique.idUser
            }

            const historique = await models.Historique.create(temp_histo)

            const temp_rdv = {
                idClient: historique.idClient,
                idHisto: historique.id,
                idVendeur: rdv.idVendeur,
                idCampagne: rdv.Historique.idCampagne,
                idEtat: 0,
                commentaire: req.body.commentaireNew,
                date: req.body.datenew,
                r: req.body.rnew != "" ? req.body.rnew : null,
                source : rdv.source
            }

            const rdv_new = await models.RDV.create(temp_rdv)

            historique.idRdv = rdv_new.id
            await historique.save()
        }

        infoObject = clientInformationObject(undefined, "Le compte rendu a bien été ajouté.")
    }
    catch(error) {
        infoObject = clientInformationObject(error)
    }

    res.send({
        infoObject
    })    
});

router.post('/get-type' ,(req, res, next) => {
    models.Client.aggregate('type', 'DISTINCT', {
        plain: false,
        where: {
            source: req.body.type_de_fichier
        }
    })
    .then(findedType => {
        res.send(findedType);
    })
});

function getServiceSMS() {
    return new Promise((resolve, reject) => {
        try {
            ovh.request('GET', '/sms/', (err, service_sms) => {
                if(err) reject(`Erreur ovh service sms : ${err}`)

                resolve(service_sms)
            })
        }
        catch(error) {
            reject(error)
        }
    })
}

function getSMS(service_sms, action = 'incoming', id) {
    return new Promise((resolve, reject) => {
        try {
            ovh.request('GET', `/sms/${service_sms}/${action}/${id}`, (err, sms) => {
                if(err) reject(`Erreur ovh récupération sms ${action} id=${id} : ${err}`)
        
                resolve(sms)
            })
        }
        catch(error) {
            reject(error)
        }
    })
}

function getListeIdSMS(service_sms, action, dateDebut, dateFin) {
    return new Promise((resolve, reject) => {
        try {
            ovh.request('GET', `/sms/${service_sms}/${action}?creationDatetime.from=${dateDebut}&creationDatetime.to=${dateFin}`, async (err, listeIdSMS) => {
            // ovh.request('GET', `/sms/${service_sms}/${action}`, async (err, listeIdSMS) => {
                if(err) reject(`Erreur ovh récupération liste id sms ${action} : ${err}`)
        
                if(listeIdSMS == null || listeIdSMS.length === 0) resolve([])

                resolve(listeIdSMS)
            })
        }
        catch(error) {
            reject(error)
        }
    })
}

function getListeSMS(action = 'incoming', dateDebut, dateFin) {
    return new Promise(async (resolve, reject) => {
        try {
            const service_sms = await getServiceSMS()

            if(service_sms === null || service_sms.length === 0) throw 'Aucun service sms disponible.'

            const listeIdSMS = await getListeIdSMS(service_sms, action, dateDebut, dateFin)

            if(listeIdSMS == null || listeIdSMS.length === 0) resolve([])

            const listeSMS = await Promise.all(listeIdSMS.map(async (id) => {
                const sms = await getSMS(service_sms, action, id)
                return formatSMS(sms, action)
            }))

            resolve(listeSMS)
        }
        catch(error) {
            reject(error)
        }
    })
}

async function formatSMS(sms, action = 'incoming') {
    const formatedSMS = {
        id : sms.id,
        message : sms.message,
        date : action === 'incoming' ? moment(sms.creationDatetime).format('DD/MM/YYYY HH:mm') : moment(sms.sentAt).format('DD/MM/YYYY HH:mm'),
        client : '?',
        numero : action === 'incoming' ? sms.sender.replace('+33', '0') : sms.receiver.replace('+33', '0')
    }

    try {
        const client = await models.Client.findOne({
            attributes : ['prenom', 'nom'],
            where : {
                [Op.or] : [
                    { tel1 : formatedSMS.numero },
                    { tel2 : formatedSMS.numero },
                    { tel3 : formatedSMS.numero }
                ]
            }
        })

        if(client === null) throw `formatSMS - aucun client correspondant au ${formatedSMS.numero}`

        formatedSMS.client = `${client.prenom} ${client.nom}`
    }
    catch(error) {
        clientInformationObject(error)
        formatedSMS.client = '?'
    }

    return formatedSMS
}

router
// accès à la page des sms
.get('/sms', (req, res) => {
    res.render('manager/manager_sms', { extractStyles: true, title: 'SMS | FUEGO', description:'SMS envoyés / reçus', session: req.session.client, options_top_bar: 'telemarketing', dateDebut : moment().startOf('month').format('DD/MM/YYYY'), dateFin : moment().endOf('month').format('DD/MM/YYYY') });
})
// récupère les sms envoyés
.get('/sms/sent', async (req, res) => {
    let infoObject = undefined
    let smsSent = undefined

    let dateDebut = req.query.dateDebut
    let dateFin = req.query.dateFin

    try {
        if(isSet(dateDebut) && isSet(dateFin)) {
            dateDebut = moment(dateDebut, 'DD/MM/YYYY').format('YYYY-MM-DD')
            dateFin = moment(dateFin, 'DD/MM/YYYY').format('YYYY-MM-DD')
        }
        else if(isSet(dateDebut)) {
            dateDebut = moment(dateDebut, 'DD/MM/YYYY').format('YYYY-MM-DD')
            dateFin = moment().format('YYYY-MM-DD')
        }
        else if(isSet(dateFin)) {
            dateDebut = moment().format('YYYY-MM-DD')
            dateFin = moment(dateFin, 'DD/MM/YYYY').format('YYYY-MM-DD')
        }
        else {
            dateDebut = moment().format('YYYY-MM-DD')
            dateFin = moment().format('YYYY-MM-DD')
        }

        smsSent = await getListeSMS('outgoing', dateDebut, dateFin)

        if(smsSent === null || smsSent.length === 0) infoObject = clientInformationObject(undefined, 'La liste des SMS envoyés est vide.')
    }
    catch(error) {
        infoObject = clientInformationObject(error)
        smsSent = undefined
    }

    res.send({
        infoObject,
        smsSent
    })
})
// récupère les sms reçus
.get('/sms/received', async (req, res) => {
    let infoObject = undefined
    let smsReceived = undefined

    let dateDebut = req.query.dateDebut
    let dateFin = req.query.dateFin

    try {
        if(isSet(dateDebut) && isSet(dateFin)) {
            dateDebut = moment(dateDebut, 'DD/MM/YYYY').format('YYYY-MM-DD')
            dateFin = moment(dateFin, 'DD/MM/YYYY').format('YYYY-MM-DD')
        }
        else if(isSet(dateDebut)) {
            dateDebut = moment(dateDebut, 'DD/MM/YYYY').format('YYYY-MM-DD')
            dateFin = moment().format('YYYY-MM-DD')
        }
        else if(isSet(dateFin)) {
            dateDebut = moment().format('YYYY-MM-DD')
            dateFin = moment(dateFin, 'DD/MM/YYYY').format('YYYY-MM-DD')
        }
        else {
            dateDebut = moment().format('YYYY-MM-DD')
            dateFin = moment().format('YYYY-MM-DD')
        }

        smsReceived = await getListeSMS('incoming', dateDebut, dateFin)

        if(smsReceived === null || smsReceived.length === 0) infoObject = clientInformationObject(undefined, 'La liste des SMS reçus est vide.')
    }
    catch(error) {
        infoObject = clientInformationObject(error)
        smsReceived = undefined
    }

    res.send({
        infoObject,
        smsReceived
    })
})
// supprime un sms
.delete('/sms/delete/:action/:id', async (req, res) => {
    const action = req.params.action
    const id = req.params.id
    
    let infoObject = undefined

    try {
        if(!["incoming", "outgoing"].includes(action)) throw `${action} : action inconnue.`

        const service_sms = await getServiceSMS()

        if(service_sms === null || service_sms.length === 0) throw 'Aucun service sms disponible.'

        await (new Promise((resolve, reject) => {
            ovh.request('DELETE', `/sms/${service_sms}/${action}/${id}`, (err, errorStatus) => {
                if(err) reject(`Erreur ovh lors de la suppression du sms ${action}/${id} : ${err} - ${errorStatus}`)
                
                resolve()
            })
        }))

        infoObject = clientInformationObject(undefined, "Le sms a bien été supprimé.")
    }
    catch(error) {
        infoObject = clientInformationObject(error)
    }

    res.send({
        infoObject
    })
})

function getNumber(tel1,tel2,tel3){
    if(tel1 == null || !isSet(tel1)){
        tel1 = "0300000000"
    }
    if(tel2 == null || !isSet(tel2)){
        tel2 = "0300000000"
    }
    if(tel3 == null || !isSet(tel3)){
        tel3 = "0300000000"
    }

    let regex = /^((\+)330|0)[6](\d{2}){4}$/g
    if(formatPhone(tel1).match(regex) != null){
        return tel1
    }
    if(formatPhone(tel2).match(regex) != null){
        return tel2
    }
    if(formatPhone(tel3).match(regex) != null){
        return tel3
    }
    return false
}

function formatPhone(phoneNumber){

    if(phoneNumber != null && typeof phoneNumber != 'undefined' && phoneNumber != ' '){
        phoneNumber = cleanit(phoneNumber);
	    phoneNumber = phoneNumber.split(' ').join('')
        phoneNumber = phoneNumber.split('.').join('')

        if(phoneNumber.length != 10){

            phoneNumber = '0'+phoneNumber;

            if(phoneNumber.length != 10){
                return undefined
            }else{
                return phoneNumber
            }
        }else{
            return phoneNumber
        }
    }

}

function cleanit(input) {
    input.toString().trim().split('/\s*\([^)]*\)/').join('').split('/[^a-zA-Z0-9]/s').join('')
	return input.toString().toLowerCase()
}

module.exports = router;

Array.prototype.insert = function ( index, item ) {
    this.splice( index, 0, item );
};

async function addCount(user){

    let where

    if(typeof user.Directive != 'undefined' && user.Directive != null && user.Directive.campagnes != null && user.Directive.campagnes.split(',').length >= 1 && user.Directive.campagnes.split(',')[0] != ''){
        where = await models.Campagne.findAll({
            where : {
                id: {
                    [Op.in] : user.Directive.campagnes.split(',')
                }
            }
        }).then(findedCampagnes => {
            let deps = []
            let where
            findedCampagnes.forEach((element) => {
                deps.push(element.deps.split(','))
            })

            deps = _.uniq(_.flatten(deps))

            if(user.Directive.deps.split(',').length >= 1 && user.Directive.deps.split(',')[0] != ''){
                where = {
                    dep : {
                        [Op.in] : user.Directive.deps.split(',')
                    },
                    currentCampagne :{
                        [Op.in]: user.Directive.campagnes.split(',')
                    },
                }
            }else {
                where = {
                    dep : {
                        [Op.in] : deps
                    },
                    currentCampagne :{
                        [Op.in]: user.Directive.campagnes.split(',')
                    },
                }
            }
            return where
        })
    }else{
        if(typeof user.Directive != 'undefined' && user.Directive != null){
            if(user.Directive.deps.split(',').length > 1){
                where = {
                    dep : {
                        [Op.in] : user.Directive.deps.split(',')
                    },
                    source : {
                        [Op.substring] : user.Directive.type_de_fichier
                    },
                    type : {
                        [Op.substring] : user.Directive.sous_type
                    },
                    currentAction :{
                        [Op.is]: null
                    },
                }
            }else if(user.Directive.deps.split(',').length == 0) {
                where = {
                    source : {
                        [Op.substring] : user.Directive.type_de_fichier
                    },
                    type : {
                        [Op.substring] : user.Directive.sous_type
                    },
                    currentAction :{
                        [Op.is]: null
                    },
                }
            }else{
                where = {
                    dep : user.Directive.deps.split(','),
                    source : {
                        [Op.substring] : user.Directive.type_de_fichier
                    },
                    type : {
                        [Op.substring] : user.Directive.sous_type
                    },
                    currentAction :{
                        [Op.is]: null
                    },
                }
            }
            }else{
                where = {}
            }
    }

    result = await models.Client.count({
        where : where
    }).then((count) => {
        return count
    }).catch(er => {
        console.log(er)
    })

    return result

}