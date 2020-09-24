const express = require('express')
const router = express.Router()
const { ClientBusiness } = global.db
const moment = require('moment')
const { sequelize, Op } = require('sequelize')

router
.get('/', async (req, res) => {
    let clients = undefined

    try {
        clients = await ClientBusiness.findAll({})
    }
    catch(error) {
        console.error(error);
    }

    res.send(clients)
})

module.exports = router