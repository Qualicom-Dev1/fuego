const { Compteur, Sequelize, sequelize } = global.db
const moment = require('moment')

const COMPTEUR_DEVIS = 'COMPTEUR_DEVIS'
const COMPTEUR_FACTURES_GENERALES = 'COMPTEUR_FACTURES_GENERALES'
const COMPTEUR_FACTURES_AVOIRS = 'COMPTEUR_FACTURES_AVOIRS'

let compteurDevis = undefined
let compteurFacturesGenerales = undefined
let compteurFacturesAvoirs = undefined

const isNewYear = (lastUpdate) => {
    const currentYear = moment().format('YYYY')
    const usedYear = moment(lastUpdate).format('YYYY')

    return currentYear > usedYear
}

const init = async() => {
    compteurDevis = await Compteur.findOne({
        where : {
            nom : COMPTEUR_DEVIS
        }
    })

    compteurFacturesGenerales = await Compteur.findOne({
        where : {
            nom : COMPTEUR_FACTURES_GENERALES
        }
    })

    compteurFacturesAvoirs = await Compteur.findOne({
        where : {
            nom : COMPTEUR_FACTURES_AVOIRS
        }
    })
}

const reset = async () => {
    if(isNewYear(compteurDevis.updatedAt)) {
        compteurDevis.valeur = 0
    }
    if(isNewYear(compteurFacturesGenerales.updatedAt)) {
        compteurFacturesGenerales.valeur = 0
    }
    if(isNewYear(compteurFacturesAvoirs.updatedAt)) {
        compteurFacturesAvoirs.valeur = 0
    }

    await Promise.all([
        compteurDevis.save(),
        compteurFacturesGenerales.save(),
        compteurFacturesAvoirs.save()
    ])
}

const get = async (typeCompteur) => {
    if(compteurDevis === undefined || compteurFacturesGenerales === undefined || compteurFacturesAvoirs === undefined) {
        await init()
    }

    if(![COMPTEUR_DEVIS, COMPTEUR_FACTURES_GENERALES, COMPTEUR_FACTURES_AVOIRS].includes(typeCompteur)) {
        throw `Impossible de récupérer le compteur ${typeCompteur}.`
    }

    await reset()

    let valeur = 0

    if(typeCompteur === COMPTEUR_DEVIS) {
        await sequelize.transaction({ 
            type : Sequelize.Transaction.TYPES.EXCLUSIVE 
        }, async (transaction) => {
            await compteurDevis.increment('valeur', { transaction })
            await compteurDevis.reload({ transaction })
            valeur = compteurDevis.valeur
        })        
    }
    else if(typeCompteur === COMPTEUR_FACTURES_GENERALES) {
        await sequelize.transaction({ 
            type : Sequelize.Transaction.TYPES.EXCLUSIVE 
        }, async (transaction) => {
            await compteurFacturesGenerales.increment('valeur', { transaction })
            await compteurFacturesGenerales.reload({ transaction })
            valeur = compteurFacturesGenerales.valeur
        })        
    }
    else if(typeCompteur === COMPTEUR_FACTURES_AVOIRS) {
        await sequelize.transaction({ 
            type : Sequelize.Transaction.TYPES.EXCLUSIVE 
        }, async (transaction) => {
            await compteurFacturesAvoirs.increment('valeur', { transaction })
            await compteurFacturesAvoirs.reload({ transaction })
            valeur = compteurFacturesAvoirs.valeur
        })
    }

    return valeur
}

module.exports = {
    COMPTEUR_DEVIS,
    COMPTEUR_FACTURES_GENERALES,
    COMPTEUR_FACTURES_AVOIRS,
    get
}