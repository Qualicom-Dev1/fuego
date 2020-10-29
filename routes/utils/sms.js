const config = require('../../config/config.json')
const ovh = require('ovh')(config["OVH"])
const { Client } = global.db
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
        date : action === 'incoming' ? moment(sms.creationDatetime).format('DD/MM/YYYY HH:mm') : moment(sms.sentAt).format('DD/MM/YYYY HH:mm'),
        client : '?',
        numero : action === 'incoming' ? sms.sender.replace('+33', '0') : sms.receiver.replace('+33', '0')
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

module.exports = {
    getServiceSMS,
    getSMS,
    getListeIdSMS,
    getListeSMS,
}