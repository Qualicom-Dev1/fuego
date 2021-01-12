const config = require('../../config/config.json')
const ovh = require('ovh')(config["OVH"])
const { Client, User, Structure } = global.db
const { Op } = require('sequelize')
const moment = require('moment')
const clientInformationObject = require('./errorHandler');

function getServiceSMS() {
    return new Promise((resolve, reject) => {
        try {
            ovh.request('GET', '/sms/', (err, service_sms) => {
                if(err) reject(`Erreur ovh service sms : ${err}`)

                resolve(service_sms)
            })
        }
        catch(error) {
            reject(error)
        }
    })
}

function getSMS(service_sms, action = 'incoming', id) {
    return new Promise((resolve, reject) => {
        try {
            ovh.request('GET', `/sms/${service_sms}/${action}/${id}`, (err, sms) => {
                if(err) reject(`Erreur ovh récupération sms ${action} id=${id} : ${err}`)
        
                resolve(sms)
            })
        }
        catch(error) {
            reject(error)
        }
    })
}

function getListeIdSMS(service_sms, action, dateDebut, dateFin) {
    return new Promise((resolve, reject) => {
        try {
            ovh.request('GET', `/sms/${service_sms}/${action}?creationDatetime.from=${encodeURIComponent(dateDebut)}&creationDatetime.to=${encodeURIComponent(dateFin)}`, async (err, listeIdSMS) => {
            // ovh.request('GET', `/sms/${service_sms}/${action}`, async (err, listeIdSMS) => {
                if(err) reject(`Erreur ovh récupération liste id sms ${action} : ${err}`)
        
                if(listeIdSMS == null || listeIdSMS.length === 0) resolve([])

                resolve(listeIdSMS)
            })
        }
        catch(error) {
            reject(error)
        }
    })
}

function getListeSMS(action = 'incoming', dateDebut, dateFin) {
    return new Promise(async (resolve, reject) => {
        try {
            const service_sms = await getServiceSMS()

            if(service_sms === null || service_sms.length === 0) throw 'Aucun service sms disponible.'

            const listeIdSMS = await getListeIdSMS(service_sms, action, dateDebut, dateFin)

            if(listeIdSMS == null || listeIdSMS.length === 0) resolve([])

            const listeSMS = await Promise.all(listeIdSMS.map(async (id) => {
                const sms = await getSMS(service_sms, action, id)
                return formatSMS(sms, action)
            }))

            resolve(listeSMS)
        }
        catch(error) {
            reject(error)
        }
    })
}

async function formatSMS(sms, action = 'incoming') {
    const formatedSMS = {
        id : sms.id,
        message : sms.message,
        date : action === 'incoming' ? moment(sms.creationDatetime).format('DD/MM/YYYY HH:mm') : (sms.sentAt !== null ? moment(sms.sentAt).format('DD/MM/YYYY HH:mm') : `Prévu le ${moment(sms.creationDatetime).add(sms.differedDelivery, 'minutes').format('DD/MM/YYYY HH:mm')}`),
        client : '?',
        numero : action === 'incoming' ? formatPhone(sms.sender) : formatPhone(sms.receiver)
    }

    try {
        const client = await Client.findOne({
            attributes : ['prenom', 'nom'],
            where : {
                [Op.or] : [
                    { tel1 : formatedSMS.numero },
                    { tel2 : formatedSMS.numero },
                    { tel3 : formatedSMS.numero }
                ]
            }
        })

        if(client === null) throw `formatSMS - aucun client correspondant au ${formatedSMS.numero}`

        formatedSMS.client = `${client.prenom} ${client.nom}`
    }
    catch(error) {
        clientInformationObject(error)
        formatedSMS.client = '?'
    }

    return formatedSMS
}

async function deleteSMS(service_sms, action = 'incoming', id) {
    return (new Promise((resolve, reject) => {
        try {
            if(!service_sms) throw "Le service sms doit être renseigné."
            if(!["incoming", "outgoing"].includes(action)) throw `${action} : action inconnue.`
            if(!id) throw "L'identifiant du sms doit être renseigné."

            ovh.request('DELETE', `/sms/${service_sms}/${action}/${id}`, (err, errorStatus) => {
                if(err) reject(`Erreur ovh lors de la suppression du sms ${action}/${id} : ${err} - ${errorStatus}`)
                
                resolve()
            })
        }
        catch(error) {
            reject(error)
        }
    }))
}

async function getListeIdPendingSMS(service_sms) {
    return (new Promise((resolve, reject) => {    
        try {
            if(!service_sms) throw "Le service sms doit être renseigné."

            ovh.request('GET', `/sms/${service_sms}/jobs`, async (err, listeIdSMS) => {            
                if(err) reject(`Erreur ovh récupération liste id pending sms : ${err}`)
                
                if(listeIdSMS == null || listeIdSMS.length === 0) resolve([])

                resolve(listeIdSMS)
            })
        }
        catch(error) {
            reject(error)
        }
    }))
}

