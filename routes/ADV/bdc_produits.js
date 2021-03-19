const express = require('express')
const router = express.Router()
const models = global.db
const { ADV_BDC_produit, ADV_produit, ADV_categorie } = models
const { calculePrixGroupeProduits } = require('./produits')
const { Op } = require('sequelize')
const errorHandler = require('../utils/errorHandler')
const isSet = require('../utils/isSet')
const validations = require('../utils/validations')

// vérifie un produit tel que saisi sur le BDC
async function checkProduit(produit) {
    if(!isSet(produit)) throw "Un produit doit être transmis."

    // vérification des infos envoyées car elles ont pu être modifiées
    produit.idADV_produit = validations.validationInteger(produit.idADV_produit, "L'identifiant du produit de référence")
    produit.quantite = validations.validationInteger(produit.quantite, "La quantité par produit", 'e')
    produit.designation = validations.validationString(produit.designation, "La désignation du produit", 'e')    
    produit.prixUnitaireHT = validations.validationNumbers(produit.prixUnitaireHT, "Le prix unitaire HT du produit")

    // vérification de l'existence du produit de référence
    const produitRef = await ADV_produit.findOne({
        include : [{
            model : ADV_categorie,
            as : 'categories',
            through : {
                attributes : []
            },
            attributes : ['id', 'nom']
        }],
        where : {
            id : produit.idADV_produit
        }
    })
    if(produitRef === null) throw `Le produit de référence pour "${produit.designation}" est introuvable.`
    produit.produitRef = produitRef

    // vérification de la correspondance avec le produit référent
    if(isSet(produit.isGroupe)) {
        if(!!produit.isGroupe) throw `Le produit "${produit.designation}" a été transmis comme un groupement de produits.`
        if(produitRef.isGroupe) throw `Le produit "${produit.designation}" a été transmis comme produit alors qu'il fait référence à un groupement de produits.`
    }

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

// vérifie le groupement de produit et les produits qu'il contient
async function checkGroupeProduits(groupeProduits)  {
    if(!isSet(groupeProduits)) throw "Un groupement de produits doit être transmis."

    // vérification des infos envoyées    
    groupeProduits.idADV_produit = validations.validationInteger(groupeProduits.idADV_produit, "L'identifiant du groupement de produits de référence")
    groupeProduits.quantite = validations.validationInteger(groupeProduits.quantite, "La quantité du groupement de produits", 'e')
    groupeProduits.designation = validations.validationString(groupeProduits.designation, "La désignation du groupement de produits", 'e') 
    if(!isSet(groupeProduits.listeProduits)) throw "Le groupement de produits doit contenir une liste de produits."

    // vérification de l'existence du produit de référence
    const produitRef = await ADV_produit.findOne({
        include : [{
            model : ADV_categorie,
            as : 'categories',
            through : {
                attributes : []
            },
            attributes : ['id', 'nom']
        }],
        where : {
            id : groupeProduits.idADV_produit
        }
    })
    if(produitRef === null) throw `Le groupement de produits de référence pour "${groupeProduits.designation}" est introuvable.`

    // vérification de la correspondance avec le groupe produits référent
    if(isSet(groupeProduits.isGroupe)) {
        if(!!!groupeProduits.isGroupe) throw `Le groupement de produits "${groupeProduits.designation}" a été transmis comme un produit.`
        if(!produitRef.isGroupe) throw `Le groupement de produits "${groupeProduits.designation}" a été transmis comme groupement de produits alors qu'il fait référence à un produit.`
    }

    // vérification des sous produits
    // parcours la liste de sous produits et les vérifient simultanément, si un produit est incorrect l'erreur sera renvoyée
    const listeSousProduits = await Promise.all(groupeProduits.listeProduits.map(produit => checkProduitSent(produit)))
    groupeProduits.listeProduits = listeSousProduits

    // affectation des informations transmises par le groupe produits de référence
    groupeProduits.produitRef = produitRef
    groupeProduits.ref = produitRef.ref
    groupeProduits.description = produitRef.description
    groupeProduits.caracteristique = produitRef.caracteristique
    groupeProduits.uniteCaracteristique = produitRef.uniteCaracteristique
    groupeProduits.isGroupe = produitRef.isGroupe
    groupeProduits.tauxTVA = produitRef.tauxTVA

    const prixGroupement = calculePrixGroupeProduits(groupeProduits.listeProduits)
    groupeProduits.prixUnitaireHT = prixGroupement.totalHT
    groupeProduits.prixUnitaireTTC = prixGroupement.totalTTC
    groupeProduits.montantTVA = Number(Number(Math.round(((groupeProduits.prixUnitaireTTC - groupeProduits.prixUnitaireHT) + Number.EPSILON) * 100) / 100).toFixed(2))

    return groupeProduits
}

// répartisseur de la vérification des produits et groupes de produits
function checkProduitSent(produitSent) {
    if(!isSet(produitSent)) throw "Un produit doit être transmis."

    if(isSet(produitSent.isGroupe) && !!produitSent.isGroupe) {
        return checkGroupeProduits(produitSent)
    }
    else {
        return checkProduit(produitSent)
    }
}

async function checkListeProduits(listeProduitsSent) {
    if(!isSet(listeProduitsSent)) throw "Une liste de produits doit être transmise."
    if(listeProduitsSent.length === 0) throw "La liste de produits est vide."

    const listeProduits = await Promise.all(listeProduitsSent.map(produit => checkProduitSent(produit)))

    return listeProduits
}

async function create_BDC_produit(produitSent) {
    let produit = await ADV_BDC_produit.create({
        idADV_produit : produitSent.idADV_produit,
        ref : produitSent.ref,
        designation : produitSent.designation,
        description : produitSent.description,
        caracteristique : produitSent.caracteristique,
        uniteCaracteristique : produitSent.uniteCaracteristique,
        isGroupe : produitSent.isGroupe,
        prixUnitaireHT : produitSent.prixUnitaireHT,
        prixUnitaireTTC : produitSent.prixUnitaireTTC,
        tauxTVA : produitSent.tauxTVA,
        montantTVA : produitSent.montantTVA
    })
    if(produit === null) throw `Une erreur est survenue lors de la création de "${produitSent.designation}".`
    
    // si c'est un groupement de produits, on lui ajoute ses produits qui devront avoir été créés en amont
    if(produit.isGroupe && produitSent.listeProduits && produitSent.listeProduits.length) {
        const tabPromiseSousProduits = [] 
        for(const sousProduit of produitSent.listeProduits) {
            tabPromiseSousProduits.push(produit.addProduits(sousProduit.id, { through : { 
                isGroupe : sousProduit.isGroupe,
                quantite : sousProduit.quantite,
                prixHT : sousProduit.prixHT,
                prixTTC : sousProduit.prixTTC,
                tauxTVA : sousProduit.tauxTVA,
                montantTVA : sousProduit.montantTVA
            } }))
        }

        await Promise.all(tabPromiseSousProduits)
    }

    // s'il a des catégories, on lui crée sa liste de catégories
    if(produitSent.listeIdsADV_BDC_categorie && produitSent.listeIdsADV_BDC_categorie.length) await produit.setCategories(produitSent.listeIdsADV_BDC_categorie)

    const data = await getOne(produit.id)

    if(data.infos && data.infos.error) throw `Erreur lors de la récupération du produit : ${data.infos.error}`

    produit = data.produit

    return produit
}

// créé la liste de produits du BDC
// doit créer les produits et les sous produits
async function create_BDC_listeProduits(listeProduitSent) {
    if(!isSet(listeProduitSent)) throw "La liste des produits doit être transmise."

    const listeProduits = []

    // parcours la liste de produits
    for(let i = 0; i < listeProduitSent.length; i++) {
        // si groupe produits, d'abord créer les sous produits, 
        // puis créer le groupement de produit avec sa liste de produits ayant déjà été créée pour lui ajouter
        if(listeProduitSent[i].isGroupe) {
            const listeSousProduits = await create_BDC_listeProduits(listeProduitSent[i].listeProduits)
            listeProduitSent[i].listeProduits = listeSousProduits
        }

        listeProduitSent[i] = await create_BDC_produit(listeProduitSent[i])
    }

    // la liste renvoyée est la liste d'ids des nouveaux produits tels que créé dans le BDC
    return listeProduits
}

// récupère tous les produits du groupement de produits, et ce de manière récursive si le groupement est composé d'autres groupements
async function getProduitWithListeProduits(produit) {
    if(!isSet(produit)) throw "Un produit doit être transmis."

    if(produit.isGroupe) {
        const listeProduits = await produit.getProduits({ joinTableAttributes : ['isGroupe', 'quantite', 'prixHT', 'prixTTC', 'tauxTVA', 'montantTVA'] })

        produit = JSON.parse(JSON.stringify(produit))

        for(let i = 0; i < listeProduits.length; i++) {
            if(listeProduits[i] === null) throw "Une erreur est survenue lors de la récupération d'un produit du groupe de produits."            

            // si le produit est un groupe, on récupère de manière récusrive les produits qui en dépendent
            listeProduits[i] = await getProduitWithListeProduits(listeProduits[i])

            // on mets la quantité comme si c'était un attribut du produit plutôt que de ADV_produitListeProduits
            listeProduits[i] = JSON.parse(JSON.stringify(listeProduits[i]))
            listeProduits[i].quantite = listeProduits[i].ADV_produitListeProduits.quantite
            listeProduits[i].ADV_produitListeProduits = undefined
        }

        produit.listeProduits = listeProduits
    }

    return produit
}

// récupère un produit ou groupements de produits à partir de son ID
async function getOne(IdProduit) {
    let infos = undefined
    let produit = undefined

    try {
        produit = await ADV_BDC_produit.findOne({
            include : [{
                model : ADV_BDC_categorie,
                as : 'categories',
                through : {
                    attributes : []
                },
                attributes : ['id', 'nom']
            }],
            where : {
                id : IdProduit
            }
        })
        if(produit === null) throw "Aucun produit correspondant."

        if(produit.isGroupe) {
            produit = await getProduitWithListeProduits(produit)
        }
    }
    catch(error) {
        produit = undefined
        infos = errorHandler(error)
    }

    return {
        infos,
        produit
    }
}

// récupère les produits d'une liste d'IDs pour le BDC
async function getAllFromList(listeIdsProduits) {
    if(!isSet(listeIdsProduits)) throw "Une liste d'identifiants de produits doit être transmise."

    const ids = listeIdsProduits.split(',')

    const tabGetProduits = await Promise.all(ids.map(id => getOne(id)))

    const listeProduits = []
    for(const data of tabGetProduits) {
        if(data.infos && data.infos.error) throw `Une erreur est survenue en récupérant la liste des produits : ${data.infos.error}`
        listeProduits.push(data.produit)
    }

    return listeProduits
}

function checkObservations(observations) {
    if(isSet(observations)) {
        observations = validations.validationString(observations, "Les observations", 'e')
        return observations
    }
    else return ''
}

router 
.get('/:Id_BDC_Produit', async (req, res) => {
    const Id_BDC_Produit = Number(req.params.Id_BDC_Produit)

    let infos = undefined
    let produit = undefined

    try {
        if(isNaN(Id_BDC_Produit)) throw "L'identifiant du produit est incorrect."

        const data = await getOne(Id_BDC_Produit)

        if(data.infos && data.infos.error) throw `Une erreur est survenue lors de la récupération du produit : ${data.infos.error}`
    }
    catch(error) {
        infos = errorHandler(error)
    }

    res.send({
        infos,
        produit
    })
})
.post('/checkListeProduits', async (req, res) => {
    let infos = undefined

    try {
        await checkListeProduits(req.body)
        infos = errorHandler(undefined, 'ok')
    }
    catch(error) {
        infos = errorHandler(error)
    }

    res.send({
        infos
    })
})
.post('/checkObservations', (req, res) => {
    let infos = undefined

    try {
        checkObservations(req.body.observations) 
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
    checkListeProduits,
    create_BDC_listeProduits,
    getAllFromList
}