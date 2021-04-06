const express = require('express')
const router = express.Router()
const { RDV, Client, User, Etat, ADV_BDC } = global.db
const moment = require('moment')
const { Op } = require('sequelize')
const errorHandler = require('../utils/errorHandler')
const isSet = require('../utils/isSet')

router
// récupère toutes les ventes d'une agence en fonction des dépendances de l'utilisateur
// ex : vendeur -> ses ventes, dirco -> les ventes de tous ses vendeurs
.get('/all' , async (req, res) => {
    let infos = undefined
    let ventes = undefined

    try {
        // récupère les ids des vendeurs dépendants s'il y en a
        const idsDependances = req.session.client.Usersdependences.map(dependance => dependance.idUserInf)
        idsDependances.push(req.session.client.id)

        ventes = await RDV.findAll({
            include : [
                {
                    // VENTE
                    model : Etat,
                    attributes : [],
                    where : {
                        nom : 'VENTE'
                    }
                },
                {
                    model : User,
                    attributes : ['id', 'nom', 'prenom']
                },
                {
                    model : Client,
                    attributes : ['id', 'nom', 'prenom', 'adresse', 'cp', 'ville']
                }
            ],
            attributes : ['id', 'date', 'source', 'montantVente'],
            where : {
                idVendeur : {
                    [Op.in] : idsDependances
                },
                idBDC : {
                    [Op.is] : null
                },
                isAvailable : true,
                // récupération uniquement des ventes de l'année courante, voir si modifier plus tard
                date : {
                    [Op.gte] : moment().format('YYYY-01-01 00:00:00')
                }
            },   
            order : [['date', 'DESC']]         
        })
        if(ventes === null) throw "Une erreur est survenue lors de la récupération de la liste des ventes."
        if(ventes.length === 0) infos = errorHandler(undefined, "Aucune vente disponible.")
    }
    catch(error) {
        infos = errorHandler(error)
    }

    res.send({
        infos,
        ventes
    })
})
// récupère une vente via son ID
.get('/:Id_Vente' , async (req, res) => {
    const Id_Vente = Number(req.params.Id_Vente)

    let infos = undefined
    let vente = undefined

    try {
        if(isNaN(Id_Vente)) throw "L'identifiant de la vente est incorrect."

        // récupère les ids des vendeurs dépendants s'il y en a
        const idsDependances = req.session.client.Usersdependences.map(dependance => dependance.idUserInf)
        idsDependances.push(req.session.client.id)

        vente = await RDV.findOne({
            include : [
                {
                    // VENTE
                    model : Etat,
                    attributes : [],
                    where : {
                        nom : 'VENTE'
                    }
                },
                {
                    model : User,
                    attributes : ['id', 'nom', 'prenom']
                },
                {
                    model : Client,
                    attributes : ['id', 'nom', 'prenom', 'adresse', 'cp', 'ville']
                }
            ],
            attributes : ['id', 'date', 'source', 'montantVente'],
            where : {
                idVendeur : {
                    [Op.in] : idsDependances
                },
                id : Id_Vente
            }    
        })
        if(vente === null) throw "Aucune vente correspondante."
    }
    catch(error) {
        infos = errorHandler(error)
    }

    res.send({
        infos,
        vente
    })
})
.post('/:Id_Vente/retirer', async (req, res) => {
    const Id_Vente = Number(req.params.Id_Vente)

    let infos = undefined

    try {
        if(isNaN(Id_Vente)) throw "L'identifiant de la vente est incorrect."

        // récupère les ids des vendeurs dépendants s'il y en a
        const idsDependances = req.session.client.Usersdependences.map(dependance => dependance.idUserInf)
        idsDependances.push(req.session.client.id)

        const vente = await RDV.findOne({
            include : [
                {
                    // VENTE
                    model : Etat,
                    attributes : [],
                    where : {
                        nom : 'VENTE'
                    }
                },
                {
                    model : ADV_BDC,
                    as : 'bdc',
                    attributes : ['id']
                },
            ],
            attributes : ['id', 'date', 'source', 'montantVente'],
            where : {
                idVendeur : {
                    [Op.in] : idsDependances
                },
                id : Id_Vente
            }    
        })
        if(vente === null) throw "Aucune vente correspondante."
        if(vente.bdc) throw "Un bon de commande existe pour cette vente, elle ne peut pas être retirée."

        vente.isAvailable = false
        await vente.save()

        infos = errorHandler(undefined, "La vente a bien été retirée.")
    }
    catch(error) {
        infos = errorHandler(error)
    }

    res.send({
        infos,
    })
})

module.exports = router;