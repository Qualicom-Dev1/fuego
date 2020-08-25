const express = require('express');
const router = express.Router();
const models = require("../models/index");
const moment = require('moment');
const sequelize = require('sequelize')
const Op = sequelize.Op;
const dotenv = require('dotenv')
const clientInformationObject = require('./utils/errorHandler');
const isSet = require('./utils/isSet');
const { col } = require('sequelize');
dotenv.config();

// retourne le total des ventes pour chaque vendeur sur une période donnée
async function getVentesTotales(order = 'MIN', dates = undefined) {
    // return  models.RDV.findAll({
    //     attributes : [
    //         'idVendeur',
    //         [sequelize.fn('COUNT', sequelize.col('RDV.id')), 'nbVentes'],
    //         ['$dateVente.date$', 'date']
    //         // [sequelize.literal(`(
    //         //     SELECT idVendeur, ${order}(date) AS date FROM rdvs
    //         //     WHERE idEtat = 1
    //         //     AND idVendeur IS NOT NULL
    //         //     GROUP BY idVendeur
    //         // )`), 'derniereVente']
    //     ],
    //     where : {
    //         idEtat : 1,
    //         idVendeur : {
    //             [Op.not] : null
    //         },
    //         idVendeur : '$dateVente.idVendeur$',
    //         ...search
    //     },
    //     include : [
    //         { model : models.User },
    //         { 
    //             model : models.RDV, as : 'dateVente',
    //             attributes : [
    //                 'idVendeur',
    //                 [sequelize.fn(order, sequelize.col('date')), 'date'],
    //             ],
    //             where : {
    //                 idEtat : 1,
    //                 idVendeur : {
    //                     [Op.not] : null
    //                 }
    //             },
    //             group : 'idVendeur'
    //         }
    //     ],
    //     group : 'idVendeur',
    //     order : [[sequelize.col('nbVentes'), 'DESC'], [sequelize.col('date'), 'asc']]
    // })

    return models.sequelize.query(`
        SELECT rdvs.idVendeur, users.prenom, users.nom, COUNT(*) AS nbVentes, derniereVente.date AS date
        FROM rdvs JOIN
        (
            SELECT idVendeur, ${order}(date) AS date FROM rdvs
            WHERE idEtat = 1
            AND idVendeur IS NOT NULL
            ${isSet(dates) ? 'AND ' + dates : ''}
            GROUP BY idVendeur
        ) AS derniereVente ON rdvs.idVendeur = derniereVente.idVendeur
        JOIN users ON rdvs.idVendeur = users.id
        WHERE idEtat = 1
        AND rdvs.idVendeur IS NOT NULL
        ${isSet(dates) ? 'AND ' + dates : ''}
        GROUP BY rdvs.idVendeur
        ORDER BY nbVentes DESC, rdvs.createdAt ASC
    `, {
        type : sequelize.QueryTypes.SELECT
    })
}

// retourne toutes les ventes pour une période donnée
async function getListeVentes(dates = undefined) {
    let where = {
        idVendeur : {
            [Op.not] : null
        },
        idEtat : 1
    }

    if(isSet(dates)) {
        where = { ...where, ...dates }
    }

    return models.RDV.findAll({
        where,
        include : {
            model : models.User
        },
        order : [['date', 'desc'], ['createdAt', 'asc']]
    })
}

