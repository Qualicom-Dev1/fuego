const express = require('express')
const router = express.Router()
const models = require("../models/index")
const _ = require('lodash')
const moment = require('moment')
const async = require('async')
const colors = require('colors')

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

router.post('/sources/get-tab-sources' ,(req, res, next) => {


    models.sequelize.query("SELECT Clients.source,"+
    "count(Clients.id) as lignerecus,"+
	"count(IF((currentAction = 2 OR currentAction IS NULL), 1, null)) as atraitement,"+
	"count(IF((countNrp = 0  OR currentAction IS NULL), 1, null)) as vierge, "+
	"count(IF((countNrp <> 0 AND (currentAction IS NULL OR currentAction = 2)), 1, null)) as nrp,"+
    "count(IF((currentAction = 4  OR currentAction = 7 OR currentAction = 9), 1, null)) as erreur, "+
	"count(IF((currentAction = 5), 1, null)) as hc, "+
	"count(IF((currentAction = 3  OR currentAction = 8  OR currentAction = 14  OR currentAction = 13), 1, null)) as autre, "+
	"count(IF((currentAction = 12  OR currentAction = 6), 1, null)) as raf, "+
	"count(IF((currentAction = 11), 1, null)) as nrpnrp, "+
	"count(IF((currentAction = 16), 1, null)) as refus, "+
	"count(IF((currentAction = 1), 1, null)) as rdv,"+
	"count(IF((countNrp = -1  OR (currentAction IS NOT NULL AND currentAction <> 2)), 1, null)) as traiter "+
    "FROM Clients WHERE (createdAt BETWEEN :datedebut AND :datefin) AND Clients.source <> '' GROUP BY Clients.source",{replacements: 
        {   
            datedebut: moment(req.body.datedebut).format('YYYY-MM-DD'), 
            datefin: moment(req.body.datefin).format('YYYY-MM-DD')
        }, type: sequelize.QueryTypes.SELECT})
    .then(sources => {
        async.forEachOf(sources, (element, index, cc) => {
            models.sequelize.query("SELECT Clients.source,"+
            "count(RDVs.id) as rdvbrut,"+
            "count(IF(statut=1, 1, null)) as rdvnet,"+
            "count(IF((idEtat=1 OR idEtat=2 OR idEtat=3), 1, null)) as dem,"+
            "count(IF((idEtat=1), 1, null)) as vente "+
            "FROM Clients LEFT JOIN RDVs ON Clients.id=RDVs.idClient WHERE (Clients.createdAt BETWEEN :datedebut AND :datefin) AND Clients.source=:source GROUP BY  Clients.source",{replacements: 
                {   
                    source: element.source,
                    datedebut: moment(req.body.datedebut).format('YYYY-MM-DD'), 
                    datefin: moment(req.body.datefin).format('YYYY-MM-DD')
                }, type: sequelize.QueryTypes.SELECT})
            .then(source2 => {
                sources[index].rdvbrut = source2[0].brut
                sources[index].rdvnet = source2[0].net
                sources[index].dem = source2[0].dem
                sources[index].vente = source2[0].vente

                models.sequelize.query("SELECT Clients.type as source,"+
                "count(Clients.id) as lignerecus,"+
                "count(IF((currentAction = 2 OR currentAction IS NULL), 1, null)) as atraitement,"+
                "count(IF((countNrp = 0  OR currentAction IS NULL), 1, null)) as vierge, "+
                "count(IF((countNrp <> 0 AND (currentAction IS NULL OR currentAction = 2)), 1, null)) as nrp,"+
                "count(IF((currentAction = 4  OR currentAction = 7 OR currentAction = 9), 1, null)) as erreur, "+
                "count(IF((currentAction = 5), 1, null)) as hc, "+
                "count(IF((currentAction = 3  OR currentAction = 8  OR currentAction = 14  OR currentAction = 13), 1, null)) as autre, "+
                "count(IF((currentAction = 12  OR currentAction = 6), 1, null)) as raf, "+
                "count(IF((currentAction = 11), 1, null)) as nrpnrp, "+
                "count(IF((currentAction = 16), 1, null)) as refus, "+
                "count(IF((currentAction = 1), 1, null)) as rdv,"+
                "count(IF((countNrp = -1  OR (currentAction IS NOT NULL AND currentAction <> 2)), 1, null)) as traiter "+
                "FROM Clients WHERE (createdAt BETWEEN :datedebut AND :datefin) AND Clients.source=:source GROUP BY Clients.type",{replacements: 
                    {   
                        source: element.source,
                        datedebut: moment(req.body.datedebut).format('YYYY-MM-DD'), 
                        datefin: moment(req.body.datefin).format('YYYY-MM-DD')
                    }, type: sequelize.QueryTypes.SELECT})
                .then(campagnes => {
                    async.forEachOf(campagnes, (element2, index2, callback2) => {
                        models.sequelize.query("SELECT Clients.source,"+
                        "count(RDVs.id) as rdvbrut,"+
                        "count(IF(statut=1, 1, null)) as rdvnet,"+
                        "count(IF((idEtat=1 OR idEtat=2 OR idEtat=3), 1, null)) as dem,"+
                        "count(IF((idEtat=1), 1, null)) as vente "+
                        "FROM Clients LEFT JOIN RDVs ON Clients.id=RDVs.idClient WHERE (Clients.createdAt BETWEEN :datedebut AND :datefin) AND Clients.source=:source AND Clients.type=:type GROUP BY  Clients.source",{replacements: 
                        {   
                            source: element.source,
                            type: element2.source,
                            datedebut: moment(req.body.datedebut).format('YYYY-MM-DD'), 
                            datefin: moment(req.body.datefin).format('YYYY-MM-DD')
                        }, type: sequelize.QueryTypes.SELECT})
                        .then(campagne2 => {
                            campagnes[index2].rdvbrut = campagne2[0].brut
                            campagnes[index2].rdvnet = campagne2[0].net
                            campagnes[index2].dem = campagne2[0].dem
                            campagnes[index2].vente = campagne2[0].vente
                            if(campagnes.length == index2+1){
                                callback2()
                            }
                        })
                    }).then(() => {
                        console.log('Campagnes'.red)
                        sources[index]._children = campagnes
                        console.log(sources.length.toString().green , (index+1).toString().green)
                        if(sources.length == index+1){
                            console.log('TEST'.blue)
                            console.log('TEST2'.blue)
                        }
                        cc()
                    })
                })
            })
        }).then(() => {
            console.log('Sources'.red)
        })
    })

});

