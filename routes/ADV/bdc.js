const express = require('express')
const router = express.Router()
const models = global.db
const { 
    ADV_produit, Structure, ADV_categorie, 
    ADV_BDC, ADV_BDC_client, ADV_BDC_client_ficheRenseignementsTechniques, ADV_BDC_infoPaiement, ADV_BDC_produit, ADV_BDC_categorie 
} = models
const moment = require('moment')
const { Op } = require('sequelize')
const errorHandler = require('../utils/errorHandler')
const isSet = require('../utils/isSet')
const validations = require('../utils/validations')

async function checkBDC(bdc) {

}

router
// accède à la page des bons de commande
.get('', async (req, res) => {

})
// récupère un bon de commande
.get('/:Id_BDC', async (req, res) => {

})
// accède à la page de création d'un bon de commande
.get('/create', async (req, res) => {

})
// création d'un bdc
.post('', async (req, res) => {

})
// modification d'un bdc
.patch('', async (req, res) => {

})
// suppression d'un bdc
.delete('', async (req, res) => {

})

module.exports = router