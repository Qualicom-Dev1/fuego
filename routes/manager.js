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
    res.render('manager_dashboard', { extractStyles: true, title: 'Menu', options_top_bar: 'telemarketing'});
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
            res.render('manager_directives', { extractStyles: true, title: 'Menu', options_top_bar: 'telemarketing', findedUsers : findedUsers});
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
    res.render('manager_rdv_demsuivi', { extractStyles: true, title: 'Menu', options_top_bar: 'telemarketing'});
});

router.get('/agenda' ,(req, res, next) => {
    res.render('manager_agenda', { extractStyles: true, title: 'Menu', options_top_bar: 'telemarketing'});
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
            res.render('manager_listerdv', { extractStyles: true, title: 'Menu', findedRdvs: findedRdvs, options_top_bar: 'telemarketing'});
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
        if(findedRdv){
            res.send(findedRdv);
        }else{
            req.flash('error_msg', 'un problème est survenu veuillez réessayer si le probleme persiste informer en votre superieure');
            res.redirect('/menu');
        }
    }).catch(function (e) {
        req.flash('error', e);
    });
});

module.exports = router;