async function formatPendingSMS(pendingSms) {
    const formatedSMS = {
        id : pendingSms.id,
        message : pendingSms.message,
        dateCreation : moment(pendingSms.creationDatetime).format('DD/MM/YYYY HH:mm'),
        dateDeliveryFor : moment(pendingSms.creationDatetime).add(pendingSms.differedDelivery, 'minutes'),
        client : '?',
        idClient : undefined,
        numero : formatPhone(pendingSms.receiver)
    }

    try {
        const client = await Client.findOne({
            attributes : ['id', 'prenom', 'nom'],
            where : {
                [Op.or] : [
                    { tel1 : formatedSMS.numero },
                    { tel2 : formatedSMS.numero },
                    { tel3 : formatedSMS.numero }
                ]
            }
        })

        if(client === null) throw `formatSMS - aucun client correspondant au ${formatedSMS.numero}`

        formatedSMS.client = `${client.prenom} ${client.nom}`
        formatedSMS.idClient = client.id
    }
    catch(error) {
        clientInformationObject(error)
        formatedSMS.client = '?'
    }

    return formatedSMS
}

async function getPendingSMS(service_sms, id) {
    return new Promise(async (resolve, reject) => {
        try {
            if(!service_sms) throw "Le service sms doit être renseigné."

            ovh.request('GET', `/sms/${service_sms}/jobs/${id}`, (err, sms) => {
                if(err) reject(`Erreur ovh récupération pending sms id=${id} : ${err}`)
        
                resolve(sms)
            })
        }
        catch(error) {
            reject(error)
        }
    })
}

async function getlistePendingSMS() {
    return new Promise(async (resolve, reject) => {
        try {
            const service_sms = await getServiceSMS()
            if(service_sms === null || service_sms.length === 0) throw 'Aucun service sms disponible.'

            const listeIdPendingSMS = await getListeIdPendingSMS(service_sms)
            if(listeIdPendingSMS == null || listeIdPendingSMS.length === 0) resolve([])

            const listePendingSMS = await Promise.all(listeIdPendingSMS.map(async id => {
                const pendingSMS = await getPendingSMS(service_sms, id)
                return formatPendingSMS(pendingSMS)
            }))

            resolve(listePendingSMS)
        }
        catch(error) {
            reject(error)
        }
    })
}

async function deletePendingSMS(id) {
    return (new Promise(async (resolve, reject) => {
        try {
            const service_sms = await getServiceSMS()
            if(service_sms === null || service_sms.length === 0) throw 'Aucun service sms disponible.'
        
            ovh.request('DELETE', `/sms/${service_sms}/jobs/${id}`, (err, errorStatus) => {
                if(err) reject(`Erreur ovh lors de la suppression du sms ${action}/${id} : ${err} - ${errorStatus}`)
                    
                resolve()
            })
        }
        catch(error) {
            reject(error)
        }
    }))
}

async function matchClientPendingSMS(idClient) {
    const listePendingSMS = await getlistePendingSMS()
    if(!listePendingSMS || listePendingSMS.length === 0) return null
    
    // parcours de la liste pour voir si l'idClient d'un sms correspondant à l'idClient recherché
    // retourne l'id du sms en attente s'il est trouvé
    for(const pendingSMS of listePendingSMS) {
        if(Number(pendingSMS.idClient) === Number(idClient)) return pendingSMS.id
    }

    return null
}

async function sendSMS(number, message, deliveryDate) {
    return (new Promise(async (resolve, reject) => {
        try {
            if(!message) throw "Le message ne peut être vide."
            if(!deliveryDate) throw "La date d'expédition doit être renseignée."

            const service_sms = await getServiceSMS()
            if(service_sms === null || service_sms.length === 0) throw 'Aucun service sms disponible.'

            // vérifie qu'on essaie pas d'envoyer un message dans le passé
            const now = moment()
            deliveryDate = moment(deliveryDate, 'DD/MM/YYYY HH:mm')
            // if(moment(deliveryDate).isBefore(now)) throw "La date d'expédition ne peut pas être dans le passé."

            // calcule la différence en minutes pour l'expédition du message
            // si la date d'expédition est antérieur la différence sera négative
            const diff = deliveryDate.diff(now, 'minutes')
            if(diff < 0) throw "La date d'expédition ne peut pas être dans le passé."

            const content = {
                "charset" : "UTF-8",
                "class" : "phoneDisplay",
                "coding" : "7bit",
                "differedPeriod" : diff, 	
                "message" : message,
                "noStopClause" : true,
                "priority" : "high",
                "receivers" : [`+33${number}`],
                "senderForResponse" : true,
                "validityPeriod" : 2880
            }
        
            ovh.request('POST', `/sms/${service_sms}/jobs/`, content, (err, errorStatus) => {
                if(err) reject(`Erreur ovh lors de l'envoie du sms "${message}" (${err} - ${errorStatus})`)
                    
                resolve()
            })
        }
        catch(error) {
            reject(error)
        }
    }))
}

function formatPhone(phoneNumber){
    if(phoneNumber){
        phoneNumber = cleanPhoneNumber(phoneNumber)

        if(phoneNumber.length === 10) return phoneNumber        
        if(phoneNumber.length === 9) return `0${phoneNumber}`
    }

    return ''
}

function cleanPhoneNumber(input) {
    return input.toString().trim().replace(/ |\.|-|\*|(\+\d{2})|@|\+|[\u000A\u000D]|[\u0020-\u002F]|[\u003A-\u007A]|[\u00C0-\u00FF]|²/ug,'')
}

module.exports = {
    getServiceSMS,
    getSMS,
    getListeIdSMS,
    getListeSMS,
    deleteSMS,
    getListeIdPendingSMS,
    getlistePendingSMS,
    getPendingSMS,
    deletePendingSMS,
    matchClientPendingSMS,
    sendSMS
}