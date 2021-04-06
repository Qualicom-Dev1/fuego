const isSet = require('./isSet')
const moment = require('moment')

function validationPhone(phoneNumber, sujet = '') {
    if(!isSet(phoneNumber)) throw `Le numéro de téléphone ${sujet} doit être fourni.`

    // conversion en string
    phoneNumber = phoneNumber.toString()

    // vérifie qu'il n'y a que des caractères numérics
    if(phoneNumber.match(/([^0-9])/ig) !== null) throw `Le numéro de téléphone ${sujet} doit être composé uniquement de chiffres.`

    if(phoneNumber.length < 10) phoneNumber = `0${phoneNumber}`
    
    if(phoneNumber.length !== 10) throw `Le numéro de téléphone ${sujet} doit être composé de 10 chiffres (ex : 0000000000).`
    
    return phoneNumber
}

function validationMobilePhone(phoneNumber, sujet = '') {
    phoneNumber = validationPhone(phoneNumber, sujet)

    if(!["6", "7"].includes(phoneNumber.slice(1,2))) throw `Le numéro de téléphone ${sujet} n'est pas un numéro de mobile.`

    return phoneNumber
}

function validationCodePostal(cp) {
    if(!isSet(cp)) throw "Le code postal doit être fourni."

    // conversion en string
    cp = cp.toString().trim()

    // vérifie qu'il n'y a que des caractères numérics
    if(cp.match(/([^0-9])/ig) !== null) throw "Le code postal doit être composé uniquement de chiffres."

    if(cp.length !== 5) throw "Le code postal doit être composé de 5 chiffres (ex : 21000)."

    return cp
}

function validationStringPure(string, sujet, accord = '') {
    if(!isSet(string)) throw `${sujet} doit être fourni${accord}.`

    string = string.trim()

    // vérifie qu'il n'y a que des caractères alpha
    // saut de ligne + retour chariot + latin de base - chiffres + supplément latin-1 + ² (carré)
    if(!/^([\u000A\u000D]|[\u0020-\u002F]|[\u003A-\u007A]|[\u00C0-\u00FF]|²|€)+$/ug.test(string)) throw `${sujet} ne doit pas contenir de caractères spéciaux.`

    return string
}

function validationString(string, sujet, accord = '') {
    if(!isSet(string)) throw `${sujet} doit être fourni${accord}.`

    string = string.trim()
    
    // alphanumérique + majuscules et minuscules avec accents
    // saut de ligne + retour chariot + latin de base + supplément latin-1 + ² (carré)
    if(!/^([\u000A\u000D]|[\u0020-\u007A]|[\u00C0-\u00FF]|²|€|~)*$/gu.test(string)) throw `${sujet} ne doit pas contenir de caractères spéciaux.`

    return string
}

function validationNumbers(nb, sujet, accord = '') {
    if(!isSet(nb)) throw `${sujet} doit être fourni${accord}.`

    nb = Number(nb)

    if(isNaN(nb)) throw `${sujet} doit être composé${accord} uniquement de chiffres (ex : 54).`
    if(nb < 0) throw `${sujet} ne peut pas être inférieur${accord} à 0.`

    return nb
}

function validationPositiveNumbers(nb, sujet, accord = '') {
    if(!isSet(nb)) throw `${sujet} doit être fourni${accord}.`

    nb = validationNumbers(nb, sujet, accord)
    if(nb === 0) throw `${sujet} doit être positi${accord === '' ? 'f' : 've'}.`

    return nb
}

function validationInteger(nb, sujet, accord = '') {
    nb = validationNumbers(nb, sujet, accord)

    if(nb  % 1 !== 0) throw `${sujet} doit être un nombre entier.`

    return nb
}

function validationPositiveInteger(nb, sujet, accord = '') {
    nb = validationNumbers(nb, sujet, accord)
    nb = validationInteger(nb, sujet, accord)

    if(nb === 0) throw `${sujet} doit être positi${accord === '' ? 'f' : 've'}.`

    return nb
}

