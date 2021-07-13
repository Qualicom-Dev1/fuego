const express = require('express')
const router = express.Router()
const { ProduitBusiness_Prestation, ProduitBusiness, Prestation, ClientBusiness, Pole } = global.db
const { Op } = require('sequelize')
const errorHandler = require('../../utils/errorHandler')
const isSet = require('../../utils/isSet')
const validations = require('../../utils/validations')

async function checkProduit_prestation(produit_prestation) {
    if(!isSet(produit_prestation)) throw "Une association produit-prestation doit être fournie"
    if(!isSet(produit_prestation.idPrestation)) throw "L'identifiant de la prestation associée doit être fourni."
    if(isNaN(Number(produit_prestation.idPrestation))) "L'identifiant de la prestation asociée est incorrect."
    if(!isSet(produit_prestation.idProduit)) throw "L'identifiant du produit associé doit être fourni."
    if(isNaN(Number(produit_prestation.idProduit))) "L'identifiant du produit associé est incorrect."
    if(isSet(produit_prestation.designation)) {
        validations.validationString(produit_prestation.designation, "La désignation", "e")
    }
    if(isSet(produit_prestation.prixUnitaire)) {
        validations.validationNumbers(produit_prestation.prixUnitaire, "Le prix unitaire")
    }
    if(!isSet(produit_prestation.quantite)) throw "La quantité du produit doit être renseignée."
    validations.validationNumbers(produit_prestation.quantite, "La quantité du produit", "e")

    // vérification de l'existance de la prestation
    const prestation = await Prestation.findOne({
        where : {
            id : produit_prestation.idPrestation
        }
    })
    if(prestation === null) throw "L'identifiant de la prestation associée ne correspond à aucune prestation."

    // vérifie que la prestation n'est pas utilisée
    const [devis, facture] = await Promise.all([
        Devis.findOne({
            where : {
                idPrestation : IdPrestation,
                isCanceled : false,
                isValidated : true
            }
        }),
        Facture.findOne({
            where : {
                idPrestation : IdPrestation,
                isCanceled : false
            }
        })
    ])
    if(devis !== null || facture !== null) throw "La prestation est utilisée, elle ne peut être modifiée."

    const produit = await ProduitBusiness.findOne({
        where : {
            id : produit_prestation.idProduit
        }
    })
    if(produit === null) throw "L'identifiant du produit associé ne correspond à aucun produit."

    // vérifie que l'association existe
    if(isSet(produit_prestation.id)) {
        const association = await ProduitBusiness_Prestation.findOne({
            where : {
                id : produit_prestation.id
            }
        })
        if(association === null) throw "L'identifiant ne correspond à aucune association existante."
    }
}

// récupère tous les produits d'une prestation
async function getProduits_prestation(idPrestation) {
    // vérification de l'existance de la prestation
    const prestation = await Prestation.findOne({
        where : {
            id : idPrestation
        }
    })

    if(prestation === null) throw "Aucune prestation correspondante."

    // récupération des produits
    const produits = await prestation.getProduits()

    if(produits === null) throw "Une erreur est survenue lors de la récupération des produits associés à la prestation."

    return produits
}

// crée les associations de produits pour une prestation
// chaque produit de la liste doit avoir un id, une quantité et potentiellement une désignation
async function createProduits_prestationFromList(idPrestation, listeProduits, transaction = undefined) {
    if(!isSet(idPrestation)) throw "L'identifiant de la prestation doit être fourni."
    if(!isSet(listeProduits)) throw "La liste de produits doit être fournie."
    if(listeProduits.length === 0) throw "La liste de produits ne peut pas être vide."

    // vérification de l'existance de la prestation
    const prestation = await Prestation.findOne({
        where : {
            id : idPrestation
        }
    })

    if(prestation === null) throw "Aucune prestation correspondante."

    // vérification de l'existance des produits
    const tabPromiseProduits = []
    const ids = listeProduits.map(produit => produit.id)

    for(const id of ids) {
        tabPromiseProduits.push(
            ProduitBusiness.findOne({
                where : {
                    id
                }
            })
        )
    }

    const produits = await Promise.all(tabPromiseProduits)

    if(produits.length !== listeProduits.length) throw "Une erreur est survenue lors de la récupération de la liste de produits."
    for(const produit of produits) {
        if(produit === null) throw "Aucun produit correspondant à l'un des produits de la liste."
    }

    // supprime les éléments existants pour cette prestation
    if(transaction) {
        await ProduitBusiness_Prestation.destroy({
            where : {
                idPrestation : prestation.id
            },
            transaction
        })
    }
    else {
        await ProduitBusiness_Prestation.destroy({
            where : {
                idPrestation : prestation.id
            }
        })
    }

    // crée une nouvelle liste
    const tabPromiseCreationAssociations = []
    for(let i = 0; i < produits.length; i++) {
        if(transaction) {
            tabPromiseCreationAssociations.push(
                ProduitBusiness_Prestation.create({
                    idPrestation : prestation.id,
                    idProduit : produits[i].id,
                    designation : isSet(listeProduits[i].designation) ? listeProduits[i].designation : (produits[i].designation ? produits[i].designation : produits[i].nom),
                    prixUnitaire :  isSet(listeProduits[i].prixUnitaire) ? listeProduits[i].prixUnitaire : produits[i].prixUnitaire,
                    quantite : listeProduits[i].quantite
                }, { transaction })
            )
        }
        else {
            tabPromiseCreationAssociations.push(
                ProduitBusiness_Prestation.create({
                    idPrestation : prestation.id,
                    idProduit : produits[i].id,
                    designation : isSet(listeProduits[i].designation) ? listeProduits[i].designation : (produits[i].designation ? produits[i].designation : produits[i].nom),
                    prixUnitaire :  isSet(listeProduits[i].prixUnitaire) ? listeProduits[i].prixUnitaire : produits[i].prixUnitaire,
                    quantite : listeProduits[i].quantite
                })
            )
        }
    }

    const listeAssociations = await Promise.all(tabPromiseCreationAssociations)
    for(const association of listeAssociations) {
        if(association === null) throw "Une erreur s'est produite lors de l'association entre un produit et la prestation."
    }

    return listeAssociations
}

