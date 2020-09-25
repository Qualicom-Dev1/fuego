const express = require('express')
const router = express.Router()
const { TypePaiement } = global.db
const { Op } = require('sequelize')
const errorHandler = require('../utils/errorHandler')
const isSet = require('../utils/isSet')
const validations = require('../utils/validations')

async function checkTypePaiement(typePaiement) {
    if(!isSet(typePaiement)) throw "Un type de paiement doit être transmis."
    if(!isSet(typePaiement.nom)) throw "Le nom du type de paiement doit être renseigné."
    typePaiement.nom = validations.validationString(typePaiement.nom, 'Le nom')

    // vérifie si le nom est déjà utilisé
    const checkNomDB = await TypePaiement.findOne({
        where : {
            nom : typePaiement.nom
        }
    })
    if(checkNomDB !== null && (!typePaiement.id || typePaiement.id !== checkNomDB.id)) throw "Ce nom de pôle est déjà pris."
    
    
    if(typePaiement.id) {
        // vérifie qu'il existe
        const checkExistanceDB= await TypePaiement.findOne({
            where : {
                id : typePaiement.id
            }
        })
        if(checkExistanceDB === null) throw "Aucun type de paiement correspondant."
    }
}

router
// affiche la page des types de paiement
.get('', async (req, res) => {
    res.send('ok')
})
// retourne tous les types de paiement
.get('/all', async (req, res) => {
    let infos = undefined
    let typesPaiement = undefined

    try {
        typesPaiement = await TypePaiement.findAll({
            order : [['nom', 'ASC']]
        })

        if(typesPaiement === null) throw "Une erreur est survenue lors de la récupération des types de paiements."
        if(typesPaiement.length === 0) {
            typesPaiement = undefined
            infos = errorHandler(undefined, "Aucun type de paiement disponible.")
        }
    }
    catch(error) {
        typesPaiement = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        typesPaiement
    })
})
// retourne un type de paiement
.get('/:IdTypePaiement', async (req, res) => {
    const IdTypePaiement = Number(req.params.IdTypePaiement)

    let infos = undefined
    let typePaiement = undefined

    try {
        if(isNaN(IdTypePaiement)) throw "Identifiant incorrect."

        typePaiement = await TypePaiement.findOne({
            where : {
                id : IdTypePaiement
            },
            order : [['nom', 'ASC']]
        })

        if(typePaiement === null) throw "Aucun type de paiement correspondant."
    }
    catch(error) {
        typePaiement = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        typePaiement
    })
})
// ajoute un type de paiement
.post('', async (req, res) => {
    const typePaiementSent = req.body

    let infos = undefined
    let typePaiement = undefined

    try {
        await checkTypePaiement(typePaiementSent)

        typePaiement = await TypePaiement.create(typePaiementSent)

        if(typePaiement === null) throw "Une erreur est survenue lors de la création du type de paiement."

        infos = errorHandler(undefined, "Le type de paiement a bien été ajouté.")
    }
    catch(error) {
        typePaiement = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        typePaiement
    })
})
.patch('/:IdTypePaiement', async (req, res) => {
    const IdTypePaiement = Number(req.params.IdTypePaiement)
    const typePaiementSent = req.body

    let infos = undefined
    let typePaiement = undefined

    try {
        if(isNaN(IdTypePaiement)) throw "Identifiant incorrect."

        typePaiementSent.id = IdTypePaiement
        await checkTypePaiement(typePaiementSent)

        typePaiement = await TypePaiement.findOne({
            where : {
                id : IdTypePaiement
            }
        })

        if(typePaiement === null) throw "Aucun type paiement correspondant."

        typePaiement.nom = typePaiementSent.nom
        await typePaiement.save()

        infos = errorHandler(undefined, "Le type de paiement a bien été modifié.")
    }
    catch(error) {
        typePaiement = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        typePaiement
    })
})
.delete('/:IdTypePaiement', async (req, res) => {
    const IdTypePaiement = Number(req.params.IdTypePaiement)

    let infos = undefined
    let typePaiement = undefined

    try {
        if(isNaN(IdTypePaiement)) throw "Identifiant incorrect."

        typePaiement = await TypePaiement.findOne({
            where : {
                id : IdTypePaiement
            }
        })

        if(typePaiement === null) throw "Aucun type de paiement correspondant."
        await typePaiement.destroy()

        infos = errorHandler(undefined, "Le type de paiement a bien été supprimé.")
    }
    catch(error) {
        typePaiement = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        typePaiement
    })
})


module.exports = router