function validationYear(year, sujet) {
    year = validationNumbers(year, sujet, 'e')

    if(year % 1 !== 0) throw `${sujet} doit être un nombre entier.`
    // année suffisamment éloignée pour qu'en dessous ça ne soit pas possible
    if(year < 1800) throw `${sujet} ne peut pas être aussi ancienne.`
    // année suffisamment éloignée pour qu'au dessus ça ne soit pas possible
    if(year > Number(moment().add(50, 'years').format('YYYY'))) throw `${sujet} ne peut pas être aussi éloignée dans le futur.`

    return year
}

function validationDateFullFR(date, sujet) {
    if(!isSet(date)) throw `${sujet} doit être fournie.`

    if(!/^(?:(?:0[1-9])|(?:1[0-9])|(?:2[0-9])|(?:3[0-1]))\/(?:(?:0[1-9])|(?:1[0-2]))\/20\d{2}$/.test(date)) throw `${sujet} n'est pas dans le bon format.`

    return date
}

function validationTime(time, sujet) {
    if(!isSet(time)) throw `${sujet} doit être fournie.`

    if(!/^(([0-1]{1}[0-9]{1})|(2[0-3]{1})){1}:[0-5]{1}[0-9]{1}$/g.test(time)) throw `${sujet} n'est pas dans le bon format.`

    return time
}

function validationEmail(email, sujet) {
    if(!isSet(email)) throw `${sujet} doit être fourni.`
    
    if(!/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email)) {
        throw `${sujet} n'est pas dans le bon format.`
    }

    return email
}

