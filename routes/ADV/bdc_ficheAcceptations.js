const express = require('express')
const router = express.Router()
const models = global.db
const { ADV_BDC_ficheAcceptation } = models
const { Op } = require('sequelize')
const errorHandler = require('../utils/errorHandler')
const isSet = require('../utils/isSet')
const validations = require('../utils/validations')

function checkFicheAcceptation({ ficheAcceptation, client }, user) {
    if(!isSet(ficheAcceptation)) throw "La fiche d'acceptation du bon de commande doit être transmise."
    if(!isSet(client)) throw "La fiche client doit être transmise."

    ficheAcceptation.client = validations.validationString(ficheAcceptation.client, "Le nom, prénom du client")
    // vérifie que le client 1 soit bien indiqué dans la ligne client
    if(ficheAcceptation.client.search(new RegExp(client.nom1, 'ig')) === -1 || 
        ficheAcceptation.client.search(new RegExp(client.prenom1, 'ig')) === -1) throw "Le nom, prénom du client 1 doit figurer"

    ficheAcceptation.adresse = validations.validationString(ficheAcceptation.adresse, "L'adresse du lieu d'acceptation du bon de commande", 'e')
    ficheAcceptation.date = validations.validationDateFullFR(ficheAcceptation.date, "La date d'acceptation du bon de commande")
    ficheAcceptation.heure = validations.validationTime(ficheAcceptation.heure, "L'heure d'acceptation du bon de commande")

    ficheAcceptation.technicien = validations.validationString(ficheAcceptation.technicien, "Le nom, prénom du technicien")
    if(ficheAcceptation.technicien.search(new RegExp(user.nom, 'ig')) === -1 ||
        ficheAcceptation.technicien.search(new RegExp(user.prenom, 'ig')) === -1) throw `Le nom, prénom du technicien ne correspond pasà sa fiche utilisateur : ${user.prenom} ${user.nom}.`
    
    if(!isSet(ficheAcceptation.isReceptionDocuments) || (isSet(ficheAcceptation.isReceptionDocuments) && !!!ficheAcceptation.isReceptionDocuments)) throw "Le client doit recevoir les documentations commerciales et techniques des produits de la commande."
    ficheAcceptation.isReceptionDocuments = !!ficheAcceptation.isReceptionDocuments

    return ficheAcceptation
}

async function createFicheAcceptation({ ficheAcceptation : ficheAcceptationSent, client }, user) {
    ficheAcceptationSent = await checkFicheAcceptation({ ficheAcceptation : ficheAcceptationSent, client }, user)

    const ficheAcceptation = await ADV_BDC_ficheAcceptation.create(ficheAcceptationSent)
    if(ficheAcceptation === null) throw "Une erreur est survenue lors de l'enregistrement des champs d'acceptation du bon de commande."

    return ficheAcceptation
}

router
.get('/:Id_FicheAcceptation', async (req, res) => {
    const Id_FicheAcceptation = Number(req.params.Id_FicheAcceptation)

    let infos = undefined
    let ficheAcceptation = undefined

    try {
        if(isNaN(Id_FicheAcceptation)) throw "L'identifiant de la fiche d'acceptation du bon de commande est incorrect."

        ficheAcceptation = await ADV_BDC_ficheAcceptation.findOne({
            where : {
                id : Id_FicheAcceptation
            }
        })
        if(ficheAcceptation === null) throw "Une erreur est survenue lors de la récupération de la fiche d'acceptation du bon de commande."        
    }
    catch(error) {
        infos = errorHandler(error)
    }

    res.send({
        infos,
        ficheAcceptation
    })
})
.post('/checkFicheAcceptation', (req, res) => {
    let infos = undefined

    try {
        checkFicheAcceptation(req.body, req.session.client)
        infos = errorHandler(undefined, 'ok')
    }
    catch(error) {
        infos = errorHandler(error)
    }

    res.send({
        infos
    })
})

module.exports = {
    router,
    checkFicheAcceptation,
    createFicheAcceptation
}