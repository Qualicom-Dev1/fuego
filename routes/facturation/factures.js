const express = require('express')
const router = express.Router()
const { Facture, Devis, Prestation, TypePaiement, ClientBusiness, Pole, ProduitBusiness } = global.db
const { Op } = require('sequelize')
const errorHandler = require('../utils/errorHandler')
const isSet = require('../utils/isSet')
const validations = require('../utils/validations')
const { calculPrixPrestation, calculResteAPayerPrestation } = require('./prestations')
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
    if(!['acompte', 'solde'].includes(facture.type)) throw "Le type de facture est incorrect."
    if(facture.type === 'acompte') {
        if(!isSet(facture.valeurAcompte)) throw "L'acompte doit être renseigné."
        validations.validationNumbers(facture.valeurAcompte, "L'acompte")
        if((!isSet(facture.isAcomptePourcentage) || !!facture.isAcomptePourcentage) && (Number(facture.valeurAcompte) > 80)) throw "Le pourcentage d'acompte ne peut pas être supérieur à 80%."
    }
    if(isSet(facture.tva)) {
        validations.validationNumbers(facture.tva, "La TVA applicable", 'e')
    }    
    if(isSet(facture.remise)) {
        if(facture.type !== "solde") throw "Seules les factures de tout solde peuvent avoir une remise."
        validations.validationNumbers(facture.remise, "La remise", 'e')
    }
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

    // vérification du prix
    const prixFacture = await calculPrixFacture(facture)
    if(['solde', 'acompte'].includes(facture.type)) {
        if(Number(facture.prixHT).toFixed(2) !== prixFacture.prixHT || Number(facture.prixTTC).toFixed(2) !== prixFacture.prixTTC) throw "Le montant de la facture est incorrect, il ne peut être validé."
    }
}

async function calculMontantAvoirTotalPrestation(idPrestation) {
    if(!isSet(idPrestation)) throw "La prestation doit être fournie."

    const prestation = await Prestation.findOne({
        where : {
            id : idPrestation
        }
    })
    if(prestation === null) throw "Une erreur est survenue lors de la récupération de la prestation pour le calcul du montant de l'avoir."

    // récupère toutes les factures de la prestation qui ne sont pas annulées
    const factures = await Facture.findAll({
        where : {
            idPrestation,
            isCanceled : false,
            type : {
                [Op.not] : 'avoir'
            }
        },
        order : [['tva', 'ASC']]
    })
    if(factures === null) throw "Une erreur est survenue lors de la récupération des factures pour le calcul du montant de l'avoir."
    if(factures.length === 0) throw "Aucune facture n'a été émise pour cette prestation, un avoir ne peut donc pas être créé."

    const montants = []

    // on récupère le montant pour chaque taux de tva
    for(const facture of factures) {
        if(montants[facture.tva] === undefined) {
            montants[facture.tva] = {
                prixHT : 0,
                prixTTC : 0,
                tva : facture.tva
            }
        }

        montants[facture.tva].prixHT = Number(Math.round(((Number(montants[facture.tva].prixHT) + Number(facture.prixHT)) + Number.EPSILON) * 100) / 100).toFixed(2)
        montants[facture.tva].prixTTC = Number(Math.round(((Number(montants[facture.tva].prixTTC) + Number(facture.prixTTC)) + Number.EPSILON) * 100) / 100).toFixed(2)
    }

    const total = {
        HT : Number(montants.reduce((accumulator, montant) =>  Number(Math.round(((Number(accumulator) + Number(montant.prixHT)) + Number.EPSILON) * 100) / 100), 0)).toFixed(2),
        TTC : Number(montants.reduce((accumulator, montant) =>  Number(Math.round(((Number(accumulator) + Number(montant.prixTTC)) + Number.EPSILON) * 100) / 100), 0)).toFixed(2)
    }

    return {
        montants,
        total
    }
}

async function calculMontantAvoirfacture(idFacture) {
    if(!isSet(idFacture)) throw "Une facture doit être transmise."

    const facture = await Facture.findOne({
        where : {
            id : idFacture
        }
    })
    if(facture === null) throw "Une erreur s'est produite lors de la récupération de la facture pour calculer l'avoir."

    return {
        prixHT : Number(facture.prixHT).toFixed(2),
        prixTTC : Number(facture.prixTTC).toFixed(2)
    }
}