router
// page accueil podium
.get('/', async (req, res) => {
    res.render('podium/podium', { extractStyles: true, title: 'Menu', session: req.session.client, moment })
})
.get('/ventes/jour', async (req, res) => {
    let infoObject = undefined
    let ventes = undefined

    try {
        const today = moment().format("YYYY-MM-DD")
        const dateDebut = `${today} 00:00:00`
        const dateFin = `${today} 23:59:59`

        ventes = await getVentesTotales('MAX', `rdvs.date BETWEEN "${dateDebut}" AND "${dateFin}"`)

        if(ventes === null || ventes.length === 0) {
            infoObject = clientInformationObject(undefined, "Aucune vente aujourd'hui.")
            ventes = undefined
        }
    }
    catch(error) {
        infoObject = clientInformationObject(error)
    }

    res.send({
        infoObject,
        ventes
    })
})
.get('/ventes/mois', async (req, res) => {
    let infoObject = undefined
    let ventes = undefined

    try {
        const dateDebut = `${moment().startOf('month').format('YYYY-MM-DD')} 00:00:00`
        const dateFin = `${moment().endOf('month').format('YYYY-MM-DD')} 23:59:59`

        ventes = await getVentesTotales('MIN', `rdvs.date BETWEEN "${dateDebut}" AND "${dateFin}"`)

        if(ventes === null || ventes.length === 0) {
            infoObject = clientInformationObject(undefined, "Aucune vente ce mois-ci.")
            ventes = undefined
        }
    }
    catch(error) {
        infoObject = clientInformationObject(error)
    }

    res.send({
        infoObject,
        ventes
    })
})
.get('/ventes/custom/aggregated', async (req, res) => {
    let dateDebut = req.query.dateDebut
    let dateFin = req.query.dateFin
    let ordre = req.query.ordre

    let infoObject = undefined
    let ventes = undefined

    try {
        let stringSearch = ''
        let stringEmptyResult = 'Aucune vente disponible.'

        if(isSet(dateDebut) && isSet(dateFin)) {
            dateDebut = `${moment(dateDebut).format("YYYY-MM-DD")} 00:00:00`
            dateFin = `${moment(dateFin).format("YYYY-MM-DD")} 23:59:59`
            stringSearch = `rdvs.date BETWEEN "${dateDebut}" AND "${dateFin}"`
            stringEmptyResult = `Aucune vente entre le ${dateDebut} et le ${dateFin}.`
        }
        else if(isSet(dateDebut)) {
            dateDebut = `${moment(dateDebut).format("YYYY-MM-DD")} 00:00:00`
            stringSearch = `rdvs.date >= "${dateDebut}"`
            stringEmptyResult = `Aucune vente à partir du ${dateDebut}.`
        }
        else if(isSet(dateFin)) {
            dateFin = `${moment(dateFin).format("YYYY-MM-DD")} 23:59:59`
            stringSearch = `rdvs.date <= "${dateFin}"`
            stringEmptyResult = `Aucune vente avant le ${dateFin}.`
        }

        if(!isSet(ordre) || !['MIN', 'MAX'].includes(ordre)) {
            ordre = 'MAX'
        }

        ventes = await getVentesTotales(ordre, stringSearch)

        if(ventes === null || ventes.length === 0) {
            infoObject = clientInformationObject(undefined, stringEmptyResult)
            ventes = undefined
        }
    }
    catch(error) {
        infoObject = clientInformationObject(error)
    }

    res.send({
        infoObject,
        ventes
    })
})

.get('/ventes/custom/all', async (req, res) => {
    let dateDebut = req.query.dateDebut
    let dateFin = req.query.dateFin

    let infoObject = undefined
    let ventes = undefined

    try {
        let dates = undefined
        let stringEmptyResult = 'Aucune vente disponible.'

        if(isSet(dateDebut) && isSet(dateFin)) {
            dateDebut = `${moment(dateDebut).format('YYYY-MM-DD')} 00:00:00`
            dateFin = `${moment(dateFin).format('YYYY-MM-DD')} 23:59:59`
            dates = {
                date : {
                    [Op.between] : [dateDebut, dateFin]
                }
            }
            stringEmptyResult = `Aucune vente entre le ${dateDebut} et le ${dateFin}.`
        }
        else if(isSet(dateDebut)) {
            dateDebut = `${moment(dateDebut).format("YYYY-MM-DD")} 00:00:00`
            dates = {
                date : {
                    [Op.gte] : dateDebut
                }
            }
            stringEmptyResult = `Aucune vente à partir du ${dateDebut}.`
        }
        else if(isSet(dateFin)) {
            dateFin = `${moment(dateFin).format("YYYY-MM-DD")} 23:59:59`
            dates = {
                date : {
                    [Op.lte] : dateFin
                }
            }
            stringEmptyResult = `Aucune vente avant le ${dateFin}.`
        }

        ventes = await getListeVentes(dates)

        if(ventes === null || ventes.length === 0) {
            infoObject = clientInformationObject(undefined, stringEmptyResult)
            ventes = undefined
        }

        ventes = ventes.map(vente => {
            return {
                idVendeur : vente.idVendeur,
                prenom : vente.User.prenom,
                nom : vente.User.nom,
                nbVentes : vente.nbVentes,
                date : vente.date,
                source : vente.source
            }
        })
    }
    catch(error) {
        infoObject = clientInformationObject(error)
    }

    res.send({
        infoObject,
        ventes
    })
})


module.exports = router