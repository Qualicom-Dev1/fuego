const express = require('express')
const router = express.Router()
const models = global.db
const { 
    ADV_produit, Structure, ADV_categorie, 
    ADV_BDC, ADV_BDC_client, ADV_BDC_client_ficheRenseignementsTechniques, ADV_BDC_infoPaiement, ADV_BDC_produit, ADV_BDC_categorie 
} = models
const { create_BDC_categorie } = require('./bdc_categories')
const moment = require('moment')
const { Op } = require('sequelize')
const errorHandler = require('../utils/errorHandler')
const isSet = require('../utils/isSet')
const validations = require('../utils/validations')

async function checkBDC(bdc) {

}

// créé la liste des catégories du BDC à partir d'une liste de produits
// ainsi que complète le tableau de correspondances avec l'idADV_categorie et l'idADV_BDC_categorie afin de pouvoir faire correspondre ensuite les nouvelles catégories aux produits
// la fonction est récursive, donc si un groupement de produits elle s'appellera sur les sous produits
async function createListeCategoriesBDC(listeProduits, tableauCorrespondancesCategories = []) {
    if(!isSet(listeProduits)) throw "Une liste de produits doit être transmise."

    // parcours de la liste de produits
    for(let i = 0; i < listeProduits.length; i++) {
        // on initialise la liste des ids catégorie copiées auquelles le produit sera lié
        listeProduits[i].listeIdsADV_BDC_categorie = []

        // on parcours la liste des catégories du produit
        if(listeProduits[i].produitRef.categories && listeProduits[i].produitRef.categories.length) {
            for(const categorie of listeProduits[i].produitRef.categories) {
                const correspondanceFound = tableauCorrespondancesCategories.find(elt => elt.idADV_categorie === categorie.id)

                // on regarde si la catégorie existe déjà dans le tableau de correspondances, et si elle n'y est pas on crée la catégorie
                if(!correspondanceFound) {
                    const bdc_categorie = await create_BDC_categorie(categorie)
                    if(bdc_categorie === null) throw `Une erreur s'est produite en créant la catégorie rattachée : ${categorie.nom}`

                    // ajout de la nouvelle catégorie dans le tableau de correspondances
                    tableauCorrespondancesCategories.push({ idADV_categorie : categorie.id, idADV_BDC_categorie : bdc_categorie.id })
                    // ajout de la nouvelle catégorie à la liste d'IDs catégorie du produit
                    listeProduits[i].listeIdsADV_BDC_categorie.push(bdc_categorie.id)
                }
                else {
                    // ajout de la catégorie à la liste d'IDs catégorie du produit si elle n'est pas déjà présente dans la liste
                    if(!listeProduits[i].listeIdsADV_BDC_categorie.find(id => id === correspondanceFound.idADV_BDC_categorie)) listeProduits[i].listeIdsADV_BDC_categorie.push(correspondanceFound.idADV_BDC_categorie)                    
                }
            }
        }

        if(listeProduits[i].isGroupe) {
            // on appelle récursivement la fonction sur la liste de sous produit pour ajouter les catégories manquantes
            // et que les sous produits connaissent leur liste d'IDs catégorie
            const resSousProduits = await createListeCategoriesBDC(listeProduits[i].listeProduits, tableauCorrespondancesCategories)
            
            // affectation de la liste de produits renvoyée où les produits ont en plus leur liste d'IDs catégorie
            listeProduits[i].listeProduits = resSousProduits.listeProduits
            // affectation du tableau de correspondance pour qu'il récupère les éléments qui lui ont été ajouté avec les sous produits
            tableauCorrespondancesCategories = resSousProduits.tableauCorrespondancesCategories
        }
    }

    return {
        listeProduits,
        tableauCorrespondancesCategories
    }
}

router
.get('', (req, res) => {
    res.redirect('./dashboard')
})
// accède à la page des bons de commande
.get('/dashboard', async (req, res) => {
    res.render('ADV/bdc_dashboard', { 
        extractStyles: true, 
        title: 'ADV BDC | FUEGO', 
        session: req.session.client, 
        options_top_bar: 'adv'
    });
})
// récupère la liste des BDCs d'une structure
.get('/all', async (req, res) => {
    let infos = undefined
    let bdcs = undefined

    try {
        // récupère les ids des vendeurs dépendants s'il y en a
        const idsDependances = req.session.client.Usersdependences.map(dependance => dependance.idUserInf)
        idsDependances.push(req.session.client.id)

        bdcs = await ADV_BDC.findAll({
            where : {
                idVendeur : {
                    [Op.in] : idsDependances
                }
            }
        })
    }
    catch(error) {
        bdcs = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        bdcs
    })
})
// accède à la page de création d'un bon de commande
.get('/create', async (req, res) => {
    // res.send("accède à la page de création d'un bon de commande")
    res.render('ADV/bdc_creation', { 
        extractStyles: true, 
        title: 'ADV BDC | FUEGO', 
        session: req.session.client, 
        options_top_bar: 'adv'
    });
})
// récupère un bon de commande
.get('/:Id_BDC', async (req, res) => {
    res.send("récupère un bon de commande")
})
// création d'un bdc
.post('', async (req, res) => {
    // ordre d'exécution : 
    //   - checkBDC avec checkListeProduits et on récupère la liste de produits modifiée ensuite
    //   - createListeCategoriesBDC
    //   - create_BDC_listeProduits
    res.send("création d'un bdc")
})
// modification d'un bdc
.patch(':Id_BDC', async (req, res) => {
    res.send("modification d'un bdc?")
})
// annulation d'un bdc
.patch(':Id_BDC/cancel', async (req, res) => {
    // penser à mettre à null la vente avec l'ID du BDC s'il y en a une
    res.send("annulation d'un bdc?")
})
// suppression d'un bdc
.delete('', async (req, res) => {
    res.send("suppression d'un bdc")
})

module.exports = router