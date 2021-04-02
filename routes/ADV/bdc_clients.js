const express = require('express')
const router = express.Router()
const models = global.db
const { ADV_BDC_client, ADV_BDC_client_ficheRenseignementsTechniques, Client, RDV } = models
const { Op } = require('sequelize')
const errorHandler = require('../utils/errorHandler')
const isSet = require('../utils/isSet')
const validations = require('../utils/validations')

async function checkClient(client) {
    if(!isSet(client)) throw "Les informations client doivent être transmises."

    // vérifie que le client est présent en BDD
    if(isSet(client.refIdClient)) {
        const clientSource = await Client.findOne({
            where : {
                id : client.refIdClient
            }
        })
        if(clientSource === null) throw "Le client source n'a pas été retrouvé."
    }

    // vérification de l'intitulé et du ou des noms
    if(!isSet(client.intitule)) throw "Un intitulé pour le client doit être sélectionné."
    if(!['M','MME','M et MME','Messieurs','Mesdames'].includes(client.intitule)) throw "L'intitulé du client doit être dans la liste fournie."
    validations.validationString(client.nom1, "Le nom du client 1")
    validations.validationString(client.prenom1, "Le prénom du client 1")
    if(isSet(client.nom2)) validations.validationString(client.nom2, "Le nom du client 2")
    else client.nom2 = null
    if(isSet(client.prenom2)) validations.validationString(client.prenom2, "Le prénom du client 2")
    else client.prenom2 = null
    if(['M et MME','Messieurs','Mesdames'].includes[client.intitule] && (!isSet(client.nom2) || !isSet(client.prenom2))) throw "Le nom et le prénom du client 2 doivent être renseignés."
    if(['M','MME'].includes(client.intitule)) {
        client.nom2 = null
        client.prenom2 = null
    }

    // vérification des infos de contact
    client.adresse = validations.validationString(client.adresse, "L'adresse", "e")
    if(isSet(client.adresseComplement1)) client.adresseComplement1 = validations.validationString(client.adresseComplement1, "Le complément d'adresse 1")
    else client.adresseComplement1 = ''
    if(isSet(client.adresseComplement2)) client.adresseComplement2 = validations.validationString(client.adresseComplement2, "Le complément d'adresse 2")
    else client.adresseComplement2 = ''
    validations.validationCodePostal(client.cp)
    client.ville = validations.validationStringPure(client.ville)
    validations.validationEmail(client.email, "L'email de contact")
    client.telephonePort = validations.validationMobilePhone(client.telephonePort, "portable")
    if(isSet(client.telephoneFixe)) client.telephoneFixe = validations.validationPhone(client.telephoneFixe, "fixe")
    else client.telephoneFixe = null

    // vérification des informations techniques
    client.ficheRenseignementsTechniques = await checkFicheRenseignementsTechniques(client.ficheRenseignementsTechniques)
    if(!isSet(client.clefSignature)) client.clefSignature = null

    return client
}

