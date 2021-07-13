const express = require('express')
const router = express.Router()

router
.use('/mon_compte', require('./monCompte'))
.use(require('./parametres'))

module.exports = router