const express = require('express');
const router = express.Router();
const models = require("../models/index");
const moment = require('moment');
const Sequelize = require('sequelize')
const Op = Sequelize.Op;


router.get('/' , (req, res, next) => {
    res.redirect('/manager/tableau-de-bord');
});


router.get('/tableau-de-bord' ,(req, res, next) => {
    res.render('manager/manager_dashboard', { extractStyles: true, title: 'Menu', options_top_bar: 'telemarketing'});
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
            res.render('manager/manager_directives', { extractStyles: true, title: 'Menu', options_top_bar: 'telemarketing', findedUsers : findedUsers});
        }else{
            req.flash('error_msg', 'un problème est survenu veuillez réessayer si le probleme persiste informer en votre superieure');
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
                        req.flash('error_msg', 'un problème est survenu veuillez réessayer si le probleme persiste informer en votre superieure');
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
                        req.flash('error_msg', 'un problème est survenu veuillez réessayer si le probleme persiste informer en votre superieure');
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
    res.render('manager/manager_rdv_demsuivi', { extractStyles: true, title: 'Menu', options_top_bar: 'telemarketing'});
});

router.get('/agenda' ,(req, res, next) => {
    res.render('manager/manager_agenda', { extractStyles: true, title: 'Menu', options_top_bar: 'telemarketing'});
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
            res.render('manager/manager_listerdv', { extractStyles: true, title: 'Menu', findedRdvs: findedRdvs, options_top_bar: 'telemarketing'});
        }else{
            req.flash('error_msg', 'un problème est survenu veuillez réessayer si le probleme persiste informer en votre superieure');
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
            req.flash('error_msg', 'un problème est survenu veuillez réessayer si le probleme persiste informer en votre superieure');
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
            req.flash('error_msg', 'un problème est survenu veuillez réessayer si le probleme persiste informer en votre superieure');
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
                req.flash('error_msg', 'un problème est survenu veuillez réessayer si le probleme persiste informer en votre superieure');
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

    req.body.idUser = sess.id
req.body.idEtat
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
            req.flash('error_msg', 'un problème est survenu veuillez réessayer si le probleme persiste informer en votre superieure');
            res.redirect('/menu');
        }
    }).catch(function (e) {
        req.flash('error', e);
    });
});

module.exports = router;