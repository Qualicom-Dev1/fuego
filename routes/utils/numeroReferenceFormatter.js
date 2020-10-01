const moment = require('moment')
const { COMPTEUR_FACTURES_GENERALES, COMPTEUR_FACTURES_AVOIRS } = require('./compteurs')
const compteurs = require('./compteurs')
const isSet = require('./isSet')

function numeroFormatter(num) {
    const numSize = num.toString().length
    let formatedNumber = ''

    // on ajoute des 0 en dessous de 1000
    if(numSize < 4) {
        const diff = 4 - numSize
        for(let i = 0; i < diff; i++) {
            formatedNumber += '0'
        }
    }
    formatedNumber += num

    return formatedNumber
}

function createNumeroReferenceBase(type) {
    if(!['devis', 'acompte', 'avoir', 'solde'].includes(type)) throw `Impossible de créer le numéro de référence du format ${type}.`

    let ref = ''

    switch(type) {
        case 'devis' : 
            ref += 'DE'
            break;
        case 'acompte' : 
            ref += 'FAA'
            break;
        case 'avoir' : 
            ref += 'AV'
            break;
        case 'solde' : 
            ref += 'FA'
            break;
    }

    ref += `${moment().format('YYYY')}-***`

    return ref
}

async function setNumeroReferenceFinal(ref) {
    if(!isSet(ref)) throw "Aucun numéro de référence transmis."

    const match = ref.match(/^(?:DE|FAA|AV|FA)/)
    if(match === null) throw "Le format du numéro de référence est incorrect."

    const type = match[0]
    let numero = 0

    if(type === 'DE') {
        numero = await compteurs.get(compteurs.COMPTEUR_DEVIS)
    }
    else if(type === 'FA' || type === 'FAA') {
        numero = await compteurs.get(COMPTEUR_FACTURES_GENERALES)
    }
    else if(type === 'AV') {
        numero = await compteurs.get(COMPTEUR_FACTURES_AVOIRS)
    }

    ref = ref.replace(/(\*){3}/g, formatedNumber(numero))

    return ref
}

module.exports = {
    numeroFormatter,
    createNumeroReferenceBase,
    setNumeroReferenceFinal
}