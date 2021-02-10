const express = require('express')
const router = express.Router()
const models = global.db
const { ADV_produit, Structure } = models
const moment = require('moment')
const { Op } = require('sequelize')
const errorHandler = require('../utils/errorHandler')
const isSet = require('../utils/isSet')
const validations = require('../utils/validations')

async function checkProduit(produit, user) {
    if(!isSet(produit)) throw "Un produit doit être transmis."
    if(isSet(produit.ref)) validations.validationString(produit.ref, "La référence produit", "e")
    validations.validationString(produit.nom, "Le nom du produit")
    if(isSet(produit.designation)) validations.validationString(produit.designation, "La désignation du produit", "e")
    if(isSet(produit.description)) validations.validationString(produit.description, "La description du produit", "e")
    if(isSet(produit.caracteristique)) validations.validationNumbers(produit.caracteristique, "La caractéristique technique du produit", "e")
    if(isSet(produit.caracteristique) && !isSet(produit.uniteCaracteristique)) throw "L'unité de mesure de la caractéristique technique du produit doit être transmise."
    validations.validationNumbers(produit.prixUnitaireHT, "Le prix unitaire HT du produit")
    validations.validationNumbers(produit.prixUnitaireTTC, "Le prix unitaire TTC du produit")
    validations.validationNumbers(produit.tauxTVA, "Le taux de TVA applicable au produit")
    validations.validationNumbers(produit.montantTVA, "Le montant de la TVA appliquée au produit")
    if(!isSet(produit.idStructure)) throw "Le produit doit être lié à une structure."

    // vérifie la structure
    const structure = await Structure.findOne({
        include : {
            model : models.Type,
            where : {
                nom : 'Agence'
            }
        },
        where : {
            id : produit.idStructure
        }
    })
    if(structure === null) throw "Aucune structure correspondante."
    if(!user.Structures.some(userStructure => userStructure.id === structure.id)) throw "Vous ne pouvez pas créer de produit pour une structure à laquelle vous n'appartenez pas."    
    
    // vérification que le nom ne soit pas déjà utilisé
    const checkNom = await ADV_produit.findOne({
        where : {
            nom : produit.nom,
            idStructure : produit.idStructure
        }
    })
    if(checkNom !== null && (!produit.id || produit.id !== checkNom.id)) throw "Le nom est déjà utilisé par un autre produit."

    // vérification de la liste de produits
    if(isSet(produit.isGroupe) && !!produit.isGroupe && isSet(produit.listeIdsProduits)) {
        if(typeof produit.listeIdsProduits !== "string" || !/^(\d+,)+(\d+){1}$/g.test(produit.listeIdsProduits) || produit.listeIdsProduits.length < 1) throw "Le format de la liste de produits est incorrect."

        const tabPromiseProduits = []
        const ids = produit.listeIdsProduits.split(',')

        if(ids.length < 1) throw "Le groupe doit contenir au moins 2 produits."

        for(const id of ids) {
            tabPromiseProduits.push(
                ADV_produit.findOne({
                    where : {
                        id,
                        idStructure : produit.idStructure
                    }
                })
            )
        }

        const listeProduits = await Promise.all(tabPromiseProduits)

        for(const produit of listeProduits) {
            if(produit === null) throw "Un produit présent dans la liste ne correspond à aucun produit existant."
        }
    }

    // vérification des prix
    const prixUnitaireHT = Number(produit.prixUnitaireHT)
    const prixUnitaireTTC = Number(produit.prixUnitaireTTC)
    const tauxTVA = Number(produit.tauxTVA / 100)
    const montantTVA = Number(produit.montantTVA)

    const diffTTCHT = Number(prixUnitaireTTC - prixUnitaireHT)
    const calculMontantTVA = Number(Math.round(((prixUnitaireHT * tauxTVA) + Number.EPSILON) * 100) / 100)

    if(prixUnitaireTTC !== Number(Math.round(((prixUnitaireHT * Number(1 + tauxTVA)) + Number.EPSILON) * 100) / 100)) throw "Le prix unitaire TTC est incorrect."
    if(montantTVA !== diffTTCHT || montantTVA !== calculMontantTVA || diffTTCHT !== calculMontantTVA) throw "Le montant de la TVA est incorrect."
}

router
// renvoie sur la page d'accueil des produits
.get('/dashboard', async (req, res) => {
    let infos = undefined
    let agences = undefined

    try {
        agences = await Structure.findAll({
            attributes : ['id', 'nom'],
            include : {
                model : models.Type,
                where : {
                    nom : 'Agence'
                },
                attributes : []
            },
            where : {
                id : {
                    [Op.in] : req.session.client.Structures.map(structure => structure.id)
                }
            },
            order : [['nom', 'ASC']]
        })
        if(agences === null || agences.length === 0) throw "Aucune agence disponible."
    }
    catch(error) {
        agences = undefined
        infos = errorHandler(error)
    }

    res.render('ADV/produits', { extractStyles: true, title: 'ADV Produits | FUEGO', session: req.session.client, options_top_bar: 'adv', infos, agences });
})
// renvoie tous les produits
.get('/', async (req, res) => {
    res.send('renvoie tous les produits')
})
// renvoie un produit
.get('/IdProduit', async (req, res) => {
    res.send('renvoie un produit')
})
// créé un produit
.post('/', async (req, res) => {
    res.send('créé un produit')
})
// modifie un produit
.patch('/IdProduit', async (req, res) => {
    res.send('modifie un produit')
})
// retire un produit
.delete('/IdProduit', async (req, res) => {
    res.send('retire un produit')
})

module.exports = router