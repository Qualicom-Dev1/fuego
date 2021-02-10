const express = require('express')
const router = express.Router()

router
.use('/categories', require('./categories'))
.use('/produits', require('./produits'))
.use('/ventes', require('./ventes'))

module.exports = router