const express = require('express')
const router = express.Router()
const { ProduitBusiness, Prestation } = global.db
const moment = require('moment')
const { sequelize, Op } = require('sequelize')

router
.get('/', async (req, res) => {
    let produits_prestations = undefined

    try {
        produits_prestations = await ProduitBusiness_Prestation.findAll({})
    }
    catch(error) {
        console.error(error)
    }

    res.send(produits_prestations)
})

module.exports = router