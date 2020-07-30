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
            idVendeur: req.session.client.id,
            statut : 1
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
                {model : models.User},
                {model : models.Etat},
                {model : models.Campagne}
            ],
            where: {
                date : {
                   [Op.substring] : [moment().add(hopToNextDay, 'day').format('YYYY-MM-DD')]
                },
                idVendeur: req.session.client.id,
                statut : 1
            },
            order: [['date', 'asc']],
        }).then(findedRdvsp => {
            res.render('vendeur/vendeur_dashboard', { extractStyles: true, title: 'Tableau de bord | FUEGO', description:'Tableau de bord Commercial', findedRdvs: findedRdvs, findedRdvsp: findedRdvsp, session: req.session.client, options_top_bar: 'commerciaux'});
        }).catch(function (e) {
            req.flash('error', e);
        });
    }).catch(function (e) {
        req.flash('error', e);
    });
});

router.post('/graphe' ,(req, res, next) => {
    models.sequelize.query("SELECT CONCAT(nom, ' ', prenom) as xAxisID, CAST(count(idEtat) AS UNSIGNED) as yAxisID FROM RDVs JOIN Users ON Users.id=RDVs.idVendeur WHERE idEtat=1 AND date BETWEEN :datedebut AND :datefin  GROUP BY xAxisID ORDER BY yAxisID DESC", { replacements: { datedebut: moment().startOf('month').format('YYYY-MM-DD') , datefin: moment().endOf('month').add(1, 'days').format('YYYY-MM-DD')}, type: sequelize.QueryTypes.SELECT})
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
    let idDependence = []
    req.session.client.Usersdependences.forEach((element => {
        idDependence.push(element.idUserInf)    
    }))

    idDependence.push(req.session.client.id)

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
                [Op.between] : [moment().startOf('month').format('MM-DD-YYYY'), moment().endOf('month').format('MM-DD-YYYY')]
            },
            idEtat: 1,
            idVendeur: {
                [Op.in] : idDependence
            }
        },
        order: [['date', 'asc']],
    }).then(findedRdvs => {
        if(findedRdvs){
            res.render('vendeur/vendeur_ventes', { extractStyles: true, title: 'Ventes | FUEGO', description:'Vente Commercial', session: req.session.client, options_top_bar: 'commerciaux', findedRdvs: findedRdvs});
        }else{
            req.flash('error_msg', 'Vous n\'avez aucun vente ou un problème est survenu, veuillez réessayer. Si le probleme persiste veuillez en informer votre superieur.');
            res.redirect('/menu');
        }
    }).catch(function (e) {
        req.flash('error', e);
    });

});

router.post('/ventes' ,(req, res, next) => {

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
            },
            idEtat: 1,
            idVendeur: req.session.client.id
        },
        order: [['date', 'asc']],
    }).then(findedRdvs => {
        if(findedRdvs){
            res.send(findedRdvs);
        }else{
            req.flash('error_msg', 'Vous n\'avez aucun vente ou un problème est survenu, veuillez réessayer. Si le probleme persiste veuillez en informer votre superieur.');
            res.redirect('/menu');
        }
    }).catch(function (e) {
        req.flash('error', e);
    });
});

module.exports = router;