const express = require('express')
const router = express.Router()
const { TypePaiement } = global.db
const moment = require('moment')
const { sequelize, Op } = require('sequelize')

router
.get('/', async (req, res) => {
    let typesPaiement = undefined

    try {
        typesPaiement = await TypePaiement.findAll({})
    }
    catch(error) {
        console.error(error);
    }

    res.send(typesPaiement)
})

module.exports = router