const express = require('express');
const router = express.Router();
const models = require("../models/index");
const moment = require('moment')
const sequelize = require('sequelize')
const Op = sequelize.Op

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

router.post('/graphe' ,(req, res, next) => {
    models.sequelize.query("SELECT CONCAT(nom, ' ', prenom) as xAxisID, CAST(count(idEtat) AS UNSIGNED) as yAxisID FROM rdvs JOIN users ON users.id=rdvs.idVendeur WHERE idEtat=1 AND date BETWEEN :datedebut AND :datefin  GROUP BY xAxisID ORDER BY yAxisID DESC", { replacements: { datedebut: moment().startOf('month').format('YYYY-MM-DD') , datefin: moment().endOf('month').add(1, 'days').format('YYYY-MM-DD')}, type: sequelize.QueryTypes.SELECT})
    .then(findgraph => {
        let label = new Array();
        let value = new Array();
        findgraph.forEach(element => {
            label.push(element.xAxisID)
            value.push(element.yAxisID)
        });

        let resultat = new Array(label, value);
        res.send(resultat)
    });
});

router.get('/ventes' ,(req, res, next) => {
    res.render('vendeur/vendeur_ventes', { extractStyles: true, title: 'Menu', options_top_bar: 'commerciaux'});
});






module.exports = router;