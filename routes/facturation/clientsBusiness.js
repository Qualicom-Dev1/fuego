const express = require('express')
const router = express.Router()
const { ClientBusiness, Prestation } = global.db
const { Op } = require('sequelize')
const errorHandler = require('../../utils/errorHandler')
const isSet = require('../../utils/isSet')
const validations = require('../../utils/validations')

async function checkClient(client) {
    if(!isSet(client)) throw "Un client doit être transmis."
    validations.validationString(client.nom, 'Le nom du client ou de la société')
    if(isSet(client.adresse)) {
        validations.validationString(client.adresse, "L'adresse du client ou de la société", "e")
    }
    if(isSet(client.adresseComplement1)) {
        validations.validationString(client.adresseComplement1, "Le complément d'adresse 1 du client ou de la société")
    }
    if(isSet(client.adresseComplement2)) {
        validations.validationString(client.adresseComplement2, "Le complément d'adresse 2 du client ou de la société")
    }
    if(isSet(client.cp)) {
        validations.validationCodePostal(client.cp)
    }
    if(isSet(client.ville)) {
        validations.validationStringPure(client.ville, 'La ville', 'e')
    }
    if(isSet(client.email)) {
        validations.validationString(client.email, "L'adresse email", 'e')
    }
    if(isSet(client.telephone)) {
        validations.validationPhone(client.telephone, "principal")
    }
    if(isSet(client.numeroTVA)) {
        if(!/^FR[0-9]{2}[0-9]{9}$/ig.test(client.numeroTVA)) throw "Le numéro TVA doit être composé des lettres FR, suivie d'une clé à 2 chiffres et du numéro SIREN à 9 chiffres."
    }

    // vérifie que ce n'est pas un doublon
    const whereDoublon = {
        nom : {
            [Op.like] : `%${client.nom}%`
        }
    }
    if(isSet(client.telephone)) whereDoublon.telephone = client.telephone
    if(isSet(client.cp)) whereDoublon.cp = client.cp

    const checkDoublon = await ClientBusiness.findOne({
        where : whereDoublon
    })
    if(checkDoublon !== null && (!client.id || client.id !== checkDoublon.id)) throw "Le client ou la société existe déjà."

    if(client.id) {
        // vérifie l'existence
        const checkExistance = await ClientBusiness.findOne({
            where : {
                id : client.id
            }
        })
        if(checkExistance === null) throw "Aucun client correspondant."
    }
}

async function getAll() {
    let infos = undefined
    let clients = undefined

    try {
        clients = await ClientBusiness.findAll({
            order : [['nom', 'ASC']]
        })

        if(clients === null) throw "Une erreur est survenue lors de la récupération des clients."

        if(clients.length === 0) {
            clients = undefined
            infos = errorHandler(undefined, "Aucun client disponible.")
        }
    }
    catch(error) {
        clients = undefined
        infos = errorHandler(error)
    }

    return {
        infos,
        clients
    }
}

router
// affiche la page d'accueil
.get('', async (req, res) => {
    const { infos, clients } = await getAll()

    res.render('facturation/clientsBusiness', { 
        extractStyles: true,
        title : 'Clients | FUEGO', 
        description : 'Gestion des clients',
        session : req.session.client,
        options_top_bar : 'facturation',
        infos,
        clients
    })
})
// récupère tous les clients
.get('/all', async (req, res) => {
    const { infos, clients } = await getAll()

    res.send({
        infos,
        clients
    })
})
// récupère un client par son id
.get('/:IdClient', async (req, res) => {
    const IdClient = Number(req.params.IdClient)

    let infos = undefined
    let client = undefined

    try {
        if(isNaN(IdClient)) throw "Identifiant incorrect."

        client = await ClientBusiness.findOne({
            where : {
                id : IdClient
            }
        })

        if(client === null) throw "Aucun client correspondant."
    }
    catch(error) {
        client = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        client
    })
})
// crée un client
.post('', async (req, res) => {
    const clientSent = req.body

    let infos = undefined
    let client = undefined

    try {
        clientSent.adresse = clientSent.adresse ? clientSent.adresse : null
        clientSent.adresseComplement1 = clientSent.adresseComplement1 ? clientSent.adresseComplement1 : null
        clientSent.adresseComplement2 = clientSent.adresseComplement2 ? clientSent.adresseComplement2 : null
        clientSent.cp = clientSent.cp ? clientSent.cp : null
        clientSent.ville = clientSent.ville ? clientSent.ville : null
        clientSent.email = clientSent.email ? clientSent.email : null
        clientSent.telephone = clientSent.telephone ? clientSent.telephone : null
        clientSent.numeroTVA = clientSent.numeroTVA ? clientSent.numeroTVA : null

        await checkClient(clientSent)

        client = await ClientBusiness.create(clientSent)

        if(client === null) throw "Une erreur s'est produite lors de la création du client."

        infos = errorHandler(undefined, "Le client a bien été créé.")
    }
    catch(error) {
        client = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        client
    })
})
// modifie un client
.patch('/:IdClient', async (req, res) => {
    const IdClient = Number(req.params.IdClient)
    const clientSent = req.body

    let infos = undefined
    let client = undefined

    try {
        if(isNaN(IdClient)) throw "Identifiant incorrect."
        if(!isSet(clientSent)) throw "Un client doit être transmis."

        clientSent.id = IdClient
        await checkClient(clientSent)

        client = await ClientBusiness.findOne({
            where : {
                id : IdClient
            }
        })

        if(client === null) throw "Aucun client correspondant."

        client.nom = clientSent.nom
        client.adresse = clientSent.adresse ? clientSent.adresse : null
        client.adresseComplement1 = clientSent.adresseComplement1 ? clientSent.adresseComplement1 : null
        client.adresseComplement2 = clientSent.adresseComplement2 ? clientSent.adresseComplement2 : null
        client.cp = clientSent.cp ? clientSent.cp : null
        client.ville = clientSent.ville ? clientSent.ville : null
        client.email = clientSent.email ? clientSent.email : null
        client.telephone = clientSent.telephone ? clientSent.telephone : null
        client.numeroTVA = clientSent.numeroTVA ? clientSent.numeroTVA : null

        await client.save()

        infos = errorHandler(undefined, "Le client à bien été modifié.")
    }
    catch(error) {
        client = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        client
    })
})
// supprime un client
.delete('/:IdClient', async (req, res) => {
    const IdClient = Number(req.params.IdClient)

    let infos = undefined
    let client = undefined

    try {
        if(isNaN(IdClient)) throw "Identifiant incorrect."

        client = await ClientBusiness.findOne({
            where : {
                id : IdClient
            }
        })

        if(client === null) throw "Aucun client correspondant."

        // vérification de son utilisation
        const prestation = await Prestation.findOne({
            where : {
                idClient : client.id
            }
        })
        if(prestation !== null) throw "Le client possède un historique, impossible de le supprimer."

        await client.destroy()

        infos = errorHandler(undefined, "Le client a bien été supprimé.")
    }
    catch(error) {
        client = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        client
    })
})

module.exports = router