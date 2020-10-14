const express = require('express')
const router = express.Router()
const { Devis, Prestation, Facture, ClientBusiness, Pole, ProduitBusiness } = global.db
const numeroReferenceFormatter = require('../utils/numeroReferenceFormatter')
const { Op } = require('sequelize')
const errorHandler = require('../utils/errorHandler')
const isSet = require('../utils/isSet')
const validations = require('../utils/validations')
// const { calculPrixPrestation } = require('./prestations')
const { getProduitWithListeProduits } = require('./produitsBusiness')

async function checkDevis(devis) {
    if(!isSet(devis)) throw "Un devis doit être fourni."
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

async function calculPrixDevis(devis, transaction = undefined) {
    const { calculPrixPrestation } = require('./prestations')
    const prixPrestation = await calculPrixPrestation(devis.idPrestation, transaction)
    console.log('prix prestation après modif : ' + prixPrestation)

    const prixHT = Number(Math.round((Number(prixPrestation) - Number(isSet(devis.remise) ? devis.remise : 0) + Number.EPSILON) * 100) / 100)
    const prixTTC = Number(Math.round(((Number(prixHT) * Number(1 + ((isSet(devis.tva) ? devis.tva : 20) / 100))) + Number.EPSILON) * 100) / 100)

    return {
        prixHT : prixHT.toFixed(2),
        prixTTC : prixTTC.toFixed(2)
    }
}

async function getAll() {
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

    return {
        infos,
        devis
    }
}

router
// accueil
.get('/', async (req, res) => {
    const { infos, devis } = await getAll()

    res.render('facturation/devis', { 
        extractStyles: true,
        title : 'Devis | FUEGO', 
        description : 'Gestion des devis',
        session : req.session.client,
        options_top_bar : 'facturation',
        infos,
        devis,
        moment
    })
})
// récupère tous les devis
.get('/all', async (req, res) => {
    const { infos, devis } = await getAll()

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

        const refDevis = numeroReferenceFormatter.createNumeroReferenceBase('devis')
        devisSent.refDevis = refDevis

        devis = await Devis.create(devisSent)

        if(devis === null) throw "Une erreur est survenue lors de la création du devis."

        // màj du numéro de devis
        devis.refDevis = await numeroReferenceFormatter.setNumeroReferenceFinal(devis.refDevis)
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

        // vérifie que le devis n'est pas utilisé
        const facture = await Facture.findOne({
            where : {
                idDevis : IdDevis,
                isCanceled : false
            }
        })
        if(facture !== null) throw "Le devis est déjà utilisé, impossible de le modifier."

        devisSent.id = IdDevis
        await checkDevis(devisSent)
        
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

        const facture = await Facture.findOne({
            where : {
                idDevis : IdDevis,
                isCanceled : false
            }
        })
        if(facture !== null) throw "Le devis est utilisé, il ne peut être annulé."

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
// route tampon pour les pdf devis
.get('/:IdDevis/pdf', async (req, res) => {
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

        devis = JSON.parse(JSON.stringify(devis))
        for(let i = 0; i < devis.Prestation.ProduitsBusiness.length; i++) {
            devis.Prestation.ProduitsBusiness[i] = await getProduitWithListeProduits(devis.Prestation.ProduitsBusiness[i])
        }

        // TODO : gérer la redirection pour la génération du pdf

        res.send(devis)
    }
    catch(error) {
        infos = errorHandler(error)
        res.send(infos.error)
    }
})

module.exports = {
    router,
    calculPrixDevis
}