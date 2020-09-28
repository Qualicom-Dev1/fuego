const express = require('express')
const router = express.Router()
const { ProduitBusiness, ProduitBusiness_Prestation } = global.db
const { Op } = require('sequelize')
const errorHandler = require('../utils/errorHandler')
const isSet = require('../utils/isSet')
const validations = require('../utils/validations')

async function checkProduit(produit) {
    if(!isSet(produit)) throw "Un produit doit être transmis."
    validations.validationString(produit.nom, "Le produit")
    if(isSet(produit.designation)) {
        validations.validationString(produit.designation, "La désigantion du produit", 'e')
    }
    validations.validationNumbers(produit.prixUnitaire, "Le prix unitaire du produit")

    // vérification que le nom ne soit pas déjà utilisé
    const checkNom = await ProduitBusiness.findOne({
        where : {
            nom : produit.nom
        }
    })
    if(checkNom !== null && (!produit.id || produit.id !== checkNom.id)) throw "Le nom est déjà utilisé par un autre produit."

    if(produit.id) {
        // vérification de l'existance
        const checkExistance = await ProduitBusiness.findOne({
            where : {
                id : produit.id
            }
        })
        if(checkExistance === null) throw "Aucun produit correspondant."
    }

    // vérification de la liste de produits
    if(isSet(produit.isGroupe) && !!produit.isGroupe && isSet(produit.listeIdsProduits)) {
        if(typeof produit.listeIdsProduits !== "string" || !/^(\d+,)+(\d+){1}$/g.test(produit.listeIdsProduits) || produit.listeIdsProduits.length < 1) throw "Le format de la liste de produits est incorrect."
        
        const tabPromiseProduits = []
        const ids = produit.listeIdsProduits.split(',')

        for(const id of ids) {
            tabPromiseProduits.push(
                ProduitBusiness.findOne({
                    where : {
                        id
                    }
                })
            )
        }

        const listeProduits = await Promise.all(tabPromiseProduits)

        for(const produit of listeProduits) {
            if(produit === null) throw "Un produit présent dans la liste ne correspond à aucun produit existant."
        }
    }
}

