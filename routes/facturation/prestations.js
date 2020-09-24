const express = require('express')
const router = express.Router()
const { Prestation, ClientBusiness, Pole } = global.db
const moment = require('moment')
const { sequelize, Op } = require('sequelize')

router
.get('/', async (req, res) => {
    let prestations = undefined

    try {
        prestations = await Prestation.findAll({})
    }
    catch(error) {
        console.error(error)
    }

    res.send(prestations)
})

module.exports = router