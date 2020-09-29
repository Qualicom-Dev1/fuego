const express = require('express')
const router = express.Router()
const { Devis, Prestation, Facture, ClientBusiness, Pole, ProduitBusiness } = global.db
const { Op } = require('sequelize')
const errorHandler = require('../utils/errorHandler')
const isSet = require('../utils/isSet')
const validations = require('../utils/validations')
const { calculPrixPrestation } = require('./prestations')

async function checkDevis(devis) {
    if(!isSet(devis)) throw "Un devis doit être fourni."
    validations.validationString(devis.refDevis, "Le numéro de référence du devis")
    if(!isSet(devis.idPrestation)) throw "La prestation liée au devis doit être fournie."
    if(isSet(devis.tva)) {
        validations.validationNumbers(devis.tva, "La TVA applicable", 'e')
    }    
    if(isSet(devis.remise)) {
        validations.validationNumbers(devis.remise, "La remise", 'e')
    }
    if(!isSet(devis.prixHT)) throw "Le prix HT doit être renseigné."
    validations.validationNumbers(devis.prixHT, "Le prix HT")
    if(!isSet(devis.prixTTC)) throw "Le prix TTC doit être renseigné."
    validations.validationNumbers(devis.prixTTC, "Le prix TTC")

    // vérification de l'existance de la prestation
    const prestation = await Prestation.findOne({
        where : {
            id : devis.idPrestation
        }
    })
    if(prestation === null) throw "Aucune prestation correspondante."

    if(devis.id) {
        const devisDB = await Devis.findOne({
            where : {
                id : devis.id
            }
        })
        if(devisDB === null) throw "Aucun devis correspondant."
    }

    const prix = await calculPrixDevis(devis)
    if(Number(devis.prixHT).toFixed(2) !== prix.prixHT || Number(devis.prixTTC).toFixed(2) !== prix.prixTTC) throw "Le prix du devis est incorrect, il ne peut être validé."
}

async function calculPrixDevis(devis) {
    const prixPrestation = await calculPrixPrestation(devis.idPrestation)

    const prixHT = Number(Math.round((Number(prixPrestation) - Number(isSet(devis.remise) ? devis.remise : 0) + Number.EPSILON) * 100) / 100)
    const prixTTC = Number(Math.round(((Number(prixHT) * Number(1 + ((isSet(devis.tva) ? devis.tva : 20) / 100))) + Number.EPSILON) * 100) / 100)

    return {
        prixHT : prixHT.toFixed(2),
        prixTTC : prixTTC.toFixed(2)
    }
}

