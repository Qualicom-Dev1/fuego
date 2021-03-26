const express = require('express')
const router = express.Router()
const models = global.db
const { ADV_BDC_categorie, ADV_categorie } = models
const { Op } = require('sequelize')
const errorHandler = require('../utils/errorHandler')
const isSet = require('../utils/isSet')
const validations = require('../utils/validations')

async function checkCategorie(categorie) {
    if(!isSet(categorie)) throw "Une catégorie doit être transmise."

    // vérifie le nom et la description
    validations.validationString(categorie.nom, "Le nom de la catégorie")
    if(isSet(categorie.description)) validations.validationString(categorie.description, "La description de la catégorie", "e")

    // vérifie la catégorie de référence
    if(!isSet(categorie.idADV_categorie)) throw "Aucune catégorie de sélectionnée."
    const categorieRef = await ADV_categorie.findOne({
        where : {
            id : categorie.idADV_categorie
        }
    })
    if(categorieRef === null) throw `Catégorie "${categorie.nom}" introuvable.`
}

async function create_BDC_categorie(categorieSent, transaction = null) {
    await checkCategorie(categorieSent)

    if(!isSet(categorieSent.description)) categorieSent.description = ''

    const categorie = await ADV_BDC_categorie.create(categorieSent, { transaction })

    return categorie
}

router 
.get('/:Id_BDC_Categorie', async (req, res) => {
    const Id_BDC_Categorie = Number(req.params.Id_BDC_Categorie)

    let infos = undefined
    let categorie = undefined

    try {
        if(isNaN(Id_BDC_Categorie)) throw "L'identifaint de la catégorie est incorrect."

        categorie = await ADV_BDC_categorie.findOne({
            where : {
                id : Id_BDC_Categorie
            }
        })
        if(categorie === null) throw "Une erreur est surveue lors de la récupération de la catégorie."
    }
    catch(error) {
        categorie = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        categorie
    })
})

module.exports = {
    router,
    checkCategorie,
    create_BDC_categorie
}