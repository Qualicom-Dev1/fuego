const express = require('express')
const router = express.Router()

router
.use('/typesPaiement', require('./typesPaiement'))
.use('/poles', require('./poles'))
.use('/clientsBusiness', require('./clientsBusiness'))
.use('/produitsBusiness', require('./produitsBusiness'))
.use('/prestations', require('./prestations'))
.use('/produitsBusiness_prestations', require('./produitsBusiness_prestations').router)
.use('/devis', require('./devis'))
.use('/factures', require('./factures'))

module.exports = router