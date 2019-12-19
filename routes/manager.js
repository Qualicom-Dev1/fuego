const express = require('express');
const router = express.Router();
const models = require("../models/index");
const moment = require('moment');
const sequelize = require('sequelize')
const Op = sequelize.Op;
const config = require('./../config/config.json');
const dotenv = require('dotenv')
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
            models.Client.aggregate('source', 'DISTINCT', {plain: false})
            .then(findedSource => {
                models.Client.aggregate('type', 'DISTINCT', {plain: false})
                .then(findedType => {
                    let i = 0
                    findedUsers.forEach((element, index, array) => {
                        addCount(element).then((result) => {
                            console.log(result)
                            findedUsers[index].dataValues.count = result
                            i++
                            console.log(i)
                            if(i == array.length){
                                callback()
                            }
                        })
                    })

                    function callback(){
                        res.render('manager/manager_directives', { extractStyles: true, title: 'Menu', session: req.session.client, options_top_bar: 'telemarketing', findedUsers : findedUsers, findedSource : findedSource, findedType : findedType});
                    }
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
                            console.log(findedUsers)
                            res.send(findedUsers)
                        }
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
                            res.send(findedUsers)
                        }
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
                ]
            }).done( (findedEvents) => {
                console.log(findedEvents)
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
                    ]
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
                    ]
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

router.get('/liste-rendez-vous' ,(req, res, next) => {
    console.log('-----------------------------------------------------------------------------------------------')
    let StructuresId = []
    let StructuresDeps = []
    req.session.client.Structures.forEach(s => {
        StructuresId.push(s.id)
        s.deps.split(',').forEach(d => {
            StructuresDeps.push(d)
        })
    })
    req.session.client.Structures.forEach(s => {
        StructuresId.push(s.id)
    })
    models.RDV.findAll({
        include: [
            {model : models.Client},
            {model : models.Historique, include: {
                model : models.User, include : [
                    {model : models.Structure}
                ]
            }},
            {model : models.User},
            {model : models.Etat},
            {model : models.Campagne}
        ],
        where: {
            date : {
                [Op.between] : [moment().format('YYYY-MM-DD'), moment().add(1, 'days').format('YYYY-MM-DD')]
            },
            '$Historique->User->Structures.id$': {
                [Op.in] : StructuresId
            },
            '$Client.dep$': {
                [Op.in] : StructuresDeps
            }
        },
        order: [['date', 'asc']],
    }).then(findedRdvs => {
        console.log('-----------------------------------------------------------------------------------------------')
        if(findedRdvs){
            res.render('manager/manager_listerdv', { extractStyles: true, title: 'Liste RDV', description:'Liste des rendez-vous Manager', findedRdvs: findedRdvs, session: req.session.client, options_top_bar: 'telemarketing', date: moment().format('DD/MM/YYYY')});
        }else{
            req.flash('error_msg', 'Un problème est survenu, veuillez réessayer. Si le probleme persiste veuillez en informer votre superieur.');
            res.redirect('/menu');
        }
    }).catch(function (e) {
        req.flash('error', e);
    });
});

router.post('/liste-rendez-vous' ,(req, res, next) => {
    let StructuresId = []
    let StructuresDeps = []
    req.session.client.Structures.forEach(s => {
        StructuresId.push(s.id)
        s.deps.split(',').forEach(d => {
            StructuresDeps.push(d)
        })
    })
    models.RDV.findAll({
        include: [
            {model : models.Client},
            {model : models.Historique, include: {
                model : models.User, include : [
                    {model : models.Structure}
                ]
            }},
            {model : models.User},
            {model : models.Etat},
            {model : models.Campagne}
        ],
        where: {
            date : {
                [Op.between] : [moment(req.body.datedebut, 'DD/MM/YYYY').format('MM-DD-YYYY'), moment(moment(req.body.datefin, 'DD/MM/YYYY').format('MM-DD-YYYY')).add(1, 'days')]
            },
            '$Historique->User->Structures.id$': {
                [Op.in] : StructuresId
            },
            '$Client.dep$': {
                [Op.in] : StructuresDeps
            }
        },
        order: [['date', 'asc']],
    }).then(findedRdvs => {
        if(findedRdvs){
            res.send(findedRdvs);
        }else{
            req.flash('error_msg', 'Un problème est survenu, veuillez réessayer. Si le probleme persiste veuillez en informer votre superieur.');
            res.redirect('/menu');
        }
    }).catch(function (e) {
        req.flash('error', e);
    });
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
            {model : models.Historique},
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
                    res.send({findedRdv: findedRdv, findedUsers: findedUsers});
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

router.post('/update/compte-rendu' ,(req, res, next) => {

    req.body.idUser = req.session.client.id
    req.body.idEtat = req.body.idEtat == '' ? null : req.body.idEtat
    req.body.idVendeur = req.body.idVendeur ==  '' ? null : req.body.idVendeur

    
        ovh.request('GET', '/sms/', (err, result) => {
            console.log(err || result);
            models.RDV.findOne({
                include: [
                    {model : models.Historique, include: models.Client }  
                ],
                where: {
                    id: req.body.idRdv
                }
            }).then(findedRdv => {
            let exist = false
            let number = getNumber(findedRdv.Historique.Client.tel1, findedRdv.Historique.Client.tel2, findedRdv.Historique.Client.tel3)    
            
            ovh.request('GET', '/sms/'+result[0]+'/jobs/', (err, result3) => {
                let i = 0
                result3.forEach((element, index, array) => {
                    ovh.request('GET', '/sms/'+result[0]+'/jobs/'+element, (err, result2) => {
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
                                        /*ovh.request('POST', '/sms/'+result[0]+'/jobs/', content , (err, result2) => {
                                            console.log(err || result2);
                                        })*/
                                    }
                                }else{
                                    console.log('allready send message')
                                }
                            }else{
                                if(exist != false){
                                    ovh.request('DELETE', '/sms/'+result[0]+'/jobs/'+exist, (err, result) => {
                                        console.log('delete message')
                                    })
                                }
                            }
                        }
                    })
                })
            })
        })
    })

    models.RDV.findOne({
        where: {
            id: req.body.idRdv
        }
    }).then(findedRdv => {
        if(findedRdv){
            findedRdv.update(req.body).then(() => {
                models.logRdv.create(req.body).then(() => {
                    res.send('Ok cree Log RDV');
                }).catch(error => {
                    console.log(error);
                    res.send('Pas ok cree Log RDV');
                })
            }).catch(error => {
                console.log(error);
                res.send('Pas ok Upade RDV');
            })
        }else{
            req.flash('error_msg', 'Un problème est survenu, veuillez réessayer. Si le probleme persiste veuillez en informer votre superieur.');
            res.redirect('/menu');
        }
    }).catch(function (e) {
        req.flash('error', e);
    });
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

function getNumber(tel1,tel2,tel3){
    if(tel1 == null){
        tel1 = "0300000000"
    }
    if(tel2 == null){
        tel2 = "0300000000"
    }
    if(tel3 == null){
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
    console.log(input)
    input.toString().trim().split('/\s*\([^)]*\)/').join('').split('/[^a-zA-Z0-9]/s').join('')
	return input.toString().toLowerCase()
}

module.exports = router;

Array.prototype.insert = function ( index, item ) {
    this.splice( index, 0, item );
};

async function addCount(user){
    let where
    if(typeof user.Directive != 'undefined' && user.Directive != null){
    if(user.Directive.deps.split(',').length >= 1){
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
    result = await models.Client.count({
        where : where
    }).then((count) => {
        return count
    }).catch(er => {
        console.log(er)
    })

    return result

}