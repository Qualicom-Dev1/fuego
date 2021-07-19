const express = require('express')
const router = express.Router()
const { Pole, Prestation } = global.db
const { Op } = require('sequelize')
const errorHandler = require('../../utils/errorHandler')
const isSet = require('../../utils/isSet')
const validations = require('../../utils/validations')

async function checkPole(pole) {
    if(!isSet(pole)) throw "Un pôle doit être transmis."
    if(!isSet(pole.nom)) throw "Le nom du pôle doit être renseigné."
    pole.nom = validations.validationString(pole.nom, 'Le nom')

    // vérifie si le nom est déjà utilisé
    const checkNomDB = await Pole.findOne({
        where : {
            nom : pole.nom
        }
    })
    if(checkNomDB !== null && (!pole.id || pole.id !== checkNomDB.id)) throw "Ce nom de pôle est déjà pris."
    
    if(pole.id) {
        // vérifie qu'il existe
        const checkExistanceDB= await Pole.findOne({
            where : {
                id : pole.id
            }
        })
        if(checkExistanceDB === null) throw "Aucun pôle correspondant."
    }
}

async function getAll() {
    let infos = undefined
    let poles = undefined

    try {
        poles = await Pole.findAll({
            order : [['nom', 'ASC']]
        })

        if(poles === null) throw "Une erreur est survenue lors de la récupération des pôles."
        if(poles.length === 0) {
            poles = undefined
            infos = errorHandler(undefined, "Aucun pôle disponible.")
        }
    }
    catch(error) {
        poles = undefined
        infos = errorHandler(error)
    }

    return {
        infos,
        poles
    }
}

router
// affiche la page des pôles
.get('', async (req, res) => {
    const { infos, poles } = await getAll()

    res.render('facturation/poles', { 
        extractStyles: true,
        title : 'Pôles | FUEGO', 
        description : 'Gestion des pôles',
        session : req.session.client,
        options_top_bar : 'facturation',
        infos,
        poles
    })
})
// récupère tous les pôles
.get('/all', async (req, res) => {
    const { infos, poles } = await getAll()

    res.send({
        infos,
        poles
    })
})
// récupère un pôle via son id
.get('/:IdPole', async (req, res) => {
    const IdPole = Number(req.params.IdPole)

    let infos = undefined
    let pole = undefined

    try {
        if(isNaN(IdPole)) throw "Identifant incorrect."

        pole = await Pole.findOne({
            where : {
                id : IdPole
            }
        })

        if(pole === null) throw "Aucun pôle correspondant."
    }
    catch(error) {
        pole = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        pole
    })
})
// crée un pôle
.post('', async (req, res) => {
    const poleSent = req.body

    let infos = undefined
    let pole = undefined

    try {
        await checkPole(poleSent)

        pole = await Pole.create(poleSent)

        if(pole === null) throw "Une erreur est survenue lors de la création du pôle."

        infos = errorHandler(undefined, "Le pôle a bien été créé.")
    }
    catch(error) {
        pole = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        pole
    })
})
// modifie un pôle
.patch('/:IdPole', async (req, res) => {
    const IdPole = Number(req.params.IdPole)
    const poleSent = req.body

    let infos = undefined
    let pole = undefined

    try {
        if(isNaN(IdPole)) throw "Identifiant incorrect."
        if(!isSet(poleSent)) throw "Un pôle doit être transmis."

        poleSent.id = IdPole
        await checkPole(poleSent)

        pole = await Pole.findOne({
            where : {
                id : IdPole
            }
        })

        if(pole === null) throw "Aucun pôle correspondant."

        pole.nom = poleSent.nom
        await pole.save()

        infos = errorHandler(undefined, "Le pôle a bien été modifié.")
    }
    catch(error) {
        pole = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        pole
    })
})
// supprime un pôle
.delete('/:IdPole', async (req, res) => {
    const IdPole = Number(req.params.IdPole)

    let infos = undefined
    let pole = undefined

    try {
        if(isNaN(IdPole)) throw "Identifiant incorrect."

        pole = await Pole.findOne({
            where : {
                id : IdPole
            }
        })

        if(pole === null) throw "Aucun pôle correspondant."

        // vérification de son utilisation
        const prestation = await Prestation.findOne({
            where : {
                idPole : pole.id
            }
        })
        if(prestation !== null) throw "Le pôle est utlisé, impossible de le supprimer."

        await pole.destroy()

        infos = errorHandler(undefined, "Le pôle a bien été supprimé.")
    }
    catch(error) {
        pole = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        pole
    })
})

module.exports = router