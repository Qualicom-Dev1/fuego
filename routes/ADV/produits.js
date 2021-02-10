const express = require('express')
const router = express.Router()
const models = global.db
const moment = require('moment')
const sequelize = require('sequelize')
const Op = sequelize.Op

router
.get('/' , (req, res) => {
    res.render('ADV/produits', { extractStyles: true, title: 'ADV Produits | FUEGO', session: req.session.client, options_top_bar: 'adv'});
})

module.exports = router