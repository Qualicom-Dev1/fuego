const express = require('express')
const router = express.Router()
const models = global.db
const { ADV_produit, Structure, ADV_categorie } = models
const moment = require('moment')
const { Op } = require('sequelize')
const errorHandler = require('../utils/errorHandler')
const isSet = require('../utils/isSet')
const validations = require('../utils/validations')

async function checkProduit(produit, listeIdsStructures) {
    if(!isSet(produit)) throw "Un produit doit être transmis."
    if(isSet(produit.id) && isNaN(Number(produit.id))) throw "l'identifiant du produit est incorrect."
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
    if(!listeIdsStructures.some(idStructure => idStructure === structure.id)) throw "Vous ne pouvez pas créer de produit pour une structure à laquelle vous n'appartenez pas."    
    
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

// récupère tous les produits du groupement de produits, et ce de manière récursive si le groupement est composé d'autres groupements
async function getProduitWithListeProduits(produit) {
    if(!isSet(produit)) throw "Un produit doit être transmis."

    if(produit.isGroupe) {
        produit = JSON.parse(JSON.stringify(produit))

        const tabPromiseProduits = []
        const ids = produit.listeIdsProduits.split(',')

        for(const id of ids) {
            tabPromiseProduits.push(
                ADV_produit.findOne({
                    include : [
                        {
                            model : Structure,
                            attributes : ['id', 'nom']
                        },
                        {
                            model : ADV_categorie,
                            attributes : ['id', 'nom']
                        }
                    ],
                    where : {
                        id
                    }
                })
            )
        }

        const listeProduits = await Promise.all(tabPromiseProduits)

        for(let i = 0; i < listeProduits.length; i++) {
            if(listeProduits[i] === null) throw "Une erreur est survenue lors de la récupération d'un produit du groupe de produits."
            // si le produit est un groupe, on récupère de manière récusrive les produits qui en dépendent
            listeProduits[i] = await getProduitWithListeProduits(listeProduits[i])
        }

        produit.listeProduits = listeProduits
    }

    return produit
}

// récupère tous les produits ou groupement de produits en fonction de isGroupe
async function getAll(isGroupe, listeIdsStructures) {
    let infos = undefined
    let produits = undefined

    try {
        if(!isSet(listeIdsStructures) || listeIdsStructures.length === 0) throw "Aucun produit disponible."

        const whereIsGroupe = { isGroupe : false }
        if(!!isGroupe) whereIsGroupe.isGroupe = true

        // récupération des produits ou groupements de produits
        produits = await ADV_produit.findAll({
            include : [
                {
                    model : Structure,
                    attributes : ['id', 'nom']
                },
                {
                    model : ADV_categorie,
                    attributes : ['id', 'nom']
                }
            ],
            where : {
                ...whereIsGroupe,
                idStructure : {
                    [Op.in] : listeIdsStructures
                }
            }
        })
        if(produits === null) throw "Une erreur est survenue lors de la récupération des produits."

        if(produits.length === 0) {
            produits = undefined
            infos = errorHandler(undefined, "Aucun produit disponible.")
        }
        // dans le cadre de la récupération des groupements on ajoute les produits de la liste
        else if(!!isGroupe) {
            // transformation de la liste pour lui ajouter les produits de la liste
            produits = JSON.parse(JSON.stringify(produits))

            // récupération des produits de la liste
            for(let i = 0; i < produits.length; i++) {
                produits[i] = await getProduitWithListeProduits(produits[i])
            }
        }
    }
    catch(error) {
        produits = undefined
        infos = errorHandler(error)
    }

    return {
        infos,
        produits
    }
}

// récupère un produit ou groupement de produit en fonction de isGroupe
async function getOne(IdProduit, isGroupe, listeIdsStructures) {
    let infos = undefined
    let produit = undefined

    try {
        if(!isSet(listeIdsStructures) || listeIdsStructures.length === 0) throw "Aucun produit disponible."
        if(!isSet(IdProduit) || isNaN(IdProduit)) throw "L'identifiant du produit doit être transmis."

        const whereIsGroupe = { isGroupe : false }
        if(!!isGroupe) whereIsGroupe.isGroupe = true

        // récupération des produits ou groupements de produits
        produit = await ADV_produit.findOne({
            include : [
                {
                    model : Structure,
                    attributes : ['id', 'nom']
                },
                {
                    model : ADV_categorie,
                    attributes : ['id', 'nom']
                }
            ],
            where : {
                id : IdProduit,
                ...whereIsGroupe,
                idStructure : {
                    [Op.in] : listeIdsStructures
                }
            }
        })
        if(produit === null) throw "Aucun produit correspondant."

        if(!!isGroupe) {
            // transformation pour lui ajouter la liste de produits
            produit = JSON.parse(JSON.stringify(produit))
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

    res.render('ADV/produits', { 
        extractStyles: true, 
        title: 'ADV Produits | FUEGO', 
        session: req.session.client, 
        options_top_bar: 'adv', 
        infos, 
        agences 
    });
})
// renvoie tous les produits
.get('/produits', async (req, res) => {
    let infos = undefined
    let produits = undefined

    try {
        const listeIdsStructures = req.session.client.Structures.map(structure => structure.id)
        const data = await getAll(false, listeIdsStructures)

        infos = data.infos
        produits = data.produits
    }
    catch(error) {
        produits = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        produits
    })
})
// renvoie tous groupements de produits
.get('/groupesProduits', async (req, res) => {
    let infos = undefined
    let produits = undefined

    try {
        const listeIdsStructures = req.session.client.Structures.map(structure => structure.id)
        const data = await getAll(true, listeIdsStructures)

        infos = data.infos
        produits = data.produits
    }
    catch(error) {
        produits = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        produits
    })
})
// renvoie un produit
.get('/produits/:IdProduit', async (req, res) => {
    let infos = undefined
    let produit = undefined

    const IdProduit = Number(req.params.IdProduit)

    try {
        const listeIdsStructures = req.session.client.Structures.map(structure => structure.id)
        const data = await getOne(IdProduit, false, listeIdsStructures)

        infos = data.infos
        produit = data.produit
    }
    catch(error) {
        produit = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        produit
    })
})
// renvoie un groupement de produits
.get('/groupesProduits/:IdProduit', async (req, res) => {
    let infos = undefined
    let produit = undefined

    const IdProduit = Number(req.params.IdProduit)

    try {
        const listeIdsStructures = req.session.client.Structures.map(structure => structure.id)
        const data = await getOne(IdProduit, true, listeIdsStructures)

        infos = data.infos
        produit = data.produit
    }
    catch(error) {
        produit = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        produit
    })
})
// créé un produit
.post('/', async (req, res) => {
    const produitSent = req.body

    let infos = undefined
    let produit = undefined

    try {
        const listeIdsStructures = req.session.client.Structures.map(structure => structure.id)

        // vérification du produit
        await checkProduit(produitSent, listeIdsStructures)

        // paramétrage des valeurs par défaut        
        produitSent.designation = produitSent.designation ? produitSent.designation : ''
        produitSent.description = produitSent.description ? produitSent.description : ''
        produitSent.isGroupe = produitSent.isGroupe ? produitSent.isGroupe : false
        produitSent.listeIdsProduits = (produitSent.isGroupe && produitSent.listeIdsProduits) ? produitSent.listeIdsProduits : null
        
        produit = await ADV_produit.create(produitSent)
        if(produit === null) throw "Une erreur est survenue lors de la création du produit."

        // récupération du produit complet pour le renvoyer        
        const data = await getOne(produit.id, produit.isGroupe, listeIdsStructures)

        if(data.infos && data.infos.error) throw `Le produit a été créé. Erreur lors de la récupération du produit : ${data.infos.error}`

        produit = data.produit
        infos = errorHandler(undefined, produit.isGroupe ? "Le groupement de produits a bien été créé." : "Le produit a bien été créé.")
    }
    catch(error) {
        produit = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        produit
    })
})
// modifie un produit
.patch('/:IdProduit', async (req, res) => {
    const IdProduit = Number(req.params.IdProduit)
    const produitSent = req.body

    let infos = undefined
    let produit = undefined

    try {
        const listeIdsStructures = req.session.client.Structures.map(structure => structure.id)

        // vérifie l'existence du produit
        produit = await ADV_produit.findOne({
            where : {
                id : IdProduit,
                idStructure : {
                    [Op.in] : listeIdsStructures
                }
            }
        })
        if(produit === null) throw "Aucun produit correspondant."

        // vérification du produit
        produitSent.id = IdProduit
        await checkProduit(produitSent, listeIdsStructures)

        // paramétrage des valeurs par défaut   
        produit.ref = produitSent.ref ? produitSent.ref : null
        produit.nom = produitSent.nom
        produit.designation = produitSent.designation ? produitSent.designation : ''
        produit.description = produitSent.description ? produitSent.description : ''
        produit.caracteristique = produitSent.caracteristique ? produitSent.caracteristique : null
        produit.uniteCaracteristique = produitSent.uniteCaracteristique ? produitSent.uniteCaracteristique : null
        produit.isGroupe = produitSent.isGroupe ? produitSent.isGroupe : false
        produit.listeIdsProduits = (produitSent.isGroupe && produitSent.listeIdsProduits) ? produitSent.listeIdsProduits : null
        produit.prixUnitaireHT = produitSent.prixUnitaireHT
        produit.prixUnitaireTTC = produitSent.prixUnitaireTTC
        produit.tauxTVA = produitSent.tauxTVA
        produit.montantTVA = produitSent.montantTVA

        await produit.save()

        const data = await getOne(produit.id, produit.isGroupe, listeIdsStructures)

        if(data.infos && data.infos.error) throw `${produit.isGroupe ? "Le groupement de produits a bien été modifié. Erreur lors de la récupération du groupement de produits" : "Le produit a bien été modifié. Erreur lors de la récupération du produit"} : ${data.infos.error}`

        produit = data.produit
        infos = errorHandler(undefined, produit.isGroupe ? "Le groupement de produits a bien été modifié." : "Le produit a bien été modifié.")
    }
    catch(error) {
        produit = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        produit
    })
})
// retire un produit
.delete('/:IdProduit', async (req, res) => {
    const IdProduit = Number(req.params.IdProduit)

    let infos = undefined

    try {
        if(isNaN(Number(IdProduit))) throw "L'identifiant du produit est incorrect."
        const listeIdsStructures = req.session.client.Structures.map(structure => structure.id)

        const produit = await ADV_produit.findOne({
            where : {
                id : IdProduit,
                idStructure : {
                    [Op.in] : listeIdsStructures
                }
            }
        })
        if(produit === null) throw "Aucun produit correspondant."

        await produit.destroy()

        infos = errorHandler(undefined, produit.isGroupe ? "Le groupe de produits a bien été retiré." : "Le produit a bien été retiré.")
    }
    catch(error) {
        infos = errorHandler(error)
    }

    res.send({
        infos
    })
})

module.exports = router