router
// récupère tous les produits d'une prestation
.get('/:IdPrestation/all', async (req, res) => {
    const IdPrestation = Number(req.params.IdPrestation)

    let infos = undefined
    let produits = undefined

    try {
        if(isNaN(IdPrestation)) throw "Identifiant prestation incorrect."

        const prestation = await Prestation.findOne({
            where : {
                id : IdPrestation
            }
        })

        if(prestation === null) throw "Aucune prestation correspondante."

        produits = await prestation.getProduitsBusiness()

        if(produits.length === 0) {
            produits = undefined
            infos = errorHandler(undefined, "Aucun produit pour cette prestation.")
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
// récupère un élément produit_prestation
.get('/:IdProduit_Prestation', async (req, res) => {
    const IdProduit_Prestation = Number(req.params.IdProduit_Prestation)

    let infos = undefined
    let association = undefined

    try {
        if(isNaN(IdProduit_Prestation)) throw "Identifiant incorrect."

        association = await ProduitBusiness_Prestation.findOne({
            attributes : ['id', 'designation', 'prixUnitaire', 'quantite'],
            include : [
                { 
                    model : Prestation,
                    attributes : ['id', 'createdAt'],
                    include : [
                        {
                            model : ClientBusiness
                        },
                        {
                            model : Pole,
                            attributes : ['id', 'nom']
                        }
                    ]
                },
                { model : ProduitBusiness }
            ],
            where : {
                id : IdProduit_Prestation
            }
        })

        if(association === null) throw "Aucune association produit-prestation correspondante."
    }
    catch(error) {
        association = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        association
    })
})
// crée un élément produit_prestation
.post('', async (req, res) => {
    const associationSent = req.body

    let infos = undefined
    let association = undefined

    try {
        await checkProduit_prestation(associationSent)

        association = await ProduitBusiness_Prestation.create(associationSent)

        if(association === null) throw "Une erreur s'est produite lors de la création de l'association entre la prestation et le produit."

        association = await ProduitBusiness_Prestation.findOne({
            attributes : ['id', 'designation', 'prixUnitaire', 'quantite'],
            include : [
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
                { model : ProduitBusiness }
            ],
            where : {
                id : association.id
            }
        })

        if(association === null) throw "Une erreur est survenue lors de la récupération de l'association nouvellement créée."

        infos = errorHandler(undefined, "L'association a bien été créée.")
    }
    catch(error) {
        association = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        association
    })
})
// modifie un élément produit_prestation
.patch('/:IdProduit_Prestation', async (req, res) => {
    const IdProduit_Prestation = Number(req.params.IdProduit_Prestation)
    const associationSent = req.body

    let infos = undefined
    let association = undefined

    try {
        if(isNaN(IdProduit_Prestation)) throw "Identifiant incorrect."

        association = await ProduitBusiness_Prestation.findOne({
            where : {
                id : associationSent.id
            }
        })

        if(association === null) throw "L'identifiant ne correspond à aucune association produit-prestation existante."

        associationSent.id = IdProduit_Prestation
        await checkProduit_prestation(associationSent)

        const produit = await ProduitBusiness.findOne({
            where : {
                id : associationSent.idProduit
            }
        })
        if(produit === null) throw "Une erreur est survenue lors de la récupération du produit."

        association.idPrestation = associationSent.idPrestation
        association.idProduit = associationSent.idProduit
        association.designation = isSet(associationSent.designation) ? associationSent.designation : (produit.designation ? produit.designation : produit.nom)
        association.prixUnitaire = isSet(associationSent.prixUnitaire) ? associationSent.prixUnitaire : produit.prixUnitaire
        association.quantite = associationSent.quantite

        await association.save()

        association = await ProduitBusiness_Prestation.findOne({
            attributes : ['id', 'designation', 'prixUnitaire', 'quantite'],
            include : [
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
                { model : ProduitBusiness }
            ],
            where : {
                id : association.id
            }
        })

        if(association === null) throw "Une erreur est survenue en récupérant l'association modifiée."

        infos = errorHandler(undefined, "L'association a bien été modifiée.")
    }
    catch(error) {
        association = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        association
    })
})
// supprime un élément produit_prestation
.delete('/:IdProduit_Prestation', async (req, res) => {
    const IdProduit_Prestation = Number(req.params.IdProduit_Prestation)

    let infos = undefined
    let association = undefined

    try {
        if(isNaN(IdProduit_Prestation)) throw "Identifiant incorrect."

        association = await ProduitBusiness_Prestation.findOne({
            attributes : ['id', 'designation', 'prixUnitaire', 'quantite'],
            include : [
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
                { model : ProduitBusiness }
            ],
            where : {
                id : IdProduit_Prestation
            }
        })

        if(association === null) throw "Aucune association produit-prestattion correspondante."

        await association.destroy()

        infos = errorHandler(undefined, "L'association produit-prestation a bien été supprimée.")
    }
    catch(error) {
        association = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        association
    })
})

module.exports = {
    router,
    getProduits_prestation,
    createProduits_prestationFromList
}