async function calculPrixFacture(facture) {
    let resteAPayerPrestation = await calculResteAPayerPrestation(facture.idPrestation)

    // si c'est pour une facture existante, il faut d'abord retirer le prix de la facture modifée avant de faire les calculs
    if(facture.id) {
        const factureDB = await Facture.findOne({
            where : {
                id : facture.id
            }
        })
        if(factureDB === null) throw "Une erreur est survenue lors de la récupération de la facture pour le calcul du prix."

        resteAPayerPrestation = Number(Math.round((Number(resteAPayerPrestation) + Number(facture.prixHT) + Number.EPSILON) * 100) / 100)
    }

    let prixHT = 0
    let prixTTC = 0

    if(facture.type === "solde") {
        prixHT = Number(Math.round((Number(resteAPayerPrestation) - Number(isSet(facture.remise) ? facture.remise : 0) + Number.EPSILON) * 100) / 100)
        prixTTC = Number(Math.round(((Number(prixHT) * Number(1 + ((isSet(facture.tva) ? facture.tva : 20) / 100))) + Number.EPSILON) * 100) / 100)
    }
    if(facture.type === "acompte") {
        // calculer à partir du pourcentage d'acompte
        if(!!facture.isAcomptePourcentage) {
            prixHT = Number(Math.round(((Number(resteAPayerPrestation) * (Number(facture.valeurAcompte) / 100)) + Number.EPSILON) * 100) / 100)
        }
        // calculer à partir de la valeur d'acompte
        else {
            prixHT = Number(Math.round((Number(resteAPayerPrestation) - Number(facture.valeurAcompte) + Number.EPSILON) * 100) / 100)
        }
        prixTTC = Number(Math.round(((Number(prixHT) * Number(1 + ((isSet(facture.tva) ? facture.tva : 20) / 100))) + Number.EPSILON) * 100) / 100)
    }
    // if(facture.type === "avoir") {
    //     // récupère les prix des factures émises
    //     const montantsFactures = await calculMontantAvoirTotalPrestation(idPrestation)
    //     prixHT = montantsFactures.total.HT
    //     prixTTC = montantsFactures.total.TTC
    // }

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
                    attributes : ['id', 'refDevis']
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
        factures = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        factures
    })
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
                    attributes : ['id', 'refDevis']
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
                    attributes : ['id', 'refDevis']
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
                id : facture.id
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

        facture = await Facture.findOne({
            where : {
                id : IdFacture
            }
        })

        if(facture === null) throw "Aucune facture correspondante."

        // vérifie si une nouvelle facture a été émise
        const lastFacture = await Facture.findOne({
            where : {
                idPrestation : facture.idPrestation
            },
            order : [['id', 'DESC']]
        })
        if(facture.id !== lastFacture.id) throw "Une nouvelle facture a été émise, impossible de modifier celle-ci."

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
                    attributes : ['id', 'refDevis']
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
                id : factureSent.idTypePaiement
            }
        })
        if(typePaiement === null) throw "Aucun type de paiement correspondant."

        facture = await Facture.findOne({
            where : {
                id : IdFacture
            }
        })

        if(facture === null) throw "Aucune facture correspondante."
        if(facture.datePaiement !== null) throw "La facture a déjà été payée."

        facture.idTypePaiement = typePaiement.id
        facture.datePaiement = isSet(factureSent.datePaiement) ? factureSent.datePaiement : moment().format('DD/MM/YYYY')

        await facture.save()

        facture = await Facture.findOne({
            attributes : { exclude  : ['idDevis', 'idPrestation', 'idTypePaiement'] },
            include : [
                {
                    model : Devis,
                    attributes : ['id', 'refDevis']
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
                id : facture.id
            }
        })

        if(facture === null) throw "Une erreur est survenue lors de la récupération de la facture après son paiement."

        infos = errorHandler(undefined, "Le paiement de la facture a bien été effectué.")
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
    let urlAvoir = undefined

    try {
        if(isNaN(IdFacture)) throw "Identifiant incorrect."

        facture = await Facture.findOne({
            attributes : { exclude  : ['idDevis', 'idPrestation', 'idTypePaiement'] },
            include : [
                {
                    model : Devis,
                    attributes : ['id', 'refDevis']
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

        if(facture === null) throw "Une erreur est survenue lors de la récupération de la facture."
        if(facture.isCanceled) throw "La facture est déjà annulée."
        
        // vérifie si une nouvelle facture a été émise
        const facturePrecedente = await Facture.findOne({
            where : {
                idPrestation : facture.Prestation.id
            },
            order : [['id', 'DESC']]
        })
        if(facture.id !== facturePrecedente.id) throw "Une nouvelle facture a été émise pour cette prestation, impossible d'annuler celle-ci."

        facture.isCanceled = true

        if(facture.datePaiement !== null) {
            // création de la facture d'avoir
            const factureAvoir = await Facture.create({
                // TODO: gérer ref facture d'avoir
                refFacture : 'voir pour le créer',
                idDevis : facture.idDevis,
                idPrestation : facture.Prestation.id,
                dateEcheance : moment().format('DD/MM/YYYY'),
                type : 'avoir',
                tva : facture.tva,
                prixHT : facture.prixHT,
                prixTTC : facture.prixTTC,
                idFactureAnnulee : facture.id
            })
            if(factureAvoir === null) throw "Une erreur est survenue lors de la création de la facture d'avoir."

            // TODO: voir pour la gestion de l'url d'avoir ici
            urlAvoir = 'mon url ici'
        }

        await facture.save()

        infos = errorHandler(undefined, "La facture a bien été annulée.")
    }
    catch(error) {
        if(!isNaN(IdFacture)) {
            Facture.destroy({
                where : {
                    idFactureAnnulee : IdFacture
                }
            })
        }

        facture = undefined
        urlAvoir = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        facture,
        urlAvoir
    })
})

module.exports = router