function validationClient(sentClient) {
    // infos principales
    sentClient.nom = validationString(sentClient.nom, 'Le nom')
    sentClient.prenom = validationString(sentClient.prenom, 'Le prénom')
    sentClient.tel1 = validationPhone(sentClient.tel1, 'principal')
    sentClient.adresse = validationString(sentClient.adresse, "L'adresse", 'e')
    sentClient.cp = validationCodePostal(sentClient.cp)
    sentClient.ville = validationStringPure(sentClient.ville, 'La ville', 'e')

    sentClient.dep = sentClient.cp.substr(0,2)

    // infos secondaires
    if(isSet(sentClient.tel2)) {
        sentClient.tel2 = validationPhone(sentClient.tel2, 'secondaire')
    }
    if(isSet(sentClient.tel3)) {
        sentClient.tel3 = validationPhone(sentClient.tel3, "n°3")
    }
    if(isSet(sentClient.nbadultes)) {
        sentClient.nbadultes = validationNumbers(sentClient.nbadultes, "Le nombre d'adultes")
    }
    if(isSet(sentClient.nbenfants)) {
        sentClient.nbenfants = validationNumbers(sentClient.nbenfants, "Le nombre d'enfants")
    }
    if(isSet(sentClient.pdetail1)) {
        sentClient.pdetail1 = validationString(sentClient.pdetail1, 'Le métier 1')
    }
    if(isSet(sentClient.pdetail2)) {
        sentClient.pdetail2 = validationString(sentClient.pdetail2, 'Le métier 2')
    }
    if(isSet(sentClient.age1)) {
        sentClient.age1 = validationNumbers(sentClient.age1, "L'age 1")
    }
    if(isSet(sentClient.age2)) {
        sentClient.age2 = validationNumbers(sentClient.age2, "L'age 2")
    }
    if(isSet(sentClient.surface)) {
        sentClient.surface = validationNumbers(sentClient.surface, "La surface", 'e')
    }
    if(isSet(sentClient.annee)) {
        sentClient.annee = validationYear(sentClient.annee, "L'année de pose des panneaux")
    }
    if(isSet(sentClient.anneepropr)) {
        sentClient.anneepropr = validationYear(sentClient.anneepropr, "L'année d'acquisition de la propriété")
    }
    if(isSet(sentClient.anneeconstr)) {
        sentClient.anneeconstr = validationYear(sentClient.anneeconstr, "L'année de construction de la propriété")
    }
    if(isSet(sentClient.etages)) {
        sentClient.etages = validationNumbers(sentClient.etages, "Le nombre d'étages")
    }
    if(isSet(sentClient.velux)) {
        sentClient.velux = validationNumbers(sentClient.velux, "Le nombre de vélux")
    }
    if(isSet(sentClient.chiens)) {
        sentClient.chiens = validationNumbers(sentClient.chiens, "Le nombre de chiens assis")
    }
    if(isSet(sentClient.gaz) && isSet(sentClient.agegaz)) {
        sentClient.agegaz = validationNumbers(sentClient.agegaz, "L'âge de l'installation gaz")
    }
    if(isSet(sentClient.gaz) && isSet(sentClient.prixgaz)) {
        sentClient.prixgaz = validationNumbers(sentClient.prixgaz, "Le coût annuel de l'installation gaz")
    }
    if(isSet(sentClient.elec) && isSet(sentClient.ageelec)) {
        sentClient.ageelec = validationNumbers(sentClient.ageelec, "L'âge de l'installation électrique")
    }
    if(isSet(sentClient.elec) && isSet(sentClient.prixelec)) {
        sentClient.prixelec = validationNumbers(sentClient.prixelec, "Le coût annuel de l'installation électrique")
    }
    if(isSet(sentClient.cheminee) && isSet(sentClient.agechem)) {
        sentClient.agechem = validationNumbers(sentClient.agechem, "L'âge de la cheminée")
    }
    if(isSet(sentClient.cheminee) && isSet(sentClient.prixchem)) {
        sentClient.prixchem = validationNumbers(sentClient.prixchem, "Le coût annuel de la cheminée")
    }
    if(isSet(sentClient.poele) && isSet(sentClient.agepoele)) {
        sentClient.agepoele = validationNumbers(sentClient.agepoele, "L'âge de l'installation du poêle")
    }
    if(isSet(sentClient.poele) && isSet(sentClient.prixpoele)) {
        sentClient.prixpoele = validationNumbers(sentClient.prixpoele, "Le coût annuel du poêle")
    }
    if(isSet(sentClient.fioul) && isSet(sentClient.agefioul)) {
        sentClient.agefioul = validationNumbers(sentClient.agefioul, "L'âge de la chaudière à fioul")
    }
    if(isSet(sentClient.fioul) && isSet(sentClient.prixfioul)) {
        sentClient.prixfioul = validationNumbers(sentClient.prixfioul, "Le coût annuel de la chaudière à fioul")
    }
    if(isSet(sentClient.pacAA) && isSet(sentClient.agepacAA)) {
        sentClient.agepacAA = validationNumbers(sentClient.agepacAA, "L'âge de la PAC AIR/AIR")
    }
    if(isSet(sentClient.pacAA) && isSet(sentClient.prixpacAA)) {
        sentClient.prixpacAA = validationNumbers(sentClient.prixpacAA, "Le coût annuel de la PAC AIR/AIR")
    }
    if(isSet(sentClient.pacAE) && isSet(sentClient.agepacAE)) {
        sentClient.agepacAE = validationNumbers(sentClient.agepacAE, "L'âge de la PAC AIR/EAU")
    }
    if(isSet(sentClient.pacAE) && isSet(sentClient.prixpacAE)) {
        sentClient.prixpacAE = validationNumbers(sentClient.prixpacAE, "Le coût annuel de la PAC AIR/EAU")
    }
    if(isSet(sentClient.autre) && isSet(sentClient.ageautre)) {
        sentClient.ageautre = validationNumbers(sentClient.ageautre, "L'âge de l'installation de type \"AUTRE\"")
    }
    if(isSet(sentClient.autre) && isSet(sentClient.prixautre)) {
        sentClient.prixautre = validationNumbers(sentClient.prixautre, "Le coût annuel de l'installation gaz")
    }
    if(isSet(sentClient.commentaire)) {
        sentClient.commentaire = validationString(sentClient.commentaire, 'Le commentaire')
    }

    return sentClient
}


module.exports = {
    validationPhone,
    validationMobilePhone,
    validationCodePostal,
    validationStringPure,
    validationString,
    validationNumbers,
    validationPositiveNumbers,
    validationInteger,
    validationPositiveInteger,    
    validationYear,
    validationDateFullFR,
    validationTime,
    validationEmail,
    validationClient
}
