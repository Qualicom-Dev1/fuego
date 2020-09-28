const express = require('express')
const router = express.Router()
const { Prestation, ClientBusiness, Pole } = global.db
const { Op } = require('sequelize')
const errorHandler = require('../utils/errorHandler')
const isSet = require('../utils/isSet')
const validations = require('../utils/validations')

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