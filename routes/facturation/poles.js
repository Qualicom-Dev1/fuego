const express = require('express')
const router = express.Router()
const { Pole } = global.db
const moment = require('moment')
const { sequelize, Op } = require('sequelize')

router
.get('/', async (req, res) => {
    let poles = undefined

    try {
        poles = await Pole.findAll({})
    }
    catch(error) {
        console.error(error);
    }

    res.send(poles)
})

module.exports = router