router
// page d'accueil
.get('/', async (req, res) => {
    res.send('ok')
})
// récupère tous les produits
.get('/all', async (req, res) => {
    let infos = undefined
    let produits = undefined

    try {
        produits = await ProduitBusiness.findAll({
            order : [['nom', 'ASC']]
        })

        if(produits === null) throw "Une erreur est survenue lors de la récupération des produits."

        if(produits.length === 0) {
            produits = undefined
            infos = errorHandler(undefined, "Aucun produit disponible.")
        }
        else {
            // transformation de la liste pour lui ajouter les produits de la liste
            produits = JSON.parse(JSON.stringify(produits))
            
            // récupération des produits de la liste s'il y en a une
            for(const produit of produits) {
                if(produit.isGroupe) {
                    const tabPromiseProduits = []
                    const ids = produit.listeIdsProduits.split(',')

                    for(const id of ids) {
                        tabPromiseProduits.push(
                            ProduitBusiness.findOne({
                                where : {
                                    id
                                }
                            })
                        )
                    }

                    const listeProduits = await Promise.all(tabPromiseProduits)
                    for(const produit of listeProduits) {
                        if(produit === null) throw "Une erreur est survenue lors de la récupération d'un produit."
                    }

                    produit.listeProduits = listeProduits
                }
            }
        }
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
// récupère un produit par id
.get('/:IdProduit', async (req, res) => {
    const IdProduit = Number(req.params.IdProduit)

    let infos = undefined
    let produit = undefined

    try {
        if(isNaN(IdProduit)) throw "Identifiant incorrect."

        produit = await ProduitBusiness.findOne({
            where : {
                id : IdProduit
            }
        })

        if(produit === null) throw "Aucun produit correspondant."

        if(produit.isGroupe) {
            produit = JSON.parse(JSON.stringify(produit))

            const tabPromiseProduits = []
            const ids = produit.listeIdsProduits.split(',')

            for(const id of ids) {
                tabPromiseProduits.push(
                    ProduitBusiness.findOne({
                        where : {
                            id
                        }
                    })
                )
            }

            const listeProduits = await Promise.all(tabPromiseProduits)

            for(const produit of listeProduits) {
                if(produit === null) throw "Une erreur est survenue lors de la récupération d'un produit du groupe de produits."
            }

            produit.listeProduits = listeProduits
        }
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
// crée un produit
.post('', async (req, res) => {
    const produitSent = req.body

    let infos = undefined
    let produit = undefined

    try {
        produitSent.designation = produitSent.designation ? produitSent.designation : null
        produitSent.isGroupe = produitSent.isGroupe ? produitSent.isGroupe : false

        await checkProduit(produitSent)

        produit = await ProduitBusiness.create(produitSent)

        if(produit === null) throw "Une erreur est survenue lors de la création du produit."

        if(produit.isGroupe) {
            produit = JSON.parse(JSON.stringify(produit))

            const tabPromiseProduits = []
            const ids = produit.listeIdsProduits.split(',')

            for(const id of ids) {
                tabPromiseProduits.push(
                    ProduitBusiness.findOne({
                        where : {
                            id
                        }
                    })
                )
            }

            const listeProduits = await Promise.all(tabPromiseProduits)

            for(const produit of listeProduits) {
                if(produit === null) throw "Une erreur est survenue lors de la récuération de la liste de produits."
            }

            produit.listeProduits = listeProduits
        }

        infos = errorHandler(undefined, "Le produit a bien été créé.")
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
        if(isNaN(IdProduit)) throw "Identifiant incorrect."
        if(!isSet(produitSent)) throw "Un produit doit être transmis."

        produitSent.id = IdProduit
        await checkProduit(produitSent)

        produit = await ProduitBusiness.findOne({
            where : {
                id : IdProduit
            }
        })

        if(produit === null) throw "Aucun produit correspondant."

        produit.nom = produitSent.nom
        produit.designation = produitSent.designation ? produitSent.designation : null
        produit.isGroupe = produitSent.isGroupe ? produitSent.isGroupe : false
        produit.listeIdsProduits = produit.isGroupe ? produitSent.listeIdsProduits : null
        produit.prixUnitaire = produitSent.prixUnitaire

        await produit.save()

        if(produit.isGroupe) {
            produit = JSON.parse(JSON.stringify(produit))

            const tabPromiseProduits = []
            const ids = produit.listeIdsProduits.split(',')

            for(const id of ids) {
                tabPromiseProduits.push(
                    ProduitBusiness.findOne({
                        where : {
                            id
                        }
                    })
                )
            }

            const listeProduits = await Promise.all(tabPromiseProduits)

            for(const produit of listeProduits) {
                if(produit === null) throw "Une erreur est survenue lors de la récuération de la liste de produits."
            }

            produit.listeProduits = listeProduits
        }

        infos = errorHandler(undefined, "Le produit a bien été modifié.")
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
.delete('/:IdProduit', async (req, res) => {
    const IdProduit = Number(req.params.IdProduit)

    let infos = undefined
    let produit = undefined

    try {
        if(isNaN(IdProduit)) throw "Identifiant incorrect."

        produit = await ProduitBusiness.findOne({
            where : {
                id : IdProduit
            }
        })

        if(produit === null) throw "Aucun produit corespondant."

        const produit_prestation = await ProduitBusiness_Prestation.findOne({
            where : {
                idProduit : produit.id
            }
        })

        if(produit_prestation !== null) throw "Le produit est utilisé, impossible de le supprimer."

        // vérification que la produit ne fasse pas partie d'un groupe
        const groupesProduits = await ProduitBusiness.findAll({
            where : {
                isGroupe : true
            }
        })

        if(groupesProduits !== null) {
            for(const groupe of groupesProduits) {
                const ids = groupe.listeIdsProduits.split(',')
                if(ids.includes(produit.id.toString())) throw "Le produit fait parti d'un groupe de produits, impossible de le supprimer."
            }
        }

        await produit.destroy()

        infos = errorHandler(undefined, "Le produit a bien été supprimé.")
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


module.exports = router