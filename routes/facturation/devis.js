const express = require('express')
const router = express.Router()
const { Devis, Prestation } = global.db
const moment = require('moment')
const { sequelize, Op } = require('sequelize')

router
.get('/', async (req, res) => {
    let devis = undefined

    try {
        devis = await Devis.findAll({})
    }
    catch(error) {
        console.error(error);
    }


    res.send(devis)
})

module.exports = router