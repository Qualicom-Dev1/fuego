const express = require('express')
const { includes } = require('lodash')
const router = express.Router()
const { Facture, Devis, Prestation, TypePaiement, ClientBusiness, Pole, ProduitBusiness } = global.db
const { Op } = require('sequelize')
const errorHandler = require('../utils/errorHandler')
const isSet = require('../utils/isSet')
const validations = require('../utils/validations')
const { calculPrixPrestation } = require('./prestations')
const moment = require('moment')

async function checkFacture(facture) {
    if(!isSet(facture)) throw "Une facture doit être fournie."
    validations.validationString(facture.refFacture, "Le numéro de référence de la facture", 'e')
    if(!isSet(facture.idPrestation)) throw "La prestation liée à la facture doit être fournie."
    if(isSet(facture.dateEmission)) {
        validations.validationDateFullFR(facture.dateEmission, "La date d'émission de la facture")
    }
    if(!isSet(facture.dateEcheance)) throw "La date d'échéance du paiement doit être renseignée."
    validations.validationDateFullFR(facture.dateEcheance, "La date d'échéance de paiement")
    if(!isSet(facture.type)) throw "Le type de facture doit être renseigné."
    if(!['acompte', 'avoir', 'solde'].includes(facture.type)) throw "Le type de facture est incorrect."
    if(isSet(facture.tva)) {
        validations.validationNumbers(facture.tva, "La TVA applicable", 'e')
    }    
    if(isSet(facture.remise)) {
        validations.validationNumbers(facture.remise, "La remise", 'e')
    }
    if(!isSet(facture.idTypePaiement)) throw "Le type de paiement doit être renseigné."
    if(!isSet(facture.prixHT)) throw "Le prix HT doit être renseigné."
    validations.validationNumbers(facture.prixHT, "Le prix HT")
    if(!isSet(facture.prixTTC)) throw "Le prix TTC doit être renseigné."
    validations.validationNumbers(facture.prixTTC, "Le prix TTC")

    // vérification de l'existance du devis
    if(isSet(facture.idDevis)) {
        const devis = await Devis.findOne({
            where : {
                id : facture.idDevis
            }
        })
        if(devis === null) throw "Aucun devis correspondant."
        if(devis.isCanceled) throw "Ce devis a été annulé."
        if(devis.idPrestation !== Number(facture.idPrestation)) throw "La prestation du devis et de la facture ne concorde pas."
    }

    // vérification de l'existance de la prestation
    const prestation = await Prestation.findOne({
        where : {
            id : facture.idPrestation
        }
    })
    if(prestation === null) throw "Aucune prestation correspondante."

    if(facture.id) {
        const factureDB = await Facture.findOne({
            where : {
                id : facture.id
            }
        })
        if(factureDB === null) throw "Aucune facture correspondante."
    }

    const prix = await calculPrixFacture(facture)
    if(Number(facture.prixHT).toFixed(2) !== prix.prixHT || Number(facture.prixTTC).toFixed(2) !== prix.prixTTC) throw "Le prix du facture est incorrect, il ne peut être validé."
}

