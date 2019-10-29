const express = require('express');
const router = express.Router();
const models = require("../models/index");
const moment = require('moment');
const sequelize = require('sequelize')
const Op = sequelize.Op;


router.get('/' , (req, res, next) => {
    res.redirect('/manager/tableau-de-bord');
});

router.get('/tableau-de-bord' ,(req, res, next) => {
    let resultatmois = []
    let resultatsemaine = []
    let resultatjour = []

    /**
     * 
     * Mois
     * 
     */

    models.Historique.findAndCountAll({
        include: [
            {model: models.User},
            {model: models.Action},
            {model: models.RDV, include: {model: models.Etat}}
        ],
        where: {
            createdAt: {
                [Op.between] : [moment().startOf('month').format('YYYY-MM-DD') , moment().endOf('month').add(1, 'days').format('YYYY-MM-DD')]
            }
        },
        group: ['User.nom', 'Action.nom']
    }).then(findedStats => {
        models.sequelize.query("SELECT CONCAT(users.nom, ' ',users.prenom) as nomm, etats.nom, count(rdvs.id) as count FROM rdvs JOIN historiques ON rdvs.idHisto=historiques.id JOIN users ON users.id=historiques.idUser JOIN etats ON etats.id=rdvs.idEtat WHERE historiques.createdAt BETWEEN :datedebut AND :datefin GROUP BY nomm, etats.nom",
        { replacements: { 
            datedebut: moment().startOf('month').format('YYYY-MM-DD'), 
            datefin: moment().endOf('month').add(1, 'days').format('YYYY-MM-DD')
        }, type: sequelize.QueryTypes.SELECT})
        .then(findedStatsRDV => {    
            findedStats.rows.forEach((element, index) => {
                if(typeof resultatmois[element.User.nom+' '+element.User.prenom] == 'undefined'){
                    resultatmois[element.User.nom+' '+element.User.prenom] = []
                    resultatmois[element.User.nom+' '+element.User.prenom][findedStats.count[index].nom] = findedStats.count[index].count
                }else{
                    resultatmois[element.User.nom+' '+element.User.prenom][findedStats.count[index].nom] = findedStats.count[index].count
                }
            });
            findedStatsRDV.forEach((element, index) => {
                if(typeof resultatmois[element.nomm] == 'undefined'){
                    resultatmois[element.nomm] = []
                    if(element.nom == 'DEM R.A.F.' || element.nom == 'DEM SUIVI'){
                        resultatmois[element.nomm]['DEM'] = element.count
                    }else{
                        resultatmois[element.nomm][element.nom] = element.count
                    }
                }else{
                    if(element.nom == 'DEM R.A.F.' || element.nom == 'DEM SUIVI'){
                        resultatmois[element.nomm]['DEM'] = element.count
                    }else{
                        resultatmois[element.nomm][element.nom] = element.count
                    }
                }
            });

            /**
             * SEMAINE
             * 
             */

            models.Historique.findAndCountAll({
                include: [
                    {model: models.User},
                    {model: models.Action},
                    {model: models.RDV, include: {model: models.Etat}}
                ],
                where: {
                    createdAt: {
                        [Op.between] : [moment().startOf('week').format('YYYY-MM-DD') , moment().endOf('week').add(1, 'days').format('YYYY-MM-DD')]
                    }
                },
                group: ['User.nom', 'Action.nom']
            }).then(findedStats => {
                models.sequelize.query("SELECT CONCAT(users.nom, ' ',users.prenom) as nomm, etats.nom, count(rdvs.id) as count FROM rdvs JOIN historiques ON rdvs.idHisto=historiques.id JOIN users ON users.id=historiques.idUser JOIN etats ON etats.id=rdvs.idEtat WHERE historiques.createdAt BETWEEN :datedebut AND :datefin GROUP BY nomm, etats.nom",
                { replacements: { 
                    datedebut: moment().startOf('week').format('YYYY-MM-DD'), 
                    datefin: moment().endOf('week').add(1, 'days').format('YYYY-MM-DD')
                }, type: sequelize.QueryTypes.SELECT})
                .then(findedStatsRDV => {    
                    findedStats.rows.forEach((element, index) => {
                        if(typeof resultatsemaine[element.User.nom+' '+element.User.prenom] == 'undefined'){
                            resultatsemaine[element.User.nom+' '+element.User.prenom] = []
                            resultatsemaine[element.User.nom+' '+element.User.prenom][findedStats.count[index].nom] = findedStats.count[index].count
                        }else{
                            resultatsemaine[element.User.nom+' '+element.User.prenom][findedStats.count[index].nom] = findedStats.count[index].count
                        }
                    });
                    findedStatsRDV.forEach((element, index) => {
                        if(typeof resultatsemaine[element.nomm] == 'undefined'){
                            resultatsemaine[element.nomm] = []
                            if(element.nom == 'DEM R.A.F.' || element.nom == 'DEM SUIVI'){
                                resultatsemaine[element.nomm]['DEM'] = element.count
                            }else{
                                resultatsemaine[element.nomm][element.nom] = element.count                                
                            }
                        }else{
                            if(element.nom == 'DEM R.A.F.' || element.nom == 'DEM SUIVI'){
                                resultatsemaine[element.nomm]['DEM'] = element.count
                            }else{
                                resultatsemaine[element.nomm][element.nom] = element.count                                
                            }
                        }
                    });

                    /**
                     * 
                     * Jours
                     * 
                     */

                    models.Historique.findAndCountAll({
                        include: [
                            {model: models.User},
                            {model: models.Action},
                            {model: models.RDV, include: {model: models.Etat}}
                        ],
                        where: {
                            createdAt: {
                                [Op.between] : [moment().format('YYYY-MM-DD') , moment().add(1, 'days').format('YYYY-MM-DD')]
                            }
                        },
                        group: ['User.nom', 'Action.nom']
                    }).then(findedStats => {
                        models.sequelize.query("SELECT CONCAT(users.nom, ' ',users.prenom) as nomm, etats.nom, count(rdvs.id) as count FROM rdvs JOIN historiques ON rdvs.idHisto=historiques.id JOIN users ON users.id=historiques.idUser JOIN etats ON etats.id=rdvs.idEtat WHERE historiques.createdAt BETWEEN :datedebut AND :datefin GROUP BY nomm, etats.nom",
                        { replacements: { 
                            datedebut: moment().format('YYYY-MM-DD'), 
                            datefin: moment().add(1, 'days').format('YYYY-MM-DD')
                        }, type: sequelize.QueryTypes.SELECT})
                        .then(findedStatsRDV => {    
                            findedStats.rows.forEach((element, index) => {
                                if(typeof resultatjour[element.User.nom+' '+element.User.prenom] == 'undefined'){
                                    resultatjour[element.User.nom+' '+element.User.prenom] = []
                                    resultatjour[element.User.nom+' '+element.User.prenom][findedStats.count[index].nom] = findedStats.count[index].count
                                }else{
                                    resultatjour[element.User.nom+' '+element.User.prenom][findedStats.count[index].nom] = findedStats.count[index].count
                                }
                            });
                            findedStatsRDV.forEach((element, index) => {
                                if(typeof resultatjour[element.nomm] == 'undefined'){
                                    resultatjour[element.nomm] = []
                                    if(element.nom == 'DEM R.A.F.' || element.nom == 'DEM SUIVI'){
                                        resultatjour[element.nomm]['DEM'] = element.count
                                    }else{
                                        resultatjour[element.nomm][element.nom] = element.count
                                    }
                                }else{
                                    if(element.nom == 'DEM R.A.F.' || element.nom == 'DEM SUIVI'){
                                        resultatjour[element.nomm]['DEM'] = element.count
                                    }else{
                                        resultatjour[element.nomm][element.nom] = element.count
                                    }
                                }
                            });
                            res.render('manager/manager_dashboard', { extractStyles: true, title: 'Menu', session: req.session.client, options_top_bar: 'telemarketing', findedStatsMois : resultatmois, findedStatsSemaine : resultatsemaine, findedStatsJours : resultatjour,});
                        }).catch(err => {
                            console.log(err)
                        })
                    }).catch(err => {
                        console.log(err)
                    })
                }).catch(err => {
                    console.log(err)
                })
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

    models.User.findAll({
        include: [  
            {model: models.Role, include: models.Privilege},
            {model: models.Directive},
            {model: models.Structure, where: {
                id: 3
            },include: models.Type}
        ],
    }).then(findedUsers => {
        if(findedUsers){
            res.render('manager/manager_directives', { extractStyles: true, title: 'Menu', session: req.session.client, options_top_bar: 'telemarketing', findedUsers : findedUsers});
        }else{
            req.flash('error_msg', 'Un problème est survenu, veuillez réessayer. Si le probleme persiste veuillez en informer votre superieur.');
            res.redirect('/menu');
        }
    }).catch(function (e) {
        req.flash('error', e);
    });
});

router.post('/update/directives' ,(req, res, next) => {

    models.Directive.findOne({ where: {idUser : req.body.idUser}})
    .then((directive) => {
        if(directive) {
            directive.update(req.body).then((event) => {
                models.User.findAll({
                    include: [  
                        {model: models.Role, include: models.Privilege},
                        {model: models.Directive},
                        {model: models.Structure, where: {
                            id: 3
                        },include: models.Type}
                    ],
                }).then(findedUsers => {
                    if(findedUsers){
                        res.send(findedUsers);
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
                        {model: models.Structure, where: {
                            id: 3
                        },include: models.Type}
                    ],
                }).then(findedUsers => {
                    if(findedUsers){
                        res.send(findedUsers);
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

router.get('/dem-suivi' ,(req, res, next) => {
    res.render('manager/manager_rdv_demsuivi', { extractStyles: true, title: 'Menu', session: req.session.client, options_top_bar: 'telemarketing'});
});

router.get('/agenda' ,(req, res, next) => {
    models.User.findAll({
        where:{
            idRole: 2
        }
    }).done( (findedUsers) => {
        models.Event.findAll({
            include: [
                {model: models.User}
            ]
        }).done( (findedEvents) => {
            res.render('manager/manager_agenda', { extractStyles: true, title: 'Menu', session: req.session.client, options_top_bar: 'telemarketing', findedUsers: findedUsers, findedEvents: findedEvents})
        })
    })
});

router.post('/agenda/ajoute-event' ,(req, res, next) => {
    models.Event.create(req.body).done( (createdEvent) => {
            res.send(createdEvent)
    })
});


router.get('/objectifs' ,(req, res, next) => {
    models.User.findAll({
        where: { objectif : {
            [Op.not]: null, 
        }
    }}).then(findedUsers => {
        res.render('manager/manager_objectifs', { extractStyles: true, title: 'Menu', session: req.session.client, options_top_bar: 'telemarketing', findedUsers : findedUsers});
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
        console.log(findedRdvs)
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

    models.RDV.findAll({
        include: [
            {model : models.Client},
            {model : models.Historique},
            {model : models.User},
            {model : models.Etat},
            {model : models.Campagne}
        ],
        where: {
            date : {
                [Op.between] : [moment().format('YYYY-MM-DD'), moment().add(1, 'days').format('YYYY-MM-DD')]
            } 
        },
        order: [['date', 'asc']],
    }).then(findedRdvs => {
        if(findedRdvs){
            res.render('manager/manager_listerdv', { extractStyles: true, title: 'Menu', findedRdvs: findedRdvs, session: req.session.client, options_top_bar: 'telemarketing', date: moment().format('DD/MM/YYYY')});
        }else{
            req.flash('error_msg', 'Un problème est survenu, veuillez réessayer. Si le probleme persiste veuillez en informer votre superieur.');
            res.redirect('/menu');
        }
    }).catch(function (e) {
        req.flash('error', e);
    });
});

router.post('/liste-rendez-vous' ,(req, res, next) => {
    models.RDV.findAll({
        include: [
            {model : models.Client},
            {model : models.Historique},
            {model : models.User},
            {model : models.Etat},
            {model : models.Campagne}
        ],
        where: {
            date : {
                [Op.between] : [moment(req.body.datedebut, 'DD/MM/YYYY').format('MM-DD-YYYY'), moment(moment(req.body.datefin, 'DD/MM/YYYY').format('MM-DD-YYYY')).add(1, 'days')]
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
        models.User.findAll({
            include: [
                {model : models.Structure, include: models.Type, where: {
                    idType : 2,
                }
            }]
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
});

router.post('/update/compte-rendu' ,(req, res, next) => {

    req.body.idUser = req.session.client.id
    req.body.idEtat = req.body.idEtat == '' ? null : req.body.idEtat
    req.body.idVendeur = req.body.idVendeur ==  '' ? null : req.body.idVendeur

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

module.exports = router;

Array.prototype.insert = function ( index, item ) {
    this.splice( index, 0, item );
};
