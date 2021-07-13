const express = require('express');
const router = express.Router();
const models = global.db;
const moment = require('moment')
const sequelize = require('sequelize');
const Op = sequelize.Op
const clientInformationObject = require('../utils/errorHandler')
const isSet = require('../utils/isSet')
const GOOGLEMAPS_APIKEY = require('../config/config.json')['googleapis'].map.apiKey

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

        // vendredi
        // if(moment().day() === 5) {
        //     hopToNextDay = 3
        // } 
        // samedi
        if(moment().day() === 6) {
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
            res.render('vendeur/vendeur_dashboard', { extractStyles: true, title: 'Tableau de bord | FUEGO', description:'Tableau de bord Commercial', findedRdvs: findedRdvs, findedRdvsp: findedRdvsp, session: req.session.client, options_top_bar: 'commerciaux', GOOGLEMAPS_APIKEY });
        }).catch(function (e) {
            req.flash('error', e);
            console.error(e)
        });
    }).catch(function (e) {
        req.flash('error', e);
        console.error(e)
    });
});

router.post('/graphe' , async (req, res, ) => {
    let infos = undefined
    let infosGraphe = undefined

    try {
        const idsStructures = req.session.client.Structures.map(structure => structure.id)
        const idsVendeursStructures = await models.UserStructure.findAll({
            attributes : ['idUser'],
            where : {
                idStructure : {
                    [Op.in] : idsStructures
                }
            }
        })
        if(idsVendeursStructures === null) throw "Une erreur est survenue lors de la récupération des vendeurs de vos structures."
        if(idsVendeursStructures.length === 0) throw "Aucun vendeur présents dans vos structures."
                
        reqInfosGraphe = await models.sequelize.query(`
                SELECT CONCAT(nom, ' ', prenom) as xAxisID, CAST(count(idEtat) AS UNSIGNED) as yAxisID 
                FROM RDVs JOIN Users ON Users.id = RDVs.idVendeur 
                WHERE Users.id IN (${idsVendeursStructures.map(vendeur => vendeur.idUser).toString()})
                AND idEtat = 1 
                AND date BETWEEN '${moment().startOf('month').format('YYYY-MM-DD 00:00:00')}' AND '${moment().endOf('month').format('YYYY-MM-DD 23:59:59')}'
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

        infosGraphe = new Array(label, value)        
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

router.get('/ventes' , async (req, res) => {
    const dateDebut = moment().startOf('month').format('DD/MM/YYYY')
    const dateFin = moment().endOf('month').format('DD/MM/YYYY')
    res.render('vendeur/vendeur_ventes', { extractStyles: true, title: 'Ventes | FUEGO', description:'Ventes Commercial', session: req.session.client, options_top_bar: 'commerciaux', dateDebut, dateFin });
    
    // let infos = undefined
    // let rdvsVentes = undefined

    // const dateDebut = moment().startOf('month').format('DD/MM/YYYY')
    // const dateFin = moment().endOf('month').format('DD/MM/YYYY')

    // try {
    //     let idDependence = [req.session.client.id]
    //     req.session.client.Usersdependences.forEach((element => {
    //         idDependence.push(element.idUserInf)    
    //     }))        

    //     rdvsVentes = await models.RDV.findAll({
    //         include: [
    //             {model : models.Client},
    //             {model : models.Historique},
    //             {model : models.User},
    //             {model : models.Etat},
    //             {model : models.Campagne}
    //         ],
    //         where: {
    //             date : {
    //                 [Op.between] : [moment(dateDebut, 'DD/MM/YYYY').format('YYYY-MM-DD 00:00:00'), moment(dateFin, 'DD/MM/YYYY').format('YYYY-MM-DD 23:59:59')]
    //             },
    //             idEtat: 1,
    //             idVendeur: {
    //                 [Op.in] : idDependence
    //             }
    //         },
    //         order: [['date', 'asc']],
    //     })
    //     if(rdvsVentes === null) throw "Une erreur est survenue lors de la récupération des ventes."
    //     if(rdvsVentes.length === 0) infos = clientInformationObject(undefined, "Aucune vente disponible.")
    // }
    // catch(error) {
    //     rdvsVentes = undefined
    //     infos = clientInformationObject(error)
    // }

    // res.render('vendeur/vendeur_ventes', { extractStyles: true, title: 'Ventes | FUEGO', description:'Ventes Commercial', session: req.session.client, options_top_bar: 'commerciaux', infos, rdvsVentes, dateDebut, dateFin });
});

router.post('/ventes' , async (req, res) => {
    let infos = undefined
    let rdvsVentes = undefined

    let dateDebut = undefined
    let dateFin = undefined

    try {
        if(!isSet(req.body.dateDebut) && !isSet(req.body.dateFin)) throw "Les dates de début et de fin doivent être sélectionnées."

        if(isSet(req.body.dateDebut)) dateDebut = moment(req.body.dateDebut, 'DD/MM/YYYY').format('DD/MM/YYYY')
        else dateDebut = moment('1970-01-01').format('DD/MM/YYYY')

        if(isSet(req.body.dateFin)) dateFin = moment(req.body.dateFin, 'DD/MM/YYYY').format('DD/MM/YYYY')
        else dateFin = moment().add(1, 'day').format('DD/MM/YYYY')

        let idDependence = [req.session.client.id]
        req.session.client.Usersdependences.forEach((element => {
            idDependence.push(element.idUserInf)    
        }))        

        rdvsVentes = await models.RDV.findAll({
            include: [
                {model : models.Client},
                {model : models.Historique},
                {model : models.User},
                {model : models.Etat},
                {model : models.Campagne}
            ],
            where: {
                date : {
                    [Op.between] : [moment(dateDebut, 'DD/MM/YYYY').format('YYYY-MM-DD 00:00:00'), moment(dateFin, 'DD/MM/YYYY').format('YYYY-MM-DD 23:59:59')]
                },
                idEtat: 1,
                idVendeur: {
                    [Op.in] : idDependence
                }
            },
            order: [['date', 'asc']],
        })
        if(rdvsVentes === null) throw "Une erreur est survenue lors de la récupération des ventes."
        if(rdvsVentes.length === 0) infos = clientInformationObject(undefined, "Aucune vente disponible.")
    }
    catch(error) {
        rdvsVentes = undefined
        dateDebut = undefined
        dateFin = undefined
        infos = clientInformationObject(error)
    }

    res.send({
        infos,
        rdvsVentes,
        dateDebut,
        dateFin
    })
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