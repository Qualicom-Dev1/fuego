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
    return models.sequelize.query(`
        SELECT RDVs.idVendeur, Users.prenom, Users.nom, COUNT(*) AS nbVentes, derniereVente.date AS date
        FROM RDVs JOIN
        (
            SELECT idVendeur, ${order}(date) AS date FROM RDVs
            WHERE idEtat = 1
            AND idVendeur IS NOT NULL
            ${isSet(dates) ? 'AND ' + dates : ''}
            GROUP BY idVendeur
        ) AS derniereVente ON RDVs.idVendeur = derniereVente.idVendeur
        JOIN Users ON RDVs.idVendeur = Users.id
        WHERE idEtat = 1
        AND RDVs.idVendeur IS NOT NULL
        ${isSet(dates) ? 'AND ' + dates : ''}
        GROUP BY RDVs.idVendeur
        ORDER BY nbVentes DESC, date ASC
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
    res.render('statistiques/podium', { extractStyles: true, title: 'Podium | FUEGO', session: req.session.client, options_top_bar: 'statistiques', moment })
})
// récupère les ventes par vendeur pour le jour même
.get('/ventes/jour', async (req, res) => {
    let infoObject = undefined
    let ventes = undefined

    try {
        const today = moment().format("YYYY-MM-DD")
        const dateDebut = `${today} 00:00:00`
        const dateFin = `${today} 23:59:59`

        ventes = await getVentesTotales('MAX', `RDVs.date BETWEEN "${dateDebut}" AND "${dateFin}"`)

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
// récupère les ventes par vendeur pour le mois en cours
.get('/ventes/mois', async (req, res) => {
    let infoObject = undefined
    let ventes = undefined

    try {
        const dateDebut = `${moment().startOf('month').format('YYYY-MM-DD')} 00:00:00`
        const dateFin = `${moment().endOf('month').format('YYYY-MM-DD')} 23:59:59`

        ventes = await getVentesTotales('MIN', `RDVs.date BETWEEN "${dateDebut}" AND "${dateFin}"`)

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
// récupère les ventes par vendeur pour une période donnée
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
            stringSearch = `RDVs.date BETWEEN "${dateDebut}" AND "${dateFin}"`
            stringEmptyResult = `Aucune vente entre le ${dateDebut} et le ${dateFin}.`
        }
        else if(isSet(dateDebut)) {
            dateDebut = `${moment(dateDebut).format("YYYY-MM-DD")} 00:00:00`
            stringSearch = `RDVs.date >= "${dateDebut}"`
            stringEmptyResult = `Aucune vente à partir du ${dateDebut}.`
        }
        else if(isSet(dateFin)) {
            dateFin = `${moment(dateFin).format("YYYY-MM-DD")} 23:59:59`
            stringSearch = `RDVs.date <= "${dateFin}"`
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
// récupère toutes le ventes pour une période donnée
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