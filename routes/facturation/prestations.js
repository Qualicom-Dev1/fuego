const express = require('express')
const router = express.Router()
const { Prestation, ClientBusiness, Pole, ProduitBusiness, Devis, Facture, sequelize } = global.db
const { createProduits_prestationFromList } = require('./produitsBusiness_prestations')
const { calculPrixDevis } = require('./devis')
const { Op } = require('sequelize')
const { getServiceSMS, getListeIdSMS } = require('../utils/sms')
const errorHandler = require('../utils/errorHandler')
const isSet = require('../utils/isSet')
const validations = require('../utils/validations')

const ID_PRODUIT_RDV = 1
const ID_PRODUIT_RDV_VENTE = 2
const ID_PRODUIT_SMS = 3
const ID_PRODUIT_COMPLEMENT = 4

async function checkPrestation(prestation) {
    if(!isSet(prestation)) throw "Une prestation doit être fournie."
    if(!isSet(prestation.idClient)) throw "Un client doit être lié à la prestation."
    if(!isSet(prestation.idPole)) throw "Un pôle doit être lié à la prestation"
    if(!isSet(prestation.listeProduits)) throw "Les produits de la prestation doivent être fournis."

    // vérifie que le client existe
    const client = await ClientBusiness.findOne({
        where : {
            id : prestation.idClient
        }
    })
    if(client === null) throw "Aucun client correspondant."

    // vérifie que le pôle existe
    const pole = await Pole.findOne({
        where : {
            id : prestation.idPole
        }
    })
    if(pole === null) throw "Aucun pôle correspondant."

    // vérification que la liste de produits est correcte
    for(const produit of prestation.listeProduits) {
        if(!isSet(produit.id)) throw "Un produit de la liste a été transmis sans identifiant."
        if(!isSet(produit.quantite)) throw "Un produit de la liste a été transmis sans quantité."
    }

    // vérification de l'existence de la prestation
    if(isSet(prestation.id)) {
        const prestationDB = await Prestation.findOne({
            where : {
                id : prestation.id
            }
        })
        if(prestationDB === null) throw "Aucune prestation correspondante."
    }
}

async function calculPrixPrestation(idPrestation, transaction = undefined) {
    if(!isSet(idPrestation)) throw "L'identifiant de la prestation doit être fourni."

    let prestation = undefined

    if(transaction) {
        prestation = await Prestation.findOne({
            attributes : [],
            include : ProduitBusiness,
            where : {
                id : idPrestation
            },
            transaction
        })
    }
    else {
        prestation = await Prestation.findOne({
            attributes : [],
            include : ProduitBusiness,
            where : {
                id : idPrestation
            }
        })
    }
    if(prestation === null) throw "Aucune prestation correspondante."

    if(prestation.ProduitsBusiness.length === 0) throw "La prestation ne contient aucun produit."

    let prix = 0

    // on récupère 
    // Number(Math.round((value.CA + Number.EPSILON) * 100) / 100).toFixed(2)
    for(const { ProduitBusiness_Prestation } of prestation.ProduitsBusiness) {
        prix = Number(Math.round((Number(prix) + Number(Math.round(((ProduitBusiness_Prestation.quantite * ProduitBusiness_Prestation.prixUnitaire) + Number.EPSILON) * 100) / 100) + Number.EPSILON) * 100) / 100)
    }

    prix = Number(prix).toFixed(2)

    return prix
}

async function calculResteAPayerPrestation(idPrestation) {
    if(!isSet(idPrestation)) throw "L'identifiant de la prestation doit être fourni."

    const prixPrestation = await calculPrixPrestation(idPrestation)
    let resteAPayer = Number(prixPrestation)

    // récupération des factures de cette prestation
    const factures = await Facture.findAll({
        where : {
            idPrestation,
            isCanceled : false,
            datePaiement : null,
            type : {
                [Op.not] : 'avoir'
            }
        }
    })
    if(factures === null) throw "Une erreur est survenue lors de la récupération des factures de la prestation pour calculer les prix."

    let total = 0
    if(factures.length !== 0) {
        total = factures.reduce((accumulator, facture) => Number(Math.round(((Number(accumulator) + Number(facture.prixHT)) + Number.EPSILON) * 100) / 100), 0)
    }

    resteAPayer = Number(Math.round(((resteAPayer - total) + Number.EPSILON) * 100) / 100)

    resteAPayer = Number(resteAPayer).toFixed(2)

    return resteAPayer
}

