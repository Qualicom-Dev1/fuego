const express = require('express');
const router = express.Router();
const models = require("../models/index");
const moment = require('moment')
const Sequelize = require('sequelize')
const Op = Sequelize.Op

router.get('/' ,(req, res, next) => {
    res.redirect('/vendeur/tableau-de-bord');
});

router.get('/tableau-de-bord' ,(req, res, next) => {

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
               [Op.substring] : [moment().format('YYYY-MM-DD')]
            },
            idVendeur: sess.id
        },
        order: [['date', 'asc']],
    }).then(findedRdvs => {
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
                   [Op.substring] : [moment().add(1, 'day').format('YYYY-MM-DD')]
                },
                idVendeur: sess.id
            },
            order: [['date', 'asc']],
        }).then(findedRdvsp => {
            res.render('vendeur/vendeur_dashboard', { extractStyles: true, title: 'Menu', findedRdvs: findedRdvs, findedRdvsp: findedRdvsp ,options_top_bar: 'commerciaux'});
        }).catch(function (e) {
            req.flash('error', e);
        });
    }).catch(function (e) {
        req.flash('error', e);
    });
});

router.get('/ventes' ,(req, res, next) => {
    res.render('vendeur/vendeur_ventes', { extractStyles: true, title: 'Menu', options_top_bar: 'commerciaux'});
});






module.exports = router;