const express = require('express')
const router = express.Router()
const { ProduitBusiness } = global.db
const moment = require('moment')
const { sequelize, Op } = require('sequelize')

router
.get('/', async (req, res) => {
    let produits = undefined

    try {
        produits = await ProduitBusiness.findAll({})
    }
    catch(error) {
        console.error(error)
    }

    res.send(produits)
})

module.exports = router