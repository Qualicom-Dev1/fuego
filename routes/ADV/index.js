const express = require('express')
const router = express.Router()

router
.use('/categories', require('./categories'))
.use('/produits', require('./produits').router)
.use('/ventes', require('./ventes'))
.use('/bdc/clients', require('./bdc_clients').router)
.use('/bdc/infosPaiement', require('./bdc_infoPaiements').router)
.use('/bdc/categories', require('./bdc_categories').router)
.use('/bdc/produits', require('./bdc_produits').router)
.use('/bdc', require('./bdc'))

module.exports = router