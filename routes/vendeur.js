const express = require('express');
const router = express.Router();
const models = global.db;
const moment = require('moment')
const sequelize = require('sequelize');
const Op = sequelize.Op
const clientInformationObject = require('./utils/errorHandler')

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

router.post('/graphe' , async (req, res, ) => {
    let infos = undefined
    let infosGraphe = undefined

    try {
        const idsStructures = req.session.client.Structures.map(structure => structure.id)
        const idsVendeursStructures = await models.Structuresdependence.findAll({
            attributes : ['idUser'],
            where : {
                idStructure : {
                    [Op.in] : idsStructures
                }
            }
        })
        if(idsVendeursStructures === null) throw "Une erreur est survenue lors de la récupération des vendeurs de vos structures."
        if(idsVendeursStructures.length > 0) {
            reqInfosGraphe = await models.sequelize.query(`
                    SELECT CONCAT(nom, ' ', prenom) as xAxisID, CAST(count(idEtat) AS UNSIGNED) as yAxisID 
                    FROM RDVs JOIN Users ON Users.id = RDVs.idVendeur 
                    WHERE Users.id IN (${idsVendeursStructures.map(vendeur => vendeur.idUser).toString()})
                    AND idEtat = 1 
                    AND date BETWEEN '${moment().format('YYYY-MM-DD 00:00:00')}' AND '${moment().format('YYYY-MM-DD 23:23:59')}'
                    GROUP BY xAxisID 
                    ORDER BY yAxisID DESC
                `, { type: sequelize.QueryTypes.SELECT }
            )
            if(reqInfosGraphe === null) throw "Une erreur est survenue lors de la récupération des données du graphe."

            const label = []
            const value = []
            reqInfosGraphe.forEach(element => {
                label.push(element.xAxisID)
                value.push(element.yAxisID)
            });

            infosGraphe = new Array(label, value);
        }
    }
    catch(error) {
        infosGraphe = undefined
        infos = clientInformationObject(error)
    }

    res.send({
        infos,
        infosGraphe
    })
})

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

router
.get('/a-traiter', async (req, res) => {   
    res.render('vendeur/vendeur_a-traiter', { extractStyles: true, title: 'A traiter | FUEGO', description:'RDVs en attente de compte rendu', session: req.session.client, options_top_bar: 'commerciaux' });
})
.get('/a-traiter/listeRdvs', async (req, res) => {
    let infoObject = undefined
    let listeRdvs = undefined

    try {
        const idVendeur = req.session.client.id

        listeRdvs = await models.RDV.findAll({
            include: [
                {model : models.Client},
                {model : models.Historique},
                {model : models.User},
                {model : models.Etat},
                {model : models.Campagne}
            ],
            where: {
                idVendeur,
                statut : 1,
                [Op.or] : [{ idEtat : 0 }, { idEtat : null }]
            },
            order: [['date', 'asc']]
        })

        if(listeRdvs === null || listeRdvs.length === 0) {
            infoObject = clientInformationObject(undefined, "Tous les comptes rendus sont saisis.")
            listeRdvs = undefined
        }
    }
    catch(error) {
        infoObject = clientInformationObject(error)
        listeRdvs = undefined
    }

    res.send({
        infoObject,
        listeRdvs
    })
})

module.exports = router;