router
// accueil
.get('/', async (req, res) => {
    res.send('ok')
})
// récupère toutes les prestations
.get('/all', async (req, res) => {
    let infos = undefined
    let prestations = undefined

    try {
        prestations = await Prestation.findAll({
            attributes : ['id', 'createdAt'],
            include : [
                { model : ClientBusiness },
                { 
                    model : Pole,
                    attributes : ['id', 'nom']
                },
                { model : ProduitBusiness }
            ],
            order : [['createdAt', 'DESC']]
        })

        if(prestations === null) throw "Une erreur est survenue lors de la récupération des prestations."

        if(prestations.length === 0) {
            prestations = undefined
            infos = errorHandler(undefined, "Aucune prestation.")
        }
    }
    catch(error) {
        prestations = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        prestations
    })
})
// récupère toutes les prestations d'un client
.get('/all/:IdClient', async (req, res) => {
    const IdClient = Number(req.params.IdClient)

    let infos = undefined
    let prestations = undefined

    try {
        if(isNaN(IdClient)) throw "L'identifiant client est incorrect."

        const client = await ClientBusiness.findOne({            
            where : {
                id : IdClient
            }
        })

        if(client === null) throw "Aucun client correspondant."

        prestations = await Prestation.findAll({
            attributes : ['id', 'createdAt'],
            include : [
                { model : ClientBusiness },
                { 
                    model : Pole,
                    attributes : ['id', 'nom']
                },
                { model : ProduitBusiness }
            ],
            where : {
                idClient : client.id
            },
            order : [['createdAt', 'DESC']]
        })

        if(prestations === null) throw "Une erreur est survenue lors de la récupértion des prestations."
        if(prestations.length === 0) {
            prestations = undefined
            infos = errorHandler(undefined, "Aucune prestation pour ce client.")
        }
    }
    catch(error) {
        prestations = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        prestations
    })
})
// génère la prestation TMK pour les dates données
.get('/generate-auto', async (req, res) => {
    let dateDebut = req.query.dateDebut
    let dateFin = req.query.dateFin

    let infos = undefined
    let prestation = undefined

    try {
        validations.validationDateFullFR(dateDebut, "La date de début")
        validations.validationDateFullFR(dateFin, "La date de fin")

        dateDebut = moment(dateDebut, 'DD/MM/YYYY').format('YYYY-MM-DD')
        dateFin = moment(dateFin, 'DD/MM/YYYY').format('YYYY-MM-DD')

        // récupération du nombre de sms envoyés
        const service_sms = await getServiceSMS()
        if(service_sms === null || service_sms.length === 0) throw 'Aucun service sms disponible.'
        const listeIdSMS = await getListeIdSMS(service_sms, 'outgoing', dateDebut, dateFin)
        const countSMS = listeIdSMS.length

        // récupération du nombre de rdvs sans vente, et du nombre de rdvs avec vente
        // formatage de la date pour prendre en compte dateDebut <= rdvs <= dateFin
        dateDebut += ' 00:00:00'
        dateFin += ' 23:59:59'

        const Id_STATUT_CONFIRME = 1
        const ID_ETAT_VENTE = 1
        const ID_ETAT_DEMSUIVI = 2
        const ID_ETAT_DEMRAF = 3
        const ID_ETAT_DECOUVERTE = 8
        const ID_ETAT_DEVIS = 9

        // la recherche avec le mail utilisateur en @qualicom.fr est pour être sûr que ça soit le TMK Qualicom qui a pris le rdv puisque St Cloud utilise également le TMK Qualicom
        const [queryRDVs, queryVentes, queryComplement, produitRDV, produitVente, produitSMS, produitComplement, poleMarketing] = await Promise.all([
            sequelize.query(`
                SELECT COUNT(*) AS nbRDVs  
                FROM RDVs JOIN Historiques ON RDVs.id = Historiques.idRdv
                JOIN Users ON Historiques.idUser = Users.id
                WHERE idEtat IN (${ID_ETAT_DEMSUIVI},${ID_ETAT_DEMRAF},${ID_ETAT_DECOUVERTE},${ID_ETAT_DEVIS}) 
                AND date BETWEEN '${dateDebut}' AND '${dateFin}' 
                AND statut = ${Id_STATUT_CONFIRME} 
                AND facturation IS NULL 
                AND UPPER(source) NOT LIKE '%PERSO%' 
                AND Users.mail LIKE '%@qualicom-conseil.fr'
            `, {
                type : sequelize.QueryTypes.SELECT
            }),
            sequelize.query(`
                SELECT COUNT(*) AS nbRDVs  
                FROM RDVs JOIN Historiques ON RDVs.id = Historiques.idRdv
                JOIN Users ON Historiques.idUser = Users.id
                WHERE idEtat = ${ID_ETAT_VENTE}
                AND date BETWEEN '${dateDebut}' AND '${dateFin}' 
                AND statut = ${Id_STATUT_CONFIRME} 
                AND facturation IS NULL 
                AND UPPER(source) NOT LIKE '%PERSO%' 
                AND Users.mail LIKE '%@qualicom-conseil.fr'
            `, {
                type : sequelize.QueryTypes.SELECT
            }),
            sequelize.query(`
                SELECT IF(clients.civil1 IS NULL, CONCAT('M. ', Clients.nom), CONCAT(clients.civil1, '. ', Clients.nom)) AS nom, DATE_FORMAT(rdvs.date, '%d/%m/%Y') AS dateRDV
                FROM RDVs JOIN Clients ON rdvs.idClient = Clients.id
                JOIN Historiques ON RDVs.id = Historiques.idRdv
                JOIN Users ON Historiques.idUser = Users.id
                WHERE idEtat = ${ID_ETAT_VENTE}
                AND date < '${dateDebut}'
                AND statut = ${Id_STATUT_CONFIRME}
                AND facturation IS NULL 
                AND UPPER(rdvs.source) NOT LIKE '%PERSO%' 
                AND Users.mail LIKE '%@qualicom-conseil.fr'
            `, {
                type : sequelize.QueryTypes.SELECT
            }),
            ProduitBusiness.findOne({
                where : {
                    id : ID_PRODUIT_RDV
                }
            }),
            ProduitBusiness.findOne({
                where : {
                    id : ID_PRODUIT_RDV_VENTE
                }
            }),
            ProduitBusiness.findOne({
                where : {
                    id : ID_PRODUIT_SMS
                }
            }),
            ProduitBusiness.findOne({
                where : {
                    id : ID_PRODUIT_COMPLEMENT
                }
            }),
            Pole.findOne({
                attributes : ['id', 'nom'],
                where : {
                    nom : 'MARKETING DIRECT'
                }
            })
        ])
        if(queryRDVs === null || queryRDVs.length === 0) throw "Une erreur est survenue lors de la récupération du nombre de RDVs qualifiés."
        if(queryVentes === null || queryVentes.length === 0) throw "Une erreur est survenue lors de la récupération du nombre de RDVs qualifiés aboutissants sur une vente."
        if(queryComplement === null) throw "Une erreur est survenue lors de la récupération des ventes en complément."
        if(produitRDV === null) throw "Une erreur est survenue lors de la récupération du produit RDVs qualifiés."
        if(produitVente === null) throw "Une erreur est survenue lors de la récupération du produit RDVs qualifiés avec vente."
        if(produitSMS === null) throw "Une erreur est survenue lors de la récupération du produit SMS de confirmation."
        if(produitComplement === null) throw "Une erreur est survenue lors de la récupération du produit Vente sur RDV."
        if(poleMarketing === null) throw "Une erreur est survenue lors de la récupération du pôle MARKETING DIRECT."

        const countRDVs = queryRDVs[0].nbRDVs
        const countRDVsVentes = queryVentes[0].nbRDVs       

        prestation = {
            listeProduits : [
                {
                    id : produitRDV.id,
                    prixUnitaire : produitRDV.prixUnitaire,
                    designation : produitRDV.designation,
                    quantite : countRDVs
                },
                {
                    id : produitVente.id,
                    prixUnitaire : produitVente.prixUnitaire,
                    designation : produitVente.designation,
                    quantite : countRDVsVentes
                },
                {
                    id : produitSMS.id,
                    prixUnitaire : produitSMS.prixUnitaire,
                    designation : produitSMS.designation,
                    quantite : countSMS
                }
            ],
            Pole : poleMarketing
        }

        // ajout des compléments
        if(queryComplement.length > 0) {
            prestation.listeProduits.push({
                id : produitComplement.id,
                prixUnitaire : produitComplement.prixUnitaire,
                designation : produitComplement.designation,
                quantite : queryComplement.length
            })

            prestation.complements = queryComplement
        }
    }
    catch(error) {
        prestation = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        prestation
    })
})
// récupère une prestation
.get('/:IdPrestation', async (req, res) => {
    const IdPrestation = Number(req.params.IdPrestation)

    let infos = undefined
    let prestation = undefined

    try {
        if(isNaN(IdPrestation)) throw "Identifiant incorrect."

        prestation = await Prestation.findOne({
            attributes : ['id', 'createdAt'],
            include : [
                { model : ClientBusiness },
                { 
                    model : Pole,
                    attributes : ['id', 'nom']
                },
                { model : ProduitBusiness }
            ],
            where : {
                id : IdPrestation
            }
        })

        if(prestation === null) throw "Aucune prestation correspondante."
    }
    catch(error) {
        prestation = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        prestation
    })
})
// crée une prestation
.post('', async (req, res) => {
    const prestationSent = req.body

    let infos = undefined
    let prestation = undefined

    try {
        await checkPrestation(prestationSent)

        prestation = await Prestation.create(prestationSent)

        if(prestation === null) throw "Une erreur est survenue lors de la création de la prestation."

        await createProduits_prestationFromList(prestation.id, prestationSent.listeProduits)

        prestation = await Prestation.findOne({
            attributes : ['id', 'createdAt'],
            include : [
                { model : ClientBusiness },
                { 
                    model : Pole,
                    attributes : ['id', 'nom']
                },
                { model : ProduitBusiness }
            ],
            where : {
                id : prestation.id
            }
        })

        if(prestation === null) throw "Une erreur est survenue lors de la récupération de la prestation nouvellement créée."

        infos = errorHandler(undefined, "La prestation a bien été créée.")
    }
    catch(error) {
        if(typeof prestation === "object") await prestation.destroy()

        prestation = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        prestation
    })
})
.patch('/:IdPrestation', async (req, res) => {
    const IdPrestation = Number(req.params.IdPrestation)
    const prestationSent = req.body

    let infos = undefined
    let prestation = undefined

    try {
        if(isNaN(IdPrestation)) throw "Identifiant incorrect."

        prestationSent.id = IdPrestation
        await checkPrestation(prestationSent)

        prestation = await Prestation.findOne({
            where : {
                id : IdPrestation
            }
        })

        if(prestation === null) throw "Aucune prestation correspondante."

        // vérifie que la prestation n'est pas utilisée
        const facture = await Facture.findOne({
            where : {
                idPrestation : IdPrestation,
                isCanceled : false
            }
        })
        if(facture !== null) throw "La prestation est utilisée, elle ne peut être modifiée."

        // système de transaction pour annuler la modification de la prestation, des produitsBusinness_Prestations et des devis impactés
        await sequelize.transaction(async transaction => {
            await createProduits_prestationFromList(prestation.id, prestationSent.listeProduits, transaction)

            prestation.idClient = prestationSent.idClient
            prestation.idPole = prestationSent.idPole

            await prestation.save({ transaction })

            // màj des devis utilisant cette prestation
            const listeDevis = await Devis.findAll({
                where : {
                    idPrestation : prestation.id,
                    isCanceled : false
                }
            })
            if(listeDevis === null) throw Error("****customError****Une erreur est survenue lors de la récupération des devis associés à la prestation pour répercuter les changements.")

            if(listeDevis.length > 0) {
                try {
                    for(const devis of listeDevis) {
                        const prix = await calculPrixDevis(devis, transaction)

                        if(prix.prixHT <= 0) throw Error(`****customError****Le prix recalculé du devis ${devis.refDevis} est incorrect.`)
                        
                        devis.prixHT = prix.prixHT
                        devis.prixTTC = prix.prixTTC

                        await devis.save({ transaction })
                    }
                }
                catch(error) {
                    // erreur custom
                    if(error.message && error.message.startsWith('****customError****')) throw error

                    // erreur imprévue
                    errorHandler(error)
                    throw Error("****customError****Une erreur est survenue lors de la mise à jour des prix des devis associés à la prestation.")
                }
            }
        })

        prestation = await Prestation.findOne({
            attributes : ['id', 'createdAt'],
            include : [
                { model : ClientBusiness },
                { 
                    model : Pole,
                    attributes : ['id', 'nom']
                },
                { model : ProduitBusiness }
            ],
            where : {
                id : prestation.id
            }
        })

        if(prestation === null) throw "Une erreur est survenue lors de la récupéraion de la prestation suite à sa modification."

        infos = errorHandler(undefined, "La prestation a bien été modifiée.")
    }
    catch(error) {
        prestation = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        prestation
    })
})
.delete('/:IdPrestation', async (req, res) => {
    const IdPrestation = Number(req.params.IdPrestation)

    let infos = undefined
    let prestation = undefined

    try {
        if(isNaN(IdPrestation)) throw "Identifiant incorrect."

        prestation = await Prestation.findOne({
            attributes : ['id', 'createdAt'],
            include : [
                { model : ClientBusiness },
                { 
                    model : Pole,
                    attributes : ['id', 'nom']
                },
                { model : ProduitBusiness }
            ],
            where : {
                id : IdPrestation
            }
        })

        if(prestation === null) throw "Aucune prestation correspondante."

        // la prestation ne peut être supprimée que si aucune facture ne l'utilise pour garder une traçabilitée
        const facture = await Facture.findOne({
            where : {
                idPrestation : IdPrestation
            }
        })

        if(facture !== null) throw "La prestation est utilisée, elle ne peut être supprimée."

        // les devis associés sont supprimés par le onDelete cascade de MySQL
        await prestation.destroy()

        infos = errorHandler(undefined, "La prestation a bien été supprimée.")
    }
    catch(error) {
        prestation = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        prestation
    })
})

module.exports = {
    router,
    calculPrixPrestation,
    calculResteAPayerPrestation
}