async function calculPrixFacture(facture) {
    const prixPrestation = await calculPrixPrestation(facture.idPrestation)

    const prixHT = Number(Math.round((Number(prixPrestation) - Number(isSet(facture.remise) ? facture.remise : 0) + Number.EPSILON) * 100) / 100)
    const prixTTC = Number(Math.round(((Number(prixHT) * Number(1 + ((isSet(facture.tva) ? facture.tva : 20) / 100))) + Number.EPSILON) * 100) / 100)

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
// récupères toutes les factures
.get('/all', async (eq, res) => {
    let infos = undefined
    let factures = undefined

    try {
        factures = await Facture.findAll({
            attributes : { exclude  : ['idDevis', 'idPrestation', 'idTypePaiement'] },
            include : [
                {
                    model : Devis,
                    attributes : ['refDevis']
                },
                {
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
                {
                    model : TypePaiement,
                    attributes : ['id', 'nom']
                }
            ],
            order : [['createdAt', 'DESC']]
        })

        if(factures === null) throw "Une erreur est survenue lors de la récupération des factures."

        if(factures.length === 0) {
            factures = undefined
            infos = errorHandler(undefined, "Aucune facture.")
        }
    }
    catch(error) {
        console.error(error);
    }

    res.send(factures)
})
// récupère une facture
.get('/:IdFacture', async (req, res) => {
    const IdFacture = Number(req.params.IdFacture)

    let infos = undefined
    let facture = undefined

    try {
        if(isNaN(IdFacture)) throw "Identifiant incorrect."

        const facture = await Facture.findOne({
            attributes : { exclude  : ['idDevis', 'idPrestation', 'idTypePaiement'] },
            include : [
                {
                    model : Devis,
                    attributes : ['refDevis']
                },
                {
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
                {
                    model : TypePaiement,
                    attributes : ['id', 'nom']
                }
            ],
            where : {
                id : IdFacture
            }
        })

        if(facture === null) throw "Aucune facture correspondante."
    }
    catch(error) {
        facture = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        facture
    })
})
// crée une facture
.post('', async (req, res) => {
    const factureSent = req.body

    let infos = undefined
    let facture = undefined

    try {
        await checkFacture(factureSent)

        facture = await Facture.create(factureSent)

        if(facture === null) throw "Une erreur est survenue lors de la création de la facture."

        facture = await Facture.findOne({
            attributes : { exclude  : ['idDevis', 'idPrestation', 'idTypePaiement'] },
            include : [
                {
                    model : Devis,
                    attributes : ['refDevis']
                },
                {
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
                {
                    model : TypePaiement,
                    attributes : ['id', 'nom']
                }
            ],
            where : {
                id : IdFacture
            }
        })

        if(facture === null) throw "Une erreur est survenue lors de la récupération de la facture après sa création."

        infos = errorHandler(undefined, "La facture a bien été créée.")
    }
    catch(error) {
        facture = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        facture
    })
})
// modifie unde facture
.patch('/:IdFacture', async (req, res) => {
    const IdFacture = Number(req.params.IdFacture)
    const factureSent = req.body

    let infos = undefined
    let facture = undefined

    try {
        if(isNaN(IdFacture)) throw "Identifiant incorrect."

        const facture = await Facture.findOne({
            where : {
                id : IdFacture
            }
        })

        if(facture === null) throw "Aucune facture correspondante."

        factureSent.id = IdFacture
        await checkFacture(factureSent)

        facture.refFacture = factureSent.refFacture
        facture.idDevis = isSet(factureSent.idDevis) ? factureSent.idDevis : null
        facture.idPrestation = factureSent.idPrestation
        if(isSet(factureSent.dateEmission)) facture.dateEmission = factureSent.dateEmission
        facture.dateEcheance = factureSent.dateEcheance
        facture.type = factureSent.type
        if(isSet(factureSent.tva)) facture.tva = factureSent.tva
        if(isSet(factureSent.remise)) facture.remise = factureSent.remise
        facture.prixHT = factureSent.prixHT
        facture.prixTTC = factureSent.prixTTC

        await facture.save()

        facture = await Facture.findOne({
            attributes : { exclude  : ['idDevis', 'idPrestation', 'idTypePaiement'] },
            include : [
                {
                    model : Devis,
                    attributes : ['refDevis']
                },
                {
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
                {
                    model : TypePaiement,
                    attributes : ['id', 'nom']
                }
            ],
            where : {
                id : IdFacture
            }
        })

        if(facture === null) throw "Une erreur s'est produite lors de la récupération de la facture après sa modification."

        infos = errorHandler(undefined, "La facture a bien été modifiée.")
    }
    catch(error) {
        facture = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        facture
    })
})
// paiement facture
// type paiement et date
.patch('/:IdFacture/paiement', async (req, res) => {
    const IdFacture = Number(req.params.IdFacture)
    const factureSent = req.body

    let infos = undefined
    let facture = undefined

    try {
        if(isNaN(IdFacture)) throw "Identifiant incorrect."
        if(!isSet(factureSent.idTypePaiement)) throw "Le type de paiement doit être renseigné."
        if(isNaN(Number(factureSent.idTypePaiement))) throw "L'identifiant du type de paiement est incorrect."
        if(isSet(factureSent.datePaiement)) {
            validations.validationDateFullFR(factureSent.datePaiement, "La date de paiement")
        }

        const typePaiement = await TypePaiement.findOne({
            where : {
                id : factureSent.typePaiement
            }
        })
        if(typePaiement === null) throw "Aucun type de paiement correspondant."

        facture = await Facture.findOne({
            attributes : { exclude  : ['idDevis', 'idPrestation', 'idTypePaiement'] },
            include : [
                {
                    model : Devis,
                    attributes : ['refDevis']
                },
                {
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
                {
                    model : TypePaiement,
                    attributes : ['id', 'nom']
                }
            ],
            where : {
                id : IdFacture
            }
        })

        if(facture === null) throw "Aucune facture correspondante."

        facture.idTypePaiement = typePaiement.id
        facture.datePaiement = isSet(factureSent.datePaiement) ? factureSent.datePaiement : moment().format('YYYY-MM-DD')
    }
    catch(error) {
        facture = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        facture
    })
})
// annulation facture
.patch('/:IdFacture/cancel', async (req, res) => {
    const IdFacture = Number(req.params.IdFacture)

    let infos = undefined
    let facture = undefined

    try {
        if(isNaN(IdFacture)) throw "Identifiant incorrect."

    }
    catch(error) {
        facture = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        facture
    })
})

module.exports = router