router
// accueil
.get('/', async (req, res) => {
    res.send('ok')
})
// récupère tous les devis
.get('/all', async (req, res) => {
    let infos = undefined
    let devis = undefined

    try {
        devis = await Devis.findAll({
            attributes : ['id', 'refDevis', 'isValidated', 'tva', 'remise', 'prixHT', 'prixTTC', 'isCanceled'],
            include : {
                model : Prestation,
                attributes : ['id', 'createdAt'],
                include : [
                    { model : ClientBusiness },
                    { 
                        model : Pole,
                        attributes : ['id', 'nom']
                    }
                ]
            },
            order : [['createdAt', 'DESC']]
        })

        if(devis === null) throw "Une erreur est survenue lors de la récupération des devis."

        if(devis.length === 0) {
            devis = undefined
            infos = errorHandler(undefined, "Aucun devis.")
        }
    }
    catch(error) {
        devis = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        devis
    })
})
// récupère un devis par son id
.get('/:IdDevis', async (req, res) => {
    const IdDevis = Number(req.params.IdDevis)

    let infos = undefined
    let devis = undefined

    try {
        if(isNaN(IdDevis)) throw "Identifiant incorrect."

        devis = await Devis.findOne({
            attributes : ['id', 'refDevis', 'isValidated', 'tva', 'remise', 'prixHT', 'prixTTC', 'isCanceled'],
            include : {
                model : Prestation,
                attributes : ['id', 'createdAt'],
                include : [
                    { model : ClientBusiness },
                    { 
                        model : Pole,
                        attributes : ['id', 'nom']
                    },
                    { model : ProduitBusiness }
                ]
            },
            where : {
                id : IdDevis
            }
        })

        if(devis === null) throw "Aucun devis correspondant."
    }
    catch(error) {
        devis = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        devis
    })
})
// crée un devis
.post('', async (req, res) => {
    const devisSent = req.body

    let infos = undefined
    let devis = undefined

    try {
        await checkDevis(devisSent)

        devis = await Devis.create(devisSent)

        if(devis === null) throw "Une erreur est survenue lors de la création du devis."

        devis = await Devis.findOne({
            attributes : ['id', 'refDevis', 'isValidated', 'tva', 'remise', 'prixHT', 'prixTTC', 'isCanceled'],
            include : {
                model : Prestation,
                attributes : ['id', 'createdAt'],
                include : [
                    { model : ClientBusiness },
                    { 
                        model : Pole,
                        attributes : ['id', 'nom']
                    },
                    { model : ProduitBusiness }
                ]
            },
            where : {
                id : devis.id
            }
        })

        if(devis === null) throw "Une erreur est survenue lors de la récupération du devis suite à sa création."

        infos = errorHandler(undefined, "Le devis a bien été créé.")
    }
    catch(error) {
        devis = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        devis
    })
})
// modifie un devis
.patch('/:IdDevis', async (req, res) => {
    const IdDevis = Number(req.params.IdDevis)
    const devisSent = req.body

    let infos = undefined
    let devis = undefined

    try {
        if(isNaN(IdDevis)) throw "Identifiant incorrect."

        devis = await Devis.findOne({
            where : {
                id : IdDevis
            }
        })

        if(devis === null) throw "Aucun devis correspondant."

        devisSent.id = IdDevis
        await checkDevis(devisSent)

        devis.refDevis = devisSent.refDevis
        devis.idPrestation = devisSent.idPrestation
        if(isSet(devisSent.tva)) {
            devis.tva =  devisSent.tva
        }
        if(isSet(devisSent.remise)) {
            devis.remise = devisSent.remise
        }
        devis.prixHT = devisSent.prixHT
        devis.prixTTC = devisSent.prixTTC

        await devis.save()

        devis = await Devis.findOne({
            attributes : ['id', 'refDevis', 'isValidated', 'tva', 'remise', 'prixHT', 'prixTTC', 'isCanceled'],
            include : {
                model : Prestation,
                attributes : ['id', 'createdAt'],
                include : [
                    { model : ClientBusiness },
                    { 
                        model : Pole,
                        attributes : ['id', 'nom']
                    },
                    { model : ProduitBusiness }
                ]
            },
            where : {
                id : devis.id
            }
        })

        if(devis === null) throw "Une erreur est survenue lors de la récupération du devis après sa modification."

        infos = errorHandler(undefined, "Le devis a bien été modifié.")
    }
    catch(error) {
        devis = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        devis
    })
})
// valide un devis
.patch('/:IdDevis/validate', async (req, res) => {
    const IdDevis = Number(req.params.IdDevis)

    let infos = undefined
    let devis = undefined

    try {
        if(isNaN(IdDevis)) throw "Identifiant incorrect."

        devis = await Devis.findOne({
            attributes : ['id', 'refDevis', 'isValidated', 'tva', 'remise', 'prixHT', 'prixTTC', 'isCanceled'],
            include : {
                model : Prestation,
                attributes : ['id', 'createdAt'],
                include : [
                    { model : ClientBusiness },
                    { 
                        model : Pole,
                        attributes : ['id', 'nom']
                    },
                    { model : ProduitBusiness }
                ]
            },
            where : {
                id : IdDevis
            }
        })

        if(devis === null) throw "Aucun devis correspondant."
        if(devis.isCanceled) throw "Le devis est annulé, il ne peut pas être validé."

        devis.isValidated = true
        await devis.save()

        infos = errorHandler(undefined, "Le devis a bien été validé.")
    }
    catch(error) {
        devis = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        devis
    })
})
// annule un devis
.patch('/:IdDevis/cancel', async (req, res) => {
    const IdDevis = Number(req.params.IdDevis)

    let infos = undefined
    let devis = undefined

    try {
        if(isNaN(IdDevis)) throw "Identifiant incorrect."

        devis = await Devis.findOne({
            attributes : ['id', 'refDevis', 'isValidated', 'tva', 'remise', 'prixHT', 'prixTTC', 'isCanceled'],
            include : {
                model : Prestation,
                attributes : ['id', 'createdAt'],
                include : [
                    { model : ClientBusiness },
                    { 
                        model : Pole,
                        attributes : ['id', 'nom']
                    },
                    { model : ProduitBusiness }
                ]
            },
            where : {
                id : IdDevis
            }
        })

        if(devis === null) throw "Aucun devis correspondant."
        if(devis.isValidated) throw "Le devis est validé, il ne peut être annulé."

        devis.isCanceled = true
        await devis.save()

        infos = errorHandler(undefined, "Le devis a bien été annulé.")
    }
    catch(error) {
        devis = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        devis
    })
})
// supprime un devis
.delete('/:IdDevis', async (req, res) => {
    const IdDevis = Number(req.params.IdDevis)

    let infos = undefined
    let devis = undefined

    try {
        if(isNaN(IdDevis)) throw "Identifiant incorrect."

        devis = await Devis.findOne({
            attributes : ['id', 'refDevis', 'isValidated', 'tva', 'remise', 'prixHT', 'prixTTC', 'isCanceled'],
            include : {
                model : Prestation,
                attributes : ['id', 'createdAt'],
                include : [
                    { model : ClientBusiness },
                    { 
                        model : Pole,
                        attributes : ['id', 'nom']
                    },
                    { model : ProduitBusiness }
                ]
            },
            where : {
                id : IdDevis
            }
        })

        if(devis === null) throw "Aucun devis correspondant."

        const facture = await Facture.findOne({
            where : {
                idDevis : devis.id,
                isCanceled : false
            }
        })

        if(facture !== null) throw "Une facture utilise ce devis, impossible de le supprimer."

        await devis.destroy()

        infos = errorHandler(undefined, "Le devis a bien été supprimé.")
    }
    catch(error) {
        devis = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        devis
    })
})

module.exports = router