async function checkFicheRenseignementsTechniques(fiche) {
    if(!isSet(fiche)) throw "La fiche d'informations techniques du client doit être transmise."

    // vérification du type d'installation
    if(!isSet(fiche.typeInstallationElectrique)) throw "Le type d'installation électrique doit être renseigné."
    if(!['monophasée','triphasée'].includes(fiche.typeInstallationElectrique)) throw "Le type d'installation électrique doit être dans la liste fournie."
    
    // vérification de la puissance
    if(!isSet(fiche.puissanceKW) && !isSet(fiche.puissanceA)) throw "La puissance de l'installation électrique en KW ou en A doit être fournie."
    if(isSet(fiche.puissanceKW)) validations.validationNumbers(fiche.puissanceKW, "La puissance électrique en KW", 'e')
    else fiche.puissanceKW = null
    if(isSet(fiche.puissanceA)) validations.validationNumbers(fiche.puissanceA, "La puissance de l'installation électrique en A", 'e')
    else fiche.puissanceA = null

    // vérification date de construction
    if(!isSet(fiche.anneeConstructionMaison) && !isSet(fiche.dureeSupposeeConstructionMaison) && !isSet(fiche.dureeAcquisitionMaison)) throw "L'un des éléments d'ancienneté de la maison doit être rempli."
    if(isSet(fiche.anneeConstructionMaison)) fiche.anneeConstructionMaison = validations.validationYear(fiche.anneeConstructionMaison, "L'année de construction de la maison")
    else fiche.anneeConstructionMaison = null
    if(isSet(fiche.dureeSupposeeConstructionMaison)) {
        fiche.dureeSupposeeConstructionMaison = validations.validationNumbers(fiche.dureeSupposeeConstructionMaison, "La durée supposée depuis quand la maison est construite", 'e')
        fiche.dureeSupposeeConstructionMaison = validations.validationInteger(fiche.dureeSupposeeConstructionMaison, "La durée supposée depuis quand la maison est construite", 'e')
        if(Number(moment().subtract(fiche.dureeSupposeeConstructionMaison, 'years').format('YYYY')) < 1800) throw "L'année supposée de construction de la maison ne peut pas être aussi ancienne."
    }
    else fiche.dureeSupposeeConstructionMaison = null
    if(isSet(fiche.dureeAcquisitionMaison)) {
        fiche.dureeAcquisitionMaison = validations.validationNumbers(fiche.dureeAcquisitionMaison, "La durée depuis laquelle le client est propriétaire", 'e')
        fiche.dureeAcquisitionMaison = validations.validationInteger(fiche.dureeAcquisitionMaison, "La durée depuis laquelle le client est propriétaire", 'e')
    }
    else fiche.dureeAcquisitionMaison = null

    // vérification résidance
    if(!isSet(fiche.typeResidence)) throw "Le type de résidence doit être renseigné."
    if(!['principale','secondaire'].includes(fiche.typeResidence)) throw "Le type de résidence doit être dans la liste fournie."
    fiche.superficie = validations.validationNumbers(fiche.superficie, "La superficie de la maison", 'e')
    fiche.superficie = validations.validationInteger(fiche.superficie, "La superficie", 'e')

    return fiche
}

async function create_BDC_client(clientSent, transaction = null) {
    clientSent = await checkClient(clientSent)
    let client = undefined

    const ficheRenseignementsTechniques = await create_BDC_client_ficheRenseignementsTechniques(clientSent.ficheRenseignementsTechniques, transaction)
    if(ficheRenseignementsTechniques === null) throw "une erreur est survenue lors de la création de la fiche d'information techniques du client."

    clientSent.ficheRenseignementsTechniques = undefined
    clientSent.idClientFicheRenseignementsTechniques = ficheRenseignementsTechniques.id

    try {
        client = await ADV_BDC_client.create(clientSent, { transaction })
        if(client === null) throw "Une erreur est survenue lors de la création du client."
    }
    catch(error) {
        // await ficheRenseignementsTechniques.destroy()
        throw error
    }

    return client
}

async function create_BDC_client_ficheRenseignementsTechniques(ficheSent, transaction = null) {
    ficheSent = await checkFicheRenseignementsTechniques(ficheSent)

    const fiche = await ADV_BDC_client_ficheRenseignementsTechniques.create(ficheSent, { transaction })
    if(fiche === null) throw "une erreur est survenue lors de la création de la fiche d'information techniques du client."

    return fiche
}

