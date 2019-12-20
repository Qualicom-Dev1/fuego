const express = require('express')
const router = express.Router()
const models = require("../models/index")
const _ = require('lodash')
const moment = require('moment')

const sequelize = require("sequelize")
const Op = sequelize.Op

router.get('/' ,(req, res, next) => {
    res.render('statistiques/stats_campagnes', { extractStyles: true, title: 'Statistiques Campagnes | FUEGO', description:'Suivi des Statistiques de campagnes',  session: req.session.client, options_top_bar: 'statistiques'});
});

router.get('/campagnes' ,(req, res, next) => {
    res.render('statistiques/stats_campagnes', { extractStyles: true, title: 'Statistiques Campagnes | FUEGO', description:'Suivi des Statistiques de campagnes',  session: req.session.client, options_top_bar: 'statistiques'});
});

router.get('/sources' ,(req, res, next) => {
    res.render('statistiques/stats_fichiers', { extractStyles: true, title: 'Statistiques Fichiers | FUEGO', description:'Suivi des Statistiques de fichiers',  session: req.session.client, options_top_bar: 'statistiques'});
});

router.get('/telemarketing' ,(req, res, next) => {
    res.render('statistiques/stats_telemarketing', { extractStyles: true, title: 'Statistiques Télémarketing | FUEGO', description:'Suivi des Statistiques Télémarketing',  session: req.session.client, options_top_bar: 'statistiques'});
});

router.post('/telemarketing/get-tab-telemarketing' ,(req, res, next) => {

    models.sequelize.query("SELECT CONCAT(Users.nom, ' ',Users.prenom) as nomm, Actions.nom, Etats.nom as etat ,count(Historiques.id) as count FROM Historiques LEFT JOIN RDVs ON Historiques.id=RDVs.idHisto LEFT JOIN Users ON Users.id=Historiques.idUser LEFT JOIN Actions ON Actions.id=Historiques.idAction LEFT JOIN Etats ON Etats.id=RDVs.idEtat WHERE Historiques.createdAt BETWEEN :datedebut AND :datefin GROUP BY nomm, Actions.nom, Etats.nom",
        { replacements: {
            datedebut: moment(req.body.datedebut).format('YYYY-MM-DD'), 
            datefin: moment(req.body.datefin).format('YYYY-MM-DD')
        }, type: sequelize.QueryTypes.SELECT})
        .then(findedStatsRDV => {
            res.send({findedStatsRDV : findedStatsRDV})
        });
});


router.get('/telemarketing_graphiques' ,(req, res, next) => {
    res.render('statistiques/stats_telemarketing_graphiques', { extractStyles: true, title: 'Statistiques Télémarketing | FUEGO', description:'Suivi des Statistiques Télémarketing',  session: req.session.client, options_top_bar: 'statistiques'});
});

router.get('/commerciaux' ,(req, res, next) => {
    res.render('statistiques/stats_vendeurs', { extractStyles: true, title: 'Statistiques Vendeurs | FUEGO', description:'Suivi des Statistiques Vendeurs',  session: req.session.client, options_top_bar: 'statistiques'});
});

router.post('/commerciaux/get-tab-commerciaux' ,(req, res, next) => {
    
    models.User.findAll({
        include: [  
            {model: models.Role, where: {typeDuRole : 'Commercial'}, include: models.Privilege},
            {model: models.Structure},
            {model: models.Usersdependence}
        ],
    }).then((findedUsers) => {
    models.sequelize.query("SELECT Users.id, CONCAT(Users.nom,' ',Users.prenom) as commercial, count(RDVs.id) as RDV, count(IF(RDVs.source = 'Perso', 1, NULL)) as Perso, count(IF(RDVs.idEtat IN (1,2,3), 1 , NULL)) as DEM, count(IF(RDVs.idEtat IN (1), 1 , NULL)) as VENTE, ROUND(count(RDVs.id)/count(IF(RDVs.idEtat IN (1,2,3), 1 , NULL)), 2) as 'RDV/DEM' , ROUND(count(IF(RDVs.idEtat IN (1,2,3), 1 , NULL))/count(IF(RDVs.idEtat IN (1), 1 , NULL)), 2) as 'DEM/VENTE' FROM RDVs JOIN Users ON RDVs.idVendeur=Users.id WHERE RDVs.statut=1 AND date BETWEEN :datedebut AND :datefin GROUP BY commercial, Users.id",{replacements: 
        {   
            datedebut: moment(req.body.datedebut).format('YYYY-MM-DD'), 
            datefin: moment(req.body.datefin).format('YYYY-MM-DD')
        }, type: sequelize.QueryTypes.SELECT})
    .then(findedTableau => {
        res.send({findedUsers : findedUsers, findedTableau : findedTableau, _ : _});
    })
    })
});
router.get('/commerciaux_graphiques' ,(req, res, next) => {
    res.render('statistiques/stats_commerciaux_graphiques', { extractStyles: true, title: 'Statistiques Vendeurs | FUEGO', description:'Suivi des Statistiques Vendeurs',  session: req.session.client, options_top_bar: 'statistiques'});
});


module.exports = router;



