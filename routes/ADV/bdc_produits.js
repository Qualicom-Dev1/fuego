const express = require('express')
const router = express.Router()
const models = global.db
const { ADV_BDC_produit, ADV_produit } = models
const { create_BDC_categorie } = require('./bdc_categories')
const { Op } = require('sequelize')
const errorHandler = require('../utils/errorHandler')
const isSet = require('../utils/isSet')
const validations = require('../utils/validations')

// vérifie un produit tel que saisi sur le BDC
async function checkProduit(produit) {
    if(!isSet(produit)) throw "Un produit doit être transmis."

    produit.idADV_produit = validations.validationInteger(produit.idADV_produit, "L'identifiant du produit de référence")
    produit.quantite = validations.validationInteger(produit.quantite, "La quantité par produit", 'e')
    // if(isSet(produit.ref)) produit.ref = validations.validationString(produit.ref, "La référence produit", 'e')
    produit.designation = validations.validationString(produit.designation, "La désignation du produit", 'e')
    // if(isSet(produit.description)) produit.description = validations.validationString(produit.description, "La description du produit", 'e')
    // else produit.description = ''

    // if(isSet(produit.caracteristique)) produit.caracteristique = validations.validationNumbers(produit.caracteristique, "La caractéristique technique du produit", "e")
    // else produit.caracteristique = null
    // if(isSet(produit.caracteristique) && !isSet(produit.uniteCaracteristique)) throw "L'unité de mesure de la caractéristique technique du produit doit être transmise."
    // if(isSet(produit.uniteCaracteristique) && !isSet(produit.caracteristique)) throw "La caractéristique technique du produit doit être transmise."
    
    produit.prixUnitaireHT = validations.validationNumbers(produit.prixUnitaireHT, "Le prix unitaire HT du produit")
    // produit.prixUnitaireTTC = validations.validationNumbers(produit.prixUnitaireTTC, "Le prix unitaire du produit")
    // if(isSet(produit.tauxTVA)) produit.tauxTVA = validations.validationNumbers(produit.tauxTVA, "Le taux de TVA applicable au produit")
    // produit.montantTVA = validations.validationNumbers(produit.montantTVA, "Le montant de la TVA appliquée au produit")

    // vérification de l'existence du produit de référence
    const produitRef = await ADV_produit.findOne({
        include : [{
            model : ADV_categorie,
            as : 'categories',
            attributes : ['id', 'nom']
        }],
        where : {
            id : produit.idADV_produit
        }
    })
    if(produitRef === null) throw `Le produit de référence pour "${produit.designation}" est introuvable.`
    produit.produitRef = produitRef

    // affectation des informations transmises par le produit de référence
    produit.ref = produitRef.ref
    produit.description = produitRef.description
    produit.caracteristique = produitRef.caracteristique
    produit.uniteCaracteristique = produitRef.uniteCaracteristique
    produit.isGroupe = produitRef.isGroupe
    produit.tauxTVA = produitRef.tauxTVA
    produit.prixUnitaireTTC = Number(Number(Math.round(((produit.prixUnitaireHT * produit.tauxTVA) + Number.EPSILON) * 100) / 100).toFixed(2))
    produit.montantTVA = Number(Number(Math.round(((produit.prixUnitaireTTC - produit.prixUnitaireHT) + Number.EPSILON) * 100) / 100).toFixed(2))

    return produit
}

async function checkGroupeProduits(groupeProduits)  {

}

// répartisseur de la vérification des produits et groupes de produits
async function checkProduitSent(produitSent) {

}

async function create_BDC_produit(produitSent) {

}

// parcours la liste de produits et créée les catégories nécessaires 
// ainsi que complète le tableau de correspondances avec l'idADV_categorie et l'idADV_BDC_categorie afin de pouvoir faire correspondre ensuite les nouvelles catégories aux produits
// la fonction est récursive, donc si un groupement de produits elle s'appellera sur les sous produits
async function createListeCategories(listeProduits, tableauCorrespondancesCategories = []) {
    if(!isSet(produit)) throw "Un produit doit être transmis."

    // parcours de la liste de produits
    for(let i = 0; i < listeProduits.length; i++) {
        if(listeProduitSent[i].isGroupe) {

        }
        else {

        }
    }

    return {
        listeProduits,
        tableauCorrespondancesCategories
    }
}

// créé la liste de produits du BDC
// doit créer les catégories liées aux produits sélectionnés
// doit créer les produits et les sous produits
// renvoie la liste des ids des produits créés telle quelle sera stockée par le BDC
async function create_BDC_listeProduits(listeProduitSent) {
    if(!isSet(listeProduitSent)) throw "La liste des produits doit être transmise."

    // tableau d'objets contenant les correspondances entre la catégorie de type ADV_categorie 
    // et la nouvelle catégorie créée pour ce BDC de type ADV_BDC_categorie
    const correspondanceCategories = []

    // parcours la liste de produits envoyés
    for(let i = 0; i < listeProduitSent.length; i++) {

        if(listeProduitSent[i].isGroupe) {
            if(listeProduitSent[i].listeProduits && listeProduitSent[i].listeProduits.length < 2) throw `Le groupement "${listeProduitSent[i].designation}" doit contenir des produits.`


        }
        else {
            listeProduitSent[i] = await checkProduit(listeProduitSent[i])
            // vérifie les catégories liées s'il y en a, pour les créer si elle ne sont pas déjà existentes
            if(produitSent.produitRef.categories && produitSent.produitRef.categories.length) {
                for(const categorie of produitSent.produitRef.categories) {
                    // créer la catégorie
                    if(correspondanceCategories.filter(elt => elt.idCategorie === categorie.id).length === 0) {
                        const bdc_categorie = await create_BDC_categorie(categorie)
                        if(bdc_categorie === null) throw `Une erreur s'est produite en créant la catégorie rattachée : ${categorie.nom}`
                        correspondanceCategories.push({ idADV_categorie : categorie.id, idADV_BDC_categorie : bdc_categorie.id })
                    }
                }
            }
        }
    }

    // la liste renvoyée est la liste d'ids des nouveaux produits tels que créé dans le BDC
    return listeProduits
}

router 
.get('/:Id_BDC_Produit', async (req, res) => {

})

module.exports = {
    router,
    checkProduit,
    create_BDC_produit,
    create_BDC_listeProduits
}