router.get('/telemarketing' ,(req, res, next) => {
    res.render('statistiques/stats_telemarketing', { extractStyles: true, title: 'Statistiques Télémarketing | FUEGO', description:'Suivi des Statistiques Télémarketing',  session: req.session.client, options_top_bar: 'statistiques'});
});

router.post('/telemarketing/get-tab-telemarketing' ,(req, res, next) => {

    models.sequelize.query("SELECT CONCAT(Users.nom, ' ',Users.prenom) as nomm, Actions.nom, Etats.nom as etat ,count(Historiques.id) as count FROM Historiques LEFT JOIN RDVs ON Historiques.id=RDVs.idHisto LEFT JOIN Users ON Users.id=Historiques.idUser LEFT JOIN Actions ON Actions.id=Historiques.idAction LEFT JOIN Etats ON Etats.id=RDVs.idEtat LEFT JOIN Roles ON Roles.id=Users.idRole WHERE Roles.typeDuRole='TMK' AND Historiques.createdAt BETWEEN :datedebut AND :datefin GROUP BY nomm, Actions.nom, Etats.nom",
        { replacements: {
            datedebut: moment(req.body.datedebut).format('YYYY-MM-DD'), 
            datefin: moment(req.body.datefin).format('YYYY-MM-DD')
        }, type: sequelize.QueryTypes.SELECT})
        .then(findedStatsRDV => {
            res.send({findedStatsRDV : findedStatsRDV})
        });
});

router.get('/telemarketing_graphiques' ,(req, res, next) => {
    models.User.findAll({
        include: [
            {model : models.Role, where: {
                typeDuRole: 'TMK'
            }}
        ]
    }).done((findedUsers) => {
        res.render('statistiques/stats_telemarketing_graphiques', { extractStyles: true, title: 'Statistiques Télémarketing | FUEGO', description:'Suivi des Statistiques Télémarketing',  session: req.session.client, options_top_bar: 'statistiques', findedUsers : findedUsers});
    })
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



