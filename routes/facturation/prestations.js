const express = require('express')
const router = express.Router()
const { Prestation, ClientBusiness, Pole, ProduitBusiness, Devis, Facture } = global.db
const { createProduits_prestationFromList } = require('./produitsBusiness_prestations')
const { Op } = require('sequelize')
const errorHandler = require('../utils/errorHandler')
const isSet = require('../utils/isSet')

async function checkPrestation(prestation) {
    if(!isSet(prestation)) throw "Une prestation doit être fournie."
    if(!isSet(prestation.idClient)) throw "Un client doit être lié à la prestation."
    if(!isSet(prestation.idPole)) throw "Un pôle doit être lié à la prestation"
    if(!isSet(prestation.listeProduits)) throw "Les produits de la prestation doivent être fournis."

    // vérifie que le client existe
    const client = await ClientBusiness.findOne({
        where : {
            id : prestation.idClient
        }
    })
    if(client === null) throw "Aucun client correspondant."

    // vérifie que le pôle existe
    const pole = await Pole.findOne({
        where : {
            id : prestation.idPole
        }
    })
    if(pole === null) throw "Aucun pôle correspondant."

    // vérification que la liste de produits est correcte
    for(const produit of prestation.listeProduits) {
        if(!isSet(produit.id)) throw "Un produit de la liste a été transmis sans identifiant."
        if(!isSet(produit.quantite)) throw "Un produit de la liste a été transmis sans quantité."
    }

    // vérification de l'existence de la prestation
    if(isSet(prestation.id)) {
        const prestationDB = await Prestation.findOne({
            where : {
                id : prestation.id
            }
        })
        if(prestationDB === null) throw "Aucune prestation correspondante."
    }
}

async function calculPrixPrestation(idPrestation) {
    if(!isSet(idPrestation)) throw "L'identifiant de la prestation doit être fourni."

    const prestation = await Prestation.findOne({
        attributes : [],
        include : ProduitBusiness,
        where : {
            id : idPrestation
        }
    })
    if(prestation === null) throw "Aucune prestation correspondante."

    if(prestation.ProduitsBusiness.length === 0) throw "La prestation ne contient aucun produit."

    let prix = 0

    // on récupère 
    // Number(Math.round((value.CA + Number.EPSILON) * 100) / 100).toFixed(2)
    for(const { ProduitBusiness_Prestation } of prestation.ProduitsBusiness) {
        prix = Number(Math.round((Number(prix) + Number(Math.round(((ProduitBusiness_Prestation.quantite * ProduitBusiness_Prestation.prixUnitaire) + Number.EPSILON) * 100) / 100) + Number.EPSILON) * 100) / 100)
    }

    prix = Number(prix).toFixed(2)

    return prix
}

router
// accueil
.get('/', async (req, res) => {
    res.send('ok')
})
// récupère toutes les prestations
.get('/all', async (req, res) => {
    let infos = undefined
    let prestations = undefined

    try {
        prestations = await Prestation.findAll({
            attributes : ['id', 'createdAt'],
            include : [
                { model : ClientBusiness },
                { 
                    model : Pole,
                    attributes : ['id', 'nom']
                },
                { model : ProduitBusiness }
            ],
            order : [['createdAt', 'DESC']]
        })

        if(prestations === null) throw "Une erreur est survenue lors de la récupération des prestations."

        if(prestations.length === 0) {
            prestations = undefined
            infos = errorHandler(undefined, "Aucune prestation.")
        }
    }
    catch(error) {
        prestations = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        prestations
    })
})
// récupère toutes les prestations d'un client
.get('/all/:IdClient', async (req, res) => {
    const IdClient = Number(req.params.IdClient)

    let infos = undefined
    let prestations = undefined

    try {
        if(isNaN(IdClient)) throw "L'identifiant client est incorrect."

        const client = await ClientBusiness.findOne({            
            where : {
                id : IdClient
            }
        })

        if(client === null) throw "Aucun client correspondant."

        prestations = await Prestation.findAll({
            attributes : ['id', 'createdAt'],
            include : [
                { model : ClientBusiness },
                { 
                    model : Pole,
                    attributes : ['id', 'nom']
                },
                { model : ProduitBusiness }
            ],
            where : {
                idClient : client.id
            },
            order : [['createdAt', 'DESC']]
        })

        if(prestations === null) throw "Une erreur est survenue lors de la récupértion des prestations."
        if(prestations.length === 0) {
            prestations = undefined
            infos = errorHandler(undefined, "Aucune prestation pour ce client.")
        }
    }
    catch(error) {
        prestations = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        prestations
    })
})
// récupère une prestation
.get('/:IdPrestation', async (req, res) => {
    const IdPrestation = Number(req.params.IdPrestation)

    let infos = undefined
    let prestation = undefined

    try {
        if(isNaN(IdPrestation)) throw "Identifiant incorrect."

        prestation = await Prestation.findOne({
            attributes : ['id', 'createdAt'],
            include : [
                { model : ClientBusiness },
                { 
                    model : Pole,
                    attributes : ['id', 'nom']
                },
                { model : ProduitBusiness }
            ],
            where : {
                id : IdPrestation
            }
        })

        if(prestation === null) throw "Aucune prestation correspondante."
    }
    catch(error) {
        prestation = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        prestation
    })
})
// crée une prestation
.post('', async (req, res) => {
    const prestationSent = req.body

    let infos = undefined
    let prestation = undefined

    try {
        await checkPrestation(prestationSent)

        prestation = await Prestation.create(prestationSent)

        if(prestation === null) throw "Une erreur est survenue lors de la création de la prestation."

        await createProduits_prestationFromList(prestation.id, prestationSent.listeProduits)

        prestation = await Prestation.findOne({
            attributes : ['id', 'createdAt'],
            include : [
                { model : ClientBusiness },
                { 
                    model : Pole,
                    attributes : ['id', 'nom']
                },
                { model : ProduitBusiness }
            ],
            where : {
                id : prestation.id
            }
        })

        if(prestation === null) throw "Une erreur est survenue lors de la récupération de la prestation nouvellement créée."

        infos = errorHandler(undefined, "La prestation a bien été créée.")
    }
    catch(error) {
        if(typeof prestation === "object") await prestation.destroy()

        prestation = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        prestation
    })
})
.patch('/:IdPrestation', async (req, res) => {
    const IdPrestation = Number(req.params.IdPrestation)
    const prestationSent = req.body

    let infos = undefined
    let prestation = undefined

    try {
        if(isNaN(IdPrestation)) throw "Identifiant incorrect."

        prestationSent.id = IdPrestation
        await checkPrestation(prestationSent)

        prestation = await Prestation.findOne({
            where : {
                id : IdPrestation
            }
        })

        if(prestation === null) throw "Aucune prestation correspondante."

        await createProduits_prestationFromList(prestation.id, prestationSent.listeProduits)

        prestation.idClient = prestationSent.idClient
        prestation.idPole = prestationSent.idPole

        await prestation.save()

        prestation = await Prestation.findOne({
            attributes : ['id', 'createdAt'],
            include : [
                { model : ClientBusiness },
                { 
                    model : Pole,
                    attributes : ['id', 'nom']
                },
                { model : ProduitBusiness }
            ],
            where : {
                id : prestation.id
            }
        })

        if(prestation === null) throw "Une erreur est survenue lors de la récupéraion de la prestation suite à sa modification."

        infos = errorHandler(undefined, "La prestation a bien été modifiée.")
    }
    catch(error) {
        prestation = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        prestation
    })
})
.delete('/:IdPrestation', async (req, res) => {
    const IdPrestation = Number(req.params.IdPrestation)

    let infos = undefined
    let prestation = undefined

    try {
        if(isNaN(IdPrestation)) throw "Identifiant incorrect."

        prestation = await Prestation.findOne({
            attributes : ['id', 'createdAt'],
            include : [
                { model : ClientBusiness },
                { 
                    model : Pole,
                    attributes : ['id', 'nom']
                },
                { model : ProduitBusiness }
            ],
            where : {
                id : IdPrestation
            }
        })

        if(prestation === null) throw "Aucune prestation correspondante."

        const [devis, facture] = await Promise.all([
            Devis.findOne({
                where : {
                    idPrestation : IdPrestation
                }
            }),
            Facture.findOne({
                where : {
                    idPrestation : IdPrestation
                }
            })
        ])

        if(devis !== null || facture !== null) throw "La prestation est utilisée, impossible de la supprimer."

        await prestation.destroy()

        infos = errorHandler(undefined, "La prestation a bien été supprimée.")
    }
    catch(error) {
        prestation = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        prestation
    })
})

module.exports = router