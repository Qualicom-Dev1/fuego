const express = require('express')
const router = express.Router()
const { Facture, Devis, Prestation, TypePaiement } = global.db
const moment = require('moment')
const { sequelize, Op } = require('sequelize')

router
.get('/', async (req, res) => {
    let factures = undefined

    try {
        factures = await Facture.findAll({})
    }
    catch(error) {
        console.error(error);
    }

    res.send(factures)
})

module.exports = router