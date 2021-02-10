const express = require('express')
const router = express.Router()

router
.use('/produits', require('./produits'))
.use('/ventes', require('./ventes'))

module.exports = router