router
// récupère un client de type ADV_BDC_client
.get('/:Id_BDC_Client', async (req, res) => {
    const Id_BDC_Client = Number(req.params.Id_BDC_Client)

    let infos = undefined
    let client = undefined

    try {
        if(isNaN(Id_BDC_Client)) throw "L'identifiant du client est incorrect."

        client = await ADV_BDC_client.findOne({
            include : ADV_BDC_client_ficheRenseignementsTechniques,
            where : {
                id : Id_BDC_Client
            }
        })
        if(client === null) throw "Une erreur est survenue lors de la récupération du client."
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
// récupère un client tel qu'enregistré en base pour le RDV avant la vente
.get('/clientRDV/:Id_Client', async (req, res) => {
    const Id_Client = Number(req.params.Id_Client)

    let infos = undefined
    let client = undefined

    try {
        if(isNaN(Id_Client)) throw "L'identifiant du client est incorrect."

        client = await Client.findOne({
            attributes : [
                'civil1', 'civil2', 'nom', 'prenom', 'tel1', 'tel2', 'adresse', 'cp', 'ville', 'mail'
            ],
            where : {
                id : Id_Client
            }
        })
        if(client === null) throw "une erreur est survenue lors de la récupération du client."
    
        // correspondance de l'intitulé du client
        client = JSON.parse(JSON.stringify(client))

        if(!isSet(client.civil1) && !isSet(client.civil2)) client.intitule = 'M'
        else if((isSet(client.civil1) && client.civil1 === 'M')) {
            if(!isSet(client.civil2)) client.intitule = 'M'
            else if(client.civil2 === 'Mme') client.intitule = 'M et MME'
            else if(client.civil2 === 'M') client.intitule = 'Messieurs'
            else client.intitule = 'M'
        }
        else if((isSet(client.civil1) && client.civil1 === 'Mme')) {
            if(!isSet(client.civil2)) client.intitule = 'MME'
            else if(client.civil2 === 'Mme') client.intitule = 'Mesdames'
            else if(client.civil2 === 'M') client.intitule = 'M et MME'
            else client.intitule = 'MME'
        }
        else {
            client.intitule = 'M'
        }

        client.civil1 = undefined
        client.civil2 = undefined
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
// vérifie les infos saisies pour un client
.post('/checkClient', async (req, res) => {
    let infos = undefined

    try {
        await checkClient(req.body)
        infos = errorHandler(undefined, 'ok')
    }
    catch(error) {
        infos = errorHandler(error)
    }

    res.send({
        infos
    })
})
// récupère une fiche de renseignements
.get('/ficheRenseignements/:Id_FicheRenseignements', async (req, res) => {
    const Id_FicheRenseignements = Number(req.params.Id_FicheRenseignements)

    let infos = undefined
    let ficheRenseignementsTechniques = undefined

    try {
        if(isNaN(Id_FicheRenseignements)) throw "L'identifiant de la fiche d'informations techniques est incorrect."

        ficheRenseignementsTechniques = await ADV_BDC_client_ficheRenseignementsTechniques.findOne({
            where : {
                id : Id_FicheRenseignements
            }
        })
        if(ficheRenseignementsTechniques === null) throw "Une erreur est survenue lors de la récupération de la fiche d'informations techniques du client."
    }
    catch(error) {
        ficheRenseignementsTechniques = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        ficheRenseignementsTechniques
    })
})
// vérifie les infos saisies pour une fiche de renseignements techniques
.post('/ficheRenseignements', async (req, res) => {
    let infos = undefined

    try {
        await checkFicheRenseignementsTechniques(req.body)
        infos = errorHandler(undefined, 'ok')
    }
    catch(error) {
        infos = errorHandler(error)
    }

    res.send({
        infos
    })
})
// récupère la clef de signature du client
.get('/siganture/key/:Id_BDC_Client', async (req, res) => {
    const Id_BDC_Client = Number(req.params.Id_BDC_Client)

    let infos = undefined
    let signatureKey = undefined

    try {
        if(isNaN(Id_BDC_Client)) throw "L'identifiant du clien test incorrect."

        const client = await ADV_BDC_client.findOne({
            attributes : ['clefSignature'],
            where : {
                id : Id_BDC_Client
            }
        })
        if(client === null) throw "Une erreur est survenue en récupérant la clef de siganture du client."
        if(client.clefSignature === null || client.clefSignature === '') throw "Le client n'a pas encore de clef de signature."
        
        signatureKey = client.clefSignature
    }
    catch(error) {
        signatureKey = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        clefSignature
    })
})
// assigne ou modifie la clef de signature du client
.patch('/siganture/key/:Id_BDC_Client', async (req, res) => {
    const Id_BDC_Client = Number(req.params.Id_BDC_Client)

    let infos = undefined

    try {
        if(isNaN(Id_BDC_Client)) throw "L'identifiant du clien test incorrect."

        const clefSignature = req.body.clefSignature
        if(!isSet(clefSignature)) throw "La clef de signature doit être transmise."

        const client = await ADV_BDC_client.findOne({
            where : {
                id : Id_BDC_Client
            }
        })
        if(client === null) throw "Une erreur est survenue en récupérant le client pour lui affecter sa clef de signature."

        client.clefSignature = clefSignature
        await client.save()

        infos = errorHandler(undefined, "La clef de signature a bien été ajoutée au client.")
    }
    catch(error) {
        infos = errorHandler(error)
    }

    res.send({
        infos
    })
})



module.exports = {
    router,
    checkClient,
    checkFicheRenseignementsTechniques,
    create_BDC_client,
}