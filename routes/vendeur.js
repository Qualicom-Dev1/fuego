const express = require('express');
const router = express.Router();
const models = require("../models/index");
const moment = require('moment')
const Sequelize = require('sequelize')
const Op = Sequelize.Op

router.get('/' ,(req, res, next) => {
    res.redirect('/commerciaux/tableau-de-bord');
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
                [Op.between] : [moment(req.body.datedebut).format('DD/MM/YYYY'), moment(moment(req.body.datefin).format('DD/MM/YYYY')).add(1, 'days')]
            } 
        },
        order: [['date', 'asc']],
    }).then(findedRdvs => {
        if(findedRdvs){
            res.render('vendeur/vendeur_dashboard', { extractStyles: true, title: 'Menu', findedRdvs: findedRdvs, options_top_bar: 'commerciaux'});
        }else{
            req.flash('error_msg', 'un problème est survenu veuillez réessayer si le probleme persiste informer en votre superieure');
            res.redirect('/menu');
        }
    }).catch(function (e) {
        req.flash('error', e);
    });
});

router.get('/ventes' ,(req, res, next) => {
    res.render('commerciaux/vendeur_ventes', { extractStyles: true, title: 'Menu', options_top_bar: 'commerciaux'});
});






module.exports = router;