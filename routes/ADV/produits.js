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
    if(isSet(produit.id) && isNaN(Number(produit.id))) throw `${produit.isGroupe ? "L'identifiant du groupe de produits est incorrect."  : "L'identifiant du produit est incorrect."}`
    if(isSet(produit.ref)) validations.validationString(produit.ref, `${produit.isGroupe ? "La référence du groupe de produits" : "La référence produit"}`, "e")
    if(isSet(produit.ref) && produit.ref.length > 20) throw `La référence du ${produit.isGroupe ? "groupe de produits" : "produit"} est limitée à 20 caractères.`
    validations.validationString(produit.nom, `${produit.isGroupe ? "Le nom du groupe de produits" : "Le nom du produit"}`)
    if(isSet(produit.designation)) validations.validationString(produit.designation, `${produit.isGroupe ? "La désignation du groupe de produits" : "La désignation du produit"}`, "e")
    if(isSet(produit.description)) validations.validationString(produit.description, `${produit.isGroupe ? "La description du groupe de produits" : "La description du produit"}`, "e")
    if(isSet(produit.caracteristique)) validations.validationNumbers(produit.caracteristique, "La caractéristique technique du produit", "e")
    if(isSet(produit.caracteristique) && !isSet(produit.uniteCaracteristique)) throw "L'unité de mesure de la caractéristique technique du produit doit être transmise."
    validations.validationNumbers(produit.prixUnitaireHT, `${produit.isGroupe ? "Le prix HT du groupe de produits" : "Le prix unitaire HT du produit"}`)
    validations.validationNumbers(produit.prixUnitaireTTC, `${produit.isGroupe ? "Le prix TTC du groupe de produits" : "Le prix unitaire TTC du produit"}`)
    if(isSet(produit.tauxTVA)) validations.validationNumbers(produit.tauxTVA, "Le taux de TVA applicable au produit")
    validations.validationNumbers(produit.montantTVA, `${produit.isGroupe ? "Le montant de la TVA appliquée au groupe de produits" : "Le montant de la TVA appliquée au produit"}`)
    if(!isSet(produit.idStructure)) throw `${produit.isGroupe ? "Le groupe de produits doit être lié à une structure." : "Le produit doit être lié à une structure."}`

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
    if(isSet(produit.isGroupe) && !!produit.isGroupe && isSet(produit.listeProduits)) {
        // if(typeof produit.listeProduits !== "string" || !/^(\d+,)+(\d+){1}$/g.test(produit.listeProduits) || produit.listeProduits.length < 1) throw "Le format de la liste de produits est incorrect."

        // vérifie le format de la liste de produits
        for(const sousProduit of produit.listeProduits) {
            if(!isSet(sousProduit.id) || !isSet(sousProduit.quantite)) throw "L'identifiant du produit ainsi que sa quantité doivent être transmis."
            validations.validationNumbers(sousProduit.quantite, "La quantité de produit(s)", 'e')
        }

        const tabPromiseProduits = []
        // const ids = produit.listeProduits.split(',')
        const ids = produit.listeProduits.map(produit => produit.id)

        if(ids.length < 2) throw "Le groupe doit contenir au moins 2 produits."

        for(const id of ids) {
            // on vérifie que le groupe ne se contient pas lui même
            if(Number(id) === Number(produit.id)) throw "Une groupe de produits ne peut faire partie de sa propre liste de produits."

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

    // vérification de la liste des catégories
    if(isSet(produit.listeIdsCategories)) {
        if(typeof produit.listeIdsCategories !== "string" || !/^((\d+,)+)?(\d+){1}$/g.test(produit.listeIdsCategories)) throw "Le format de la liste des catégories est incorrect."
    
        const tabPromiseCategories = []
        const ids = produit.listeIdsCategories.split(',')

        if(ids.length === 1 && ids[0] === "") throw "Le format de la liste des catégories est incorrect."

        for(const id of ids) {
            tabPromiseCategories.push(
                ADV_categorie.findOne({
                    where : {
                        id,
                        idStructure : produit.idStructure
                    }
                })
            )
        }

        const listeCategories = await Promise.all(tabPromiseCategories)

        for(const categorie of listeCategories) {
            if(categorie === null) throw "Une catégorie présente dans la liste ne correspondant à aucune catégorie existante."
        }
    }

    // vérification des prix
    const prixUnitaireHT = Number(produit.prixUnitaireHT)
    const prixUnitaireTTC = Number(produit.prixUnitaireTTC)
    const montantTVA = Number(produit.montantTVA)

    const diffTTCHT = Number(Math.round(((prixUnitaireTTC - prixUnitaireHT) + Number.EPSILON) * 100) / 100)

    // si c'est un regroupement de produits, il n'y a pas de taux de TVA car plusieurs peuvent être appliqués; seul les totaux sont utilisés
    // if(produit.isGroupe && (montantTVA !== diffTTCHT)) throw "Le montant de la TVA est incorrect."
    // if(!produit.isGroupe) {
    //     const tauxTVA = Number(produit.tauxTVA / 100)

    //     const calculMontantTVA = Number(Math.round(((prixUnitaireHT * tauxTVA) + Number.EPSILON) * 100) / 100)

    //     if(prixUnitaireTTC !== Number(Math.round(((prixUnitaireHT * Number(1 + tauxTVA)) + Number.EPSILON) * 100) / 100)) throw "Le prix unitaire TTC est incorrect."
    //     if(montantTVA !== diffTTCHT || montantTVA !== calculMontantTVA || diffTTCHT !== calculMontantTVA) throw "Le montant de la TVA est incorrect."
    // }    
}

// récupère tous les produits du groupement de produits, et ce de manière récursive si le groupement est composé d'autres groupements
async function getProduitWithListeProduits(produit) {
    if(!isSet(produit)) throw "Un produit doit être transmis."

    if(produit.isGroupe) {
        const listeProduits = await produit.getProduits({ joinTableAttributes : ['quantite'] })

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
                    as : 'categories',
                    attributes : ['id', 'nom']
                }
            ],
            where : {
                ...whereIsGroupe,
                idStructure : {
                    [Op.in] : listeIdsStructures
                }
            },
            order : [['nom', 'ASC']]
        })
        if(produits === null) throw "Une erreur est survenue lors de la récupération des produits."

        if(produits.length === 0) {
            produits = undefined
            infos = errorHandler(undefined, "Aucun produit disponible.")
        }
        // dans le cadre de la récupération des groupements on ajoute les produits de la liste
        else if(!!isGroupe) {
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
                    as : 'categories',
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
        let listeIdsStructures = req.session.client.Structures.map(structure => structure.id)
        req.query.idStructure = Number(req.query.idStructure)
        
        // on regarde si un idStructure est envoyé pour récupérer uniquement pour cette structure 
        // ou s'il faut récupérer pour toutes les structures auxquelles l'utilisateur appartient
        if(!isNaN(req.query.idStructure) && req.query.idStructure !== 0) {
            if(!listeIdsStructures.some(idStructure => idStructure === req.query.idStructure)) throw "Vous ne pouvez pas accéder à des produits pour une structure à laquelle vous n'appartenez pas."    
            listeIdsStructures = [req.query.idStructure]
        }
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
        let listeIdsStructures = req.session.client.Structures.map(structure => structure.id)
        req.query.idStructure = Number(req.query.idStructure)
        
        // on regarde si un idStructure est envoyé pour récupérer uniquement pour cette structure 
        // ou s'il faut récupérer pour toutes les structures auxquelles l'utilisateur appartient
        if(!isNaN(req.query.idStructure) && req.query.idStructure !== 0) {
            if(!listeIdsStructures.some(idStructure => idStructure === req.query.idStructure)) throw "Vous ne pouvez pas accéder à des produits pour une structure à laquelle vous n'appartenez pas."    
            listeIdsStructures = [req.query.idStructure]
        }
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
        produitSent.ref = produitSent.ref ? produitSent.ref : null
        produitSent.nom = produitSent.nom
        produitSent.designation = produitSent.designation ? produitSent.designation : ''
        produitSent.description = produitSent.description ? produitSent.description : ''
        produitSent.caracteristique = produitSent.caracteristique ? produitSent.caracteristique : null
        produitSent.uniteCaracteristique = produitSent.uniteCaracteristique ? produitSent.uniteCaracteristique : null
        produitSent.isGroupe = produitSent.isGroupe ? produitSent.isGroupe : false
        produitSent.listeProduits = (produitSent.isGroupe && produitSent.listeProduits) ? produitSent.listeProduits : null
        
        produit = await ADV_produit.create(produitSent)
        if(produit === null) throw "Une erreur est survenue lors de la création du produit."

        if(produit.isGroupe) {
            // const ids = produitSent.listeProduits.split(',')
            // const ids = listeProduits.map(sousProduit => {
            //     return {
            //         // idGroupeProduit : produit.id,
            //         idProduitListe : sousProduit.id,
            //         quantite : sousProduit.quantite
            //     }
            // })
            // await produit.setProduits(ids)
            // await produit.setProduits(1, { through : { quantite : 3 } })

            const tabPromiseListeProduits = []
            for(const sousProduit of produitSent.listeProduits) {
                tabPromiseListeProduits.push(produit.addProduits(sousProduit.id, { through : { quantite : sousProduit.quantite } }))
            }

            await Promise.all(tabPromiseListeProduits)
        }

        if(isSet(produitSent.listeIdsCategories)) {
            const ids = produitSent.listeIdsCategories.split(',')
            await produit.setCategories(ids)
        }

        // récupération du produit complet pour le renvoyer        
        const data = await getOne(produit.id, produit.isGroupe, listeIdsStructures)

        if(data.infos && data.infos.error) throw `Erreur lors de la récupération du produit : ${data.infos.error}`

        produit = data.produit
        infos = errorHandler(undefined, produit.isGroupe ? "Le groupement de produits a bien été créé." : "Le produit a bien été créé.")
    }
    catch(error) {
        // si le produit est créé mais qu'il y a une erreur lors de la création des dépendances du groupe, on le supprime
        if(produit) produit.destroy()
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
        if(isNaN(IdProduit)) throw "L'identifiant du produit est incorrect."
        
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

        const isOldProduitGroupe = produit.isGroupe

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
        produitSent.listeProduits = (produitSent.isGroupe && produitSent.listeProduits) ? produitSent.listeProduits : null
        produit.prixUnitaireHT = produitSent.prixUnitaireHT
        produit.prixUnitaireTTC = produitSent.prixUnitaireTTC
        produit.tauxTVA = produitSent.tauxTVA
        produit.montantTVA = produitSent.montantTVA

        await produit.save()

        // si le produit est un groupe on lui affecte ses produits dépendants
        if(produit.isGroupe) {
            await produit.setProduits([])
            
            const tabPromiseListeProduits = []
            for(const sousProduit of produitSent.listeProduits) {
                tabPromiseListeProduits.push(produit.addProduits(sousProduit.id, { through : { quantite : sousProduit.quantite } }))
            }

            await Promise.all(tabPromiseListeProduits)
        }
        // si produit était un groupe on désafecte ses produits dépendants
        else if(isOldProduitGroupe) await produit.setProduits([])

        let ids = []
        // s'il y a des catégories on les ajoute ou met à jour, s'il n'y en a pas on remet à zéro s'il y en avait sinon rien ne se passera
        if(isSet(produitSent.listeIdsCategories)) ids = produitSent.listeIdsCategories.split(',')        
        await produit.setCategories(ids)

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
        if(isNaN(IdProduit)) throw "L'identifiant du produit est incorrect."
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
// vérifie si un produit appartient à un groupe
.get('/inGroup/:IdProduit', async (req, res) => {
    const IdProduit = Number(req.params.IdProduit)

    let infos = undefined
    let inGroup = undefined

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

        const count = await produit.countGroupes()
        console.log(count)

        inGroup = count > 0
    }
    catch(error) {
        infos = errorHandler(error)
    }

    res.send({
        infos,
        inGroup
    })
}) 

module.exports = router