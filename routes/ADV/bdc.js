const express = require('express')
const router = express.Router()
const models = global.db
const { 
    ADV_produit, Structure, ADV_categorie, 
    ADV_BDC, ADV_BDC_client, ADV_BDC_client_ficheRenseignementsTechniques, ADV_BDC_infoPaiement, ADV_BDC_ficheAcceptation, ADV_BDC_produit, ADV_BDC_categorie,
    RDV, Etat, User,
    Compteur, Sequelize, sequelize
} = models
const { checkClient, create_BDC_client } = require('./bdc_clients')
const { create_BDC_categorie } = require('./bdc_categories')
const { checkListeProduits, checkObservations, create_BDC_listeProduits } = require ('./bdc_produits')
const { checkInfosPaiementSent, checkInfosPaiement, create_BDC_infosPaiement } = require('./bdc_infoPaiements')
const { checkFicheAcceptation, createFicheAcceptation } = require('./bdc_ficheAcceptations')
const moment = require('moment')
const { Op } = require('sequelize')
const errorHandler = require('../utils/errorHandler')
const isSet = require('../utils/isSet')
const validations = require('../utils/validations')
const { v4 : uuidv4 } = require('uuid')
const axios = require('axios').default
const { readFileSync, unlink, access, F_OK } = require('fs')
const UniversignAPI = require('../utils/universign-api')
const ejs = require('ejs')
const { sendMail, TYPEMAIL } = require('../utils/email')

function checkDatesPose({ datePose, dateLimitePose }) {
    validations.validationDateFullFR(datePose, 'La date de pose souhaitée')
    validations.validationDateFullFR(dateLimitePose, 'La date limite de pose')

    if(moment(dateLimitePose, 'DD/MM/YYYY').isSameOrBefore(moment(datePose, 'DD/MM/YYYY'), 'day')) throw "La date de limite de pose doit être ultérieur à la date de pose souhaitée."

    return {
        datePose,
        dateLimitePose
    }
}

async function checkBDC(bdc, user) {
    if(!isSet(bdc)) throw "Un bon de commande doit être transmis." 
    
    if(isSet(bdc.idVente)) {
        const Id_Vente = Number(bdc.idVente)
        if(isNaN(Id_Vente)) throw "L'identifiant de la vente associée n'est pas reconnu."
        const vente = await RDV.findOne({
            where : {
                id : bdc.idVente
            }
        })
        if(vente === null) throw "Aucune vente ne correspondant à la vente associée au bon de commande."
        if(vente.idBDC !== null) throw "Un bon de commande a déjà été établi pour cette vente."

        bdc.idVente = Id_Vente
    }

    let pose = undefined;
    // attends que la première vague de validations, bloquantes pour la suite, se termine
    [bdc.client, bdc.listeProduits, pose, bdc.observations] = await Promise.all([
        // vérifie les infos clients et la fiche d'infos techniques
        checkClient(bdc.client),
        // vérifie la commande et récupère les produits et catégories nécessaires
        checkListeProduits(bdc.listeProduits),
        // vérifie les dates de pose et de limite de pose
        checkDatesPose(bdc),        
        // vérifie les observations
        checkObservations(bdc.observations)
    ])    
    
    // affecte les dates de pose vérifiées
    bdc.datePose = pose.datePose
    bdc.dateLimitePose = pose.dateLimitePose

    // calcule le prix du BDC à partir de la liste obtenue
    bdc = await calculePrixBDC(bdc);
    
    [bdc.infosPaiement, bdc.ficheAcceptation] = await Promise.all([
        // vérifie les informations de paiement
        checkInfosPaiementSent(bdc),
        // vérifie la fiche d'acceptation
        checkFicheAcceptation(bdc, user)
    ])

    // ajoute les infos du vendeur et de la structure
    bdc.idVendeur = user.id
    bdc.idStructure = user.Structures[0].id

    return bdc
}

async function calculePrixBDC(bdc) {
    let prixHT = 0
    let prixTTC = 0
    let listeTauxTVA = []
    
    const listeProduits = await checkListeProduits(bdc.listeProduits)
    for(const produit of listeProduits) {
        // const prixTotalHTProduit = produit.prixUnitaireHT * produit.quantite
        // const prixTotalTTCProduit = produit.prixUnitaireTTC * produit.quantite
        const prixTotalHTProduit = Number(produit.prixHT)
        const prixTotalTTCProduit = Number(produit.prixTTC)

        const addTVA = (tauxTVA, totalHT, totalTTC) => {
            // recherche si un index est déjà créé pour ce taux de TVA
            const indexTauxTVA = listeTauxTVA.find(elt => elt.tauxTVA === tauxTVA)

            // si l'index existe on vient ajouter le prix du produit
            if(indexTauxTVA) {
                indexTauxTVA.prixHT += totalHT
                indexTauxTVA.prixTTC += totalTTC
            }
            // sinon on le crée
            else {
                listeTauxTVA.push({
                    tauxTVA : tauxTVA,
                    prixHT : totalHT,
                    prixTTC : totalTTC
                })
            }
        }

        if(produit.isGroupe) {
            // parcours de la liste des sous produits pour avoir le taux de TVA et la somme des montants associés
            for(const sousProduit of produit.listeProduits) {
                const prixHTSousProduit = Number(sousProduit.prixHT)
                const prixTTCSousProduit = Number(sousProduit.prixTTC)

                // on multiplie le montant du sous produit par la quantité de produit(s) dans laquelle il est contenu
                const prixTotalHTSousProduit = prixHTSousProduit * produit.quantite
                const prixTotalTTCSousProduit = prixTTCSousProduit * produit.quantite

                addTVA(sousProduit.tauxTVA, prixTotalHTSousProduit, prixTotalTTCSousProduit)
            }
        }
        else {
            addTVA(produit.tauxTVA, prixTotalHTProduit, prixTotalTTCProduit)
        }

        // on ajoute le prix du produit au prix total
        prixHT += prixTotalHTProduit
        prixTTC += prixTotalTTCProduit
    }
    
    listeTauxTVA.sort((a, b) => a.tauxTVA - b.tauxTVA)
    listeTauxTVA.forEach(taux => {
        taux.prixHT = Number(taux.prixHT).toFixed(2)
        taux.prixTTC = Number(taux.prixTTC).toFixed(2)
    })

    bdc.montantTVA = Number(prixTTC - prixHT).toFixed(2)
    bdc.prixHT = Number(prixHT).toFixed(2)
    bdc.prixTTC = Number(prixTTC).toFixed(2)    
    bdc.listeTauxTVA = listeTauxTVA

    return bdc
}

// créé la liste des catégories du BDC à partir d'une liste de produits
// ainsi que complète le tableau de correspondances avec l'idADV_categorie et l'idADV_BDC_categorie afin de pouvoir faire correspondre ensuite les nouvelles catégories aux produits
// la fonction est récursive, donc si un groupement de produits elle s'appellera sur les sous produits
async function createListeCategoriesBDC(listeProduits, transaction = null, tableauCorrespondancesCategories = []) {
    if(!isSet(listeProduits)) throw "Une liste de produits doit être transmise."

    // parcours de la liste de produits
    for(let i = 0; i < listeProduits.length; i++) {
        // on initialise la liste des ids catégorie copiées auquelles le produit sera lié
        listeProduits[i].listeIdsADV_BDC_categorie = []

        // on parcours la liste des catégories du produit
        if(listeProduits[i].produitRef.categories && listeProduits[i].produitRef.categories.length) {
            for(const categorie of listeProduits[i].produitRef.categories) {
                const correspondanceFound = tableauCorrespondancesCategories.find(elt => elt.idADV_categorie === categorie.id)

                // on regarde si la catégorie existe déjà dans le tableau de correspondances, et si elle n'y est pas on crée la catégorie
                if(!correspondanceFound) {
                    const bdc_categorie = await create_BDC_categorie({ nom : categorie.nom, idADV_categorie : categorie.id }, transaction)
                    if(bdc_categorie === null) throw `Une erreur s'est produite en créant la catégorie rattachée : ${categorie.nom}`

                    // ajout de la nouvelle catégorie dans le tableau de correspondances
                    tableauCorrespondancesCategories.push({ idADV_categorie : categorie.id, idADV_BDC_categorie : bdc_categorie.id })
                    // ajout de la nouvelle catégorie à la liste d'IDs catégorie du produit
                    listeProduits[i].listeIdsADV_BDC_categorie.push(bdc_categorie.id)
                }
                else {
                    // ajout de la catégorie à la liste d'IDs catégorie du produit si elle n'est pas déjà présente dans la liste
                    if(!listeProduits[i].listeIdsADV_BDC_categorie.find(id => id === correspondanceFound.idADV_BDC_categorie)) listeProduits[i].listeIdsADV_BDC_categorie.push(correspondanceFound.idADV_BDC_categorie)                    
                }
            }
        }

        if(listeProduits[i].isGroupe) {
            // on appelle récursivement la fonction sur la liste de sous produit pour ajouter les catégories manquantes
            // et que les sous produits connaissent leur liste d'IDs catégorie
            const resSousProduits = await createListeCategoriesBDC(listeProduits[i].listeProduits, transaction, tableauCorrespondancesCategories)
            
            // affectation de la liste de produits renvoyée où les produits ont en plus leur liste d'IDs catégorie
            listeProduits[i].listeProduits = resSousProduits.listeProduits
            // affectation du tableau de correspondance pour qu'il récupère les éléments qui lui ont été ajouté avec les sous produits
            tableauCorrespondancesCategories = resSousProduits.tableauCorrespondancesCategories
        }
    }

    return {
        listeProduits,
        tableauCorrespondancesCategories
    }
}

// retourne un bon de commande complet et formaté
async function getFormatedBDC(Id_BDC, transaction = null) {
    let bdc = await ADV_BDC.findOne({
        include : [
            { 
                model : ADV_BDC_client,
                as : 'client',
                attributes : {
                    exclude : ['idClientFicheRenseignementsTechniques', 'clefSignature']
                },
                include : { 
                    model : ADV_BDC_client_ficheRenseignementsTechniques,
                    as : 'ficheRenseignementsTechniques'
                }
            },
            {
                model : User,
                as : 'vendeur',
                attributes : ['id', 'nom', 'prenom']
            },
            {
                model : ADV_BDC_infoPaiement ,
                as : 'infosPaiement',
                attributes : {
                    exclude : ['idADV_BDC_client']
                }
            },
            {
                model : ADV_BDC_ficheAcceptation,
                as : 'ficheAcceptation'
            },
            {
                model : ADV_BDC_produit,
                as : 'listeProduits',
                through : {
                    attributes : ['quantite', 'prixHT', 'prixTTC']
                },
                include : [
                    { 
                        model : ADV_BDC_categorie,
                        as : 'categories',
                        through : {
                            attributes : []
                        }
                    },
                    {
                        model : ADV_BDC_produit,
                        as : 'produits',
                        through : {
                            attributes : ['quantite', 'prixUnitaireHTApplique', 'prixUnitaireTTCApplique', 'prixHT', 'prixTTC']
                        },
                        include : { 
                            model : ADV_BDC_categorie,
                            as : 'categories',
                            through : {
                                attributes : []
                            }
                        },
                    }
                ]
            }            
        ],
        attributes : {
            exclude : ['idADV_BDC_client', 'idVendeur', 'idADV_BDC_infoPaiement', 'idADV_BDC_ficheAcceptation']
        },
        where : {
            id : Id_BDC
        },
        transaction
    })
    if(bdc === null) throw "Une erreur est survenue lors de la récupération du bon de commande."

    bdc = bdc.get({ plain : true })

    // parcours les produits
    for(let i = 0; i < bdc.listeProduits.length; i++) {
        // passage de la quantite et des prox totaux dans l'objet produit
        bdc.listeProduits[i].quantite = bdc.listeProduits[i].ADV_BDC_BDCListeProduits.quantite
        bdc.listeProduits[i].prixHT = bdc.listeProduits[i].ADV_BDC_BDCListeProduits.prixHT
        bdc.listeProduits[i].prixTTC = bdc.listeProduits[i].ADV_BDC_BDCListeProduits.prixTTC
        // puis désaffecte ADV_BDC_BDCListeProduits
        bdc.listeProduits[i].ADV_BDC_BDCListeProduits = undefined

        if(bdc.listeProduits[i].isGroupe) {
            // parcours les sousProduits du groupe
            for(let j = 0; j < bdc.listeProduits[i].produits.length; j++) {
                // passage de la quantite et des différents prix dans l'objet sous produit
                bdc.listeProduits[i].produits[j].quantite = bdc.listeProduits[i].produits[j].ADV_BDC_produitListeProduits.quantite
                bdc.listeProduits[i].produits[j].prixUnitaireHTApplique = bdc.listeProduits[i].produits[j].ADV_BDC_produitListeProduits.prixUnitaireHTApplique
                bdc.listeProduits[i].produits[j].prixUnitaireTTCApplique = bdc.listeProduits[i].produits[j].ADV_BDC_produitListeProduits.prixUnitaireTTCApplique
                bdc.listeProduits[i].produits[j].prixHT = bdc.listeProduits[i].produits[j].ADV_BDC_produitListeProduits.prixHT
                bdc.listeProduits[i].produits[j].prixTTC = bdc.listeProduits[i].produits[j].ADV_BDC_produitListeProduits.prixTTC
                // puis désaffecte ADV_BDC_produitListeProduits
                bdc.listeProduits[i].produits[j].ADV_BDC_produitListeProduits = undefined
            }

            // passe la liste de produits "produits" en "listeProduits"
            bdc.listeProduits[i].listeProduits = bdc.listeProduits[i].produits
            bdc.listeProduits[i].produits = undefined
        }
        else {
            // désaffecte la liste de produits puisque ce n'est pas un groupement
            bdc.listeProduits[i].produits = undefined
        }
    }

    bdc = await calculePrixBDC(bdc)

    return bdc
}

// retourne un BDC selon son id formaté ou simple (infos génrales pas le contenu)
async function getOne(Id_BDC, user, formated = false, transaction = null) {
    let infos = undefined
    let bdc = undefined

    try {
        bdc = await ADV_BDC.findOne({
            where : {
                id : Id_BDC,
                idStructure : {
                    [Op.in] : user.Structures.map(structure => structure.id)
                }
            },
            transaction
        })
        if(bdc === null) throw "Aucun bon de commande correspondant."

        if(formated) {
            bdc = await getFormatedBDC(bdc.id, transaction)
        }
    }
    catch(error) {
        bdc = undefined
        infos = errorHandler(error)
    }

    return {
        infos,
        bdc
    }
}

// retourne la liste des BDCs formatés ou simples (infos génrales pas le contenu)
async function getAll(formated = false, user) {
    let infos = undefined
    let listeBDCs = undefined

    try {
        listeBDCs = await ADV_BDC.findAll({
            where : {
                idStructure : {
                    [Op.in] : user.Structures.map(structure => structure.id)
                }
            }
        })
        if(listeBDCs === null) throw "Une erreur est survenue lors de la récupération de la liste des bons de commande."

        if(formated) {
            listeBDCs = await Promise.all(listeBDCs.map(bdc => getFormatedBDC(bdc.id)))
        }
    }
    catch(error) {
        listeBDCs = undefined
        infos = errorHandler(infos)
    }

    return({
        infos,
        listeBDCs
    })
}

async function generatePDF(Id_BDC, uuid, user, transaction = null) {
    const data = await getOne(Id_BDC, user, true, transaction)
    if(data.infos && data.infos.error) throw data.infos.error    

    const BASE_URL = process.env.BASE_URL
    const responseGenerationPDF = await axios({
        method : 'POST',
        url : `${BASE_URL}/pdf/generateBDC/${uuid}`,
        data : data.bdc,
        responseType : 'json'
    })

    if(responseGenerationPDF.status !== 200) throw "Une erreur est survenue, veuillez recommencer."
    if(responseGenerationPDF.data.infos && responseGenerationPDF.data.infos.error) throw responseGenerationPDF.data.infos.error

    return {
        pdf : `/pdf/BDC/${uuid}.pdf`,
        bdc : data.bdc
    }
}

router
.get('', (req, res) => {
    res.redirect('./dashboard')
})
// accède à la page des bons de commande
.get('/dashboard', async (req, res) => {
    res.render('ADV/bdc_dashboard', { 
        extractStyles: true, 
        title: 'ADV BDC | FUEGO', 
        session: req.session.client, 
        options_top_bar: 'adv'
    });
})
// récupère la liste des BDCs d'une structure
.get('/all', async (req, res) => {
    let infos = undefined
    let listeBDCs = undefined

    try {
        listeBDCs = await ADV_BDC.findAll({
            attributes : ['id', 'ref', 'isValidated', 'isCanceled', 'prixTTC'],
            include : [
                {
                    model : ADV_BDC_client,
                    as : 'client',
                    attributes : ['id', 'nom1', 'prenom1', 'nom2', 'prenom2', 'cp', 'ville']
                },
                {
                    model : User,
                    as : 'vendeur',
                    attributes : ['id', 'nom', 'prenom']
                },
                {
                    model : ADV_BDC_ficheAcceptation,
                    as : 'ficheAcceptation',
                    attributes : ['date']
                }
            ],
            where : {
                idStructure : {
                    [Op.in] : req.session.client.Structures.map(structure => structure.id)
                }
            }
        })
        if(listeBDCs === null) throw "Une erreur est survenue lors de la récupération de la liste des bons de commande."
    }
    catch(error) {
        listeBDCs = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        listeBDCs
    })
})
// accède à la page de création d'un bon de commande
.get('/create/?:Id_Vente', async (req, res) => {
    let infos = undefined
    let vente = undefined

    // si Id_Vente === 'new' on ne part pas d'un rdv et d'un client existant mais bien de zéro
    if(isSet(req.params.Id_Vente) && req.params.Id_Vente !== 'new') {
        try {
            const Id_Vente = Number(req.params.Id_Vente)
            if(isNaN(Id_Vente)) throw "L'identifiant de la vente est incorrect."
            
            // récupère les ids des vendeurs dépendants s'il y en a
            const idsDependances = req.session.client.Usersdependences.map(dependance => dependance.idUserInf)
            idsDependances.push(req.session.client.id)

            vente = await RDV.findOne({
                attributes : ['id', 'idClient'],
                include : [
                    {
                        // VENTE
                        model : Etat,
                        attributes : [],
                        where : {
                            nom : 'VENTE'
                        }
                    }
                ],
                where : {
                    id : Id_Vente,
                    idVendeur : {
                        [Op.in] : idsDependances
                    },
                }
            })
            if(vente === null) throw "Aucune vente correspondante."
            if(vente.idBDC && vente.idBDC !== null) throw "Un bon de commande a déjà été établi pour cette vente."
        }
        catch(error) {
            infos = errorHandler(error)
        }
    }

    res.render('ADV/bdc_creation', { 
        extractStyles: true, 
        title: 'ADV BDC | FUEGO', 
        session: req.session.client, 
        options_top_bar: 'adv',
        infos,
        vente
    });
})
// routes pour les callbacks automatiques universign 
// donnant l'évolution d'une transaction à chauqe étape
// ou appelé par exemple lorsqu'une transaction va expirer et qu'universign prévient
.get('/signature/info/callback', async (req, res) => {
    // • id : L'id unique de la transaction
    // • Signataire : L’index du signataire en cours sur la transaction. Cet index commence à 0.
    // • statut : Le statut de la transaction, ce statut peut prendre les valeurs suivantes :
    //     o 0 : prêt (en attente du prochain signataire),
    //     o 1 : expiré (collecte créée mais non terminée après 14 jours),
    //     o 2 : session complétée terminée (tous les signataires ont signé),
    //     o 3 : annulation de la session par un signataire,
    //     o 4 : échec (technique) de la session de signature,
    //     o 5 : en attente de validation par l’autorité d’inscription d’Universign (les signataires ont
    //     signé mais les pièces d’identité sont en cours de vérification afin d’établir une identité
    //     numérique)

    console.log('/signature/callback')
    console.log(JSON.stringify(req.query))

    res.status(200).send()
})
// récupère un bon de commande
.get('/:Id_BDC', async (req, res) => {
    const Id_BDC = Number(req.params.Id_BDC)

    let infos = undefined
    let bdc = undefined

    try {
        if(isNaN(Id_BDC)) throw "L'identifiant du bon de commande est incorrect."

        const isFormated = (req.query.formated && !!Number(req.query.formated))

        const data = await getOne(Id_BDC, req.session.client, isFormated)
        
        infos = data.infos
        bdc = data.bdc
    }
    catch(error) {
        bdc = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        bdc
    })
})
// callback lorsque la signature s'est bien déroulée
// doit prendre en compte que le bdc est signé, mais aussi avertir l'utilisateur
.get('/:Id_BDC/signature/success', async (req, res) => {
    const Id_BDC = Number(req.params.Id_BDC)

    let infos = undefined
    let url = undefined
    const titre = "Succès signature"

    try {
        if(isNaN(Id_BDC)) throw "Identifiant du bon de commande incorrect."

        const bdc = await ADV_BDC.findOne({
            where : {
                id : Id_BDC
            }
        })
        if(bdc === null) throw "Aucun bon de commande correspondant."

        // status : canceled ready signed completed waiting
        const universignAPI = new UniversignAPI('remi@qualicom-conseil.fr', 'Qualicom1@universign')
        const transactionInfo = await universignAPI.getTransactionInfoByCustomId(bdc.idTransactionUniversign)

        // vérifier si la transaction a été signée à distance par une personne ou en présentiel et donc qu'elle est terminée
        // cas où la transaction est terminée et signée
        if(transactionInfo.status === "completed") {
            bdc.isValidated = true
            await bdc.save()

            url = `/adv/bdc/${bdc.id}/pdf`
            infos = errorHandler(undefined, `Le bon de commande n°${bdc.ref} a bien été signé, vous allez recevoir une copie dans votre boite email et vous pouvez le récupèrer dès à présent en suivant ce lien : `)
        }
        else {
            infos = errorHandler(undefined, `Merci d'avoir signé le bon de commande n°${bdc.ref}, une copie vous sera transmise par email dès que tous les signataires auront signé.`)
        }
    }
    catch(error) {
        infos = errorHandler(error)
        url = undefined
    }

    res.render('ADV/bdc_signature_callbacks', {
        extractStyles: true, 
        title: 'Signature', 
        session: req.session.client, 
        options_top_bar: 'adv',
        infos,
        titre,
        url
    })
})
// callback lorsque la signature a été annulée
// doit prendre en compte que le bdc est annulé, mais aussi avertir l'utilisateur
.get('/:Id_BDC/signature/cancel', async (req, res) => {
    const Id_BDC = Number(req.params.Id_BDC)

    let infos = undefined
    const titre = "Annulation signature"

    try {
        if(isNaN(Id_BDC)) throw "Identifiant du bon de commande incorrect."

        const bdc = await ADV_BDC.findOne({
            where : {
                id : Id_BDC
            }
        })
        if(bdc === null) throw "Aucun bon de commande correspondant."

        await sequelize.transaction(async transaction => {
            bdc.isCanceled = true
            await bdc.save({ transaction })

            const vente = await RDV.findOne({
                where : {
                    idBDC : bdc.id
                }
            })
            if(vente !== null) {
                vente.idBDC = null
                await vente.save({ transaction })
            }
        })
        
        infos = errorHandler(undefined, `Le bon de commande n°${bdc.ref} a bien été annulé.`)
    }
    catch(error) {
        infos = errorHandler(error)
    }

    res.render('ADV/bdc_signature_callbacks', {
        extractStyles: true, 
        title: 'Signature', 
        session: req.session.client, 
        options_top_bar: 'adv',
        infos,
        titre
    })
})
// callback lorsqu'il y a eu un problème dans le processus de signature
// doit proposer à l'utilisateur de resigner maintenant ou plus tard et lui envoyer un mail
.get('/:Id_BDC/signature/fail', async (req, res) => {
    const Id_BDC = Number(req.params.Id_BDC)

    let infos = undefined
    const titre = "Erreur signature"

    try {
        if(isNaN(Id_BDC)) throw "Identifiant du bon de commande incorrect."

        const bdc = await ADV_BDC.findOne({
            where : {
                id : Id_BDC
            }
        })
        if(bdc === null) throw "Aucun bon de commande correspondant."

        const BASE_URL = process.env.BASE_URL
        const responseRelance = await axios({
            method : 'POST',
            url : `${BASE_URL}/adv/bdc/${Id_BDC}/relance`,
            responseType : 'json'
        })
    
        if(responseRelance.status !== 200) throw "Une erreur est survenue, veuillez recommencer."
        if(responseRelance.data.infos && responseRelance.data.infos.error) throw responseGenerationPDF.data.infos.error
    

        infos = errorHandler(undefined, `Une erreur s'est produite durant le processus de signature du bon de commande n°${bdc.ref}. ${responseRelance.data.infos.message}`)
    }
    catch(error) {
        infos = errorHandler(error)
    }

    res.render('ADV/bdc_signature_callbacks', {
        extractStyles: true, 
        title: 'Signature', 
        session: req.session.client, 
        options_top_bar: 'adv',
        infos,
        titre
    })
})
.get('/test/pdf/:ID', async (req, res) => {
    let bdcJSON = {"client":{"refIdClient":"693716","intitule":"M et MME","nom1":"NICOLAS","prenom1":"RENÉ","nom2":"NICOLAS","prenom2":"ANNE","adresse":"17 BIS RUE DU CLOUSEY","adresseComplement1":"","adresseComplement2":"","cp":"25660","ville":"SAONE","email":"test@mail.com","telephonePort":"0661728792","telephoneFixe":"","ficheRenseignementsTechniques":{"typeInstallationElectrique":"monophasée","puissanceKW":"20","puissanceA":"","anneeConstructionMaison":"","dureeSupposeeConstructionMaison":"","dureeAcquisitionMaison":"5","typeResidence":"principale","superficie":"110"}},"listeProduits":[{"idADV_produit":11,"isGroupe":true,"quantite":1,"designation":"KIT DCME/LI-MITHRA 20kW","caracteristique":null,"uniteCaracteristique":null,"prixUnitaireHT":"59150.00","prixUnitaireTTC":"67157.71","listeProduits":[{"idADV_produit":7,"quantite":1,"designation":"POMPE A CHALEUR 20KW","caracteristique":"20.00","uniteCaracteristique":"Kw","prixUnitaireHT":"18076.00","prixUnitaireTTC":"19070.18","prixUnitaireHTApplique":"17437.50","prixUnitaireTTCApplique":"18396.56"},{"idADV_produit":8,"quantite":1,"designation":"BALLON EAU CHAUDE SANITAIRE 300L","caracteristique":"300.00","uniteCaracteristique":"L","prixUnitaireHT":"2749.87","prixUnitaireTTC":"2901.11","prixUnitaireHTApplique":"2652.74","prixUnitaireTTCApplique":"2798.64"},{"idADV_produit":9,"quantite":1,"designation":"BALLON TAMPON 800L","caracteristique":"800.00","uniteCaracteristique":"L","prixUnitaireHT":"6500.00","prixUnitaireTTC":"6857.50","prixUnitaireHTApplique":"6270.40","prixUnitaireTTCApplique":"6615.27"},{"idADV_produit":15,"quantite":23,"designation":"Panneaux solaires LI-MITHRA hybrides bi-verre 300W (quantité > 10)","caracteristique":"300.00","uniteCaracteristique":"W","prixUnitaireHT":"1130.00","prixUnitaireTTC":"1356.00","prixUnitaireHTApplique":"1090.08","prixUnitaireTTCApplique":"1308.10"},{"idADV_produit":12,"quantite":1,"designation":"Forfait pose LI-MITHRA KIT 4 et 5","caracteristique":null,"uniteCaracteristique":null,"prixUnitaireHT":"8000.00","prixUnitaireTTC":"9600.00","prixUnitaireHTApplique":"7717.41","prixUnitaireTTCApplique":"9260.90"}]},{"idADV_produit":2,"isGroupe":false,"quantite":2,"designation":"BALLON EAU CHAUDE SANITAIRE 200 L","caracteristique":"200.00","uniteCaracteristique":"L","prixUnitaireHT":"2350.90","prixUnitaireTTC":"2480.20"}],"infosPaiement":{"isAcompte":false,"typeAcompte":null,"montantAcompte":0,"isComptant":true,"montantComptant":72118.11,"isCredit":false,"montantCredit":0,"nbMensualiteCredit":0,"montantMensualiteCredit":0,"nbMoisReportCredit":0,"tauxNominalCredit":0,"tauxEffectifGlobalCredit":0,"datePremiereEcheanceCredit":null,"coutTotalCredit":0},"observations":"","datePose":"29/03/2021","dateLimitePose":"17/06/2021","ficheAcceptation":{"client":"nicolas rené","adresse":"adresse nicolas","date":"29/03/2021","heure":"09:37","technicien":"DUPONT FraNçois","isReceptionDocuments":true},"prix":{"HT":"63851.80","TTC":"72118.11","listeTauxTVA":[{"tauxTVA":"5.50","prixHT":"31062.44","prixTTC":"32770.87"},{"tauxTVA":"20.00","prixHT":"32789.36","prixTTC":"39347.24"}]},"idVente":"4195"}
    let bdc = undefined
    let urlPDF = undefined

    try {
        const data = await generatePDF(req.params.ID, uuidv4(), req.session.client)
        bdc = data.bdc
        urlPDF = data.pdf

        await new Promise((resolve => {
            setTimeout(resolve(), 500)
        }))

        const pdf = readFileSync(`${__dirname}/../..${urlPDF}`)
        res.contentType("application/pdf")
        res.send(pdf)
    }
    catch(error) {
        res.send({
            error,
            urlPDF,
            bdc
        })
    }
})
// récupère le pdf signé pour le renvoyer
.get('/:Id_BDC/pdf/:Nom_PDF?', async (req, res) => {
    const Id_BDC = Number(req.params.Id_BDC)
    const Nom_PDF = req.params.Nom_PDF

    let pdf = undefined

    try {       
        if(isNaN(Id_BDC)) throw "Identifiant du bon de commande incorrect."

        const bdc = await ADV_BDC.findOne({
            where : {
                id : Id_BDC
            }
        })
        if(bdc === null) throw "Aucun bon de commande correspondant."

        if(!bdc.isValidated || bdc.isCanceled) throw "Les documents pour ce bon de commande ne sont pas disponibles."

        const universignAPI = new UniversignAPI('remi@qualicom-conseil.fr', 'Qualicom1@universign')
        const transactionDocuments = await universignAPI.getSignedDocumentsByCustomId(bdc.idTransactionUniversign)
        const document = transactionDocuments[0]
        const nomFichier = document.fileName
        pdf = document.content

        if(Nom_PDF === undefined) {
            return res.redirect(`pdf/${nomFichier}.pdf`)
        }
        res.contentType("application/pdf")
    }
    catch(error) {
        pdf = errorHandler(error).error
    }

    res.send(pdf)
})
.post('/checkDatesPose', (req, res) => {
    let infos = undefined

    try {
        checkDatesPose(req.body)
        infos = errorHandler(undefined, 'ok')
    }
    catch(error) {
        infos = errorHandler(error)
    }

    res.send({
        infos
    })
})
.post('/calculePrixBDC', async (req, res) => {
    let infos = undefined
    let prixBDC = undefined

    try {
        const { prixHT, prixTTC, listeTauxTVA } = await calculePrixBDC(req.body)
        prixBDC = {
            prixHT,
            prixTTC,
            listeTauxTVA
        }
    }
    catch(error) {
        infos = errorHandler(error)
    }

    res.send({
        infos, 
        prixBDC
    })
})
// création d'un bdc et du document pdf associé
.post('', async (req, res) => {
    let infos = undefined
    let url = undefined
    let pdf = undefined

    try {
        let bdc = await checkBDC(req.body, req.session.client) 

        // opère la création à l'intérieur d'une transaction pour préserver la base de données de données non consitantes
        // l'objet transaction doit être passé à toutes les créations
        await sequelize.transaction(async transaction => {
            // création du client
            bdc.client = await create_BDC_client(bdc.client, transaction)
            bdc.infosPaiement.idADV_BDC_client = bdc.client.id            
            
            // création des catégories liées à la liste de produits
            const {listeProduits, tableauCorrespondancesCategories} = await createListeCategoriesBDC(bdc.listeProduits, transaction)
            bdc.listeProduits = listeProduits
            bdc.tableauCorrespondancesCategories = tableauCorrespondancesCategories            

            // crée la liste des produits, lie les sous produits des groupements, lie les catégories aux produits et sous produits
            bdc.listeProduits = await create_BDC_listeProduits(bdc.listeProduits, transaction)            

            // crée la fiche d'informations de paiement
            bdc.infosPaiement = await create_BDC_infosPaiement({ infosPaiement : bdc.infosPaiement, prixTTC : bdc.prixTTC }, transaction)

            // crée la fiche d'acceptation du BDC
            bdc.ficheAcceptation = await createFicheAcceptation(bdc, req.session.client, transaction)

            // crée la base du numéro de référence du BDC
            bdc.ref = numeroBDCFormatter.createNumeroReferenceBase()            
            
            // créer le BDC
            let createdBDC = await ADV_BDC.create({
                ref : bdc.ref,
                idADV_BDC_client : bdc.client.id,
                idVendeur : bdc.idVendeur,
                prixHT : bdc.prixHT,
                prixTTC : bdc.prixTTC,
                montantTVA : bdc.montantTVA,
                datePose : bdc.datePose,
                dateLimitePose : bdc.dateLimitePose,
                observations : bdc.observations,
                idADV_BDC_infoPaiement : bdc.infosPaiement.id,
                idADV_BDC_ficheAcceptation : bdc.ficheAcceptation.id,
                idStructure : bdc.idStructure
            }, { transaction })
            if(createdBDC === null) throw "Une erreur est survenue lors de la création du bon de commande."            

            // ajoute les produits au BDC
            for(const produit of bdc.listeProduits) {
                // ajoute les produit un à un afin de conserver l'ordre dans lequel ils ont été ajoutés
                await createdBDC.addListeProduits(produit.id, { 
                    through : {
                        isGroupe : produit.isGroupe,
                        quantite : produit.quantite,
                        prixUnitaireHT : produit.prixUnitaireHT,
                        prixUnitaireTTC : produit.prixUnitaireTTC,
                        prixHT : produit.prixHT,
                        prixTTC : produit.prixTTC,
                        tauxTVA : produit.tauxTVA,
                        montantTVA : produit.montantTVA
                    },
                    transaction
                })
            }
            
            // si tout est ok après création, créer la ref du bdc et mettre à jour le BDC
            createdBDC.ref = await numeroBDCFormatter.setNumeroReferenceFinal(createdBDC.ref, req.session.client.Structures[0].nom)
            createdBDC.idTransactionUniversign = uuidv4()
            await createdBDC.save({ transaction })    
            //  affecte l'identifiant du bdc à la vente associée s'il y en a une
            if(bdc.idVente) {
                await RDV.update({
                    idBDC : createdBDC.id
                }, {
                    where : {
                        id : bdc.idVente
                    },
                    transaction
                })
            }

            const dataGenerationPDF = await generatePDF(createdBDC.id, createdBDC.idTransactionUniversign, req.session.client, transaction)
            bdc = dataGenerationPDF.bdc
            pdf = dataGenerationPDF.pdf

            const rawPDF = readFileSync(`${__dirname}/../..${pdf}`)

            const BASE_URL = process.env.ENV === 'development' ? 'https://preprod.fuego.ovh' : process.env.BASE_URL
            const successURL = `${BASE_URL}/adv/bdc/${createdBDC.id}/signature/success`
            const cancelURL = `${BASE_URL}/adv/bdc/${createdBDC.id}/signature/cancel`
            const failURL = `${BASE_URL}/adv/bdc/${createdBDC.id}/signature/fail`
            
            const universignAPI = new UniversignAPI('remi@qualicom-conseil.fr', 'Qualicom1@universign')
            const collecteSignatures = await universignAPI.createTransactionBDC(
                bdc.idTransactionUniversign,
                [{
                    nom : `Bon de commande ${bdc.ficheAcceptation.client} n°${bdc.ref}`,
                    rawFile : rawPDF,
                    signatures : [
                        {
                            // client
                            page : 2,
                            x : 500,
                            y : 605 
                        },
                        {
                            // vendeur
                            page : 2,
                            x : 100,
                            y : 605
                        }
                    ],
                    acceptations : [
                        "Lu et approuvé",
                        "Bon pour accord",
                    ]
                }],
                [
                    {
                        nom : bdc.client.nom1,
                        prenom : bdc.client.prenom1,
                        email : bdc.client.email,
                        port : bdc.client.telephonePort,
                        successURL,
                        cancelURL,
                        failURL
                    },
                    {
                        nom : req.session.client.nom,
                        prenom : req.session.client.prenom,
                        email : req.session.client.mail,
                        port : req.session.client.tel1,
                        successURL,
                        cancelURL,
                        failURL
                    }
                ],
                `Bon de commande ${bdc.ficheAcceptation.client} : ${bdc.ref}, le ${bdc.ficheAcceptation.date}`,                
            )

            // affecte la clef de signature au client
            try {
                await ADV_BDC_client.update({
                    // le client est le premier à signer donc l'id renvoyé est le sien
                    clefSignature : collecteSignatures.id
                }, {
                    where : {
                        id : bdc.client.id
                    },
                    transaction
                })
            }
            catch(error) {
                console.error(`Erreur lors de l'affectation de la clef de signature au client : ${error}`)
            }

            // retire le pdf enregistré
            access(`${__dirname}/../..${pdf}`, F_OK, errorAccess => {
                if(errorAccess) {
                    console.error(errorAccess)
                    return
                }

                unlink(`${__dirname}/../..${pdf}`, errorRemove => {
                    if(errorRemove) console.error(errorRemove)
                    return
                })
            })            

            url = collecteSignatures.url
        })        

        infos = errorHandler(undefined, "Le bon de commande a bien été créé et est prêt à être signé.")
    }
    catch(error) {
        infos = errorHandler(error)
        url = undefined
        // retire le pdf enregistré s'il y en a un
        if(pdf !== undefined) {
            access(`${__dirname}/../..${pdf}`, F_OK, errorAccess => {
                if(errorAccess) {
                    console.error(errorAccess)
                    return
                }

                unlink(`${__dirname}/../..${pdf}`, errorRemove => {
                    if(errorRemove) console.error(errorRemove)
                    return
                })
            })    
        }
    }

    res.send({
        infos,
        url
    })
})
// envoie une relance
.post('/:Id_BDC/relance', async (req, res) => {
    const Id_BDC = Number(req.params.Id_BDC)

    let infos = undefined

    try {
        if(isNaN(Id_BDC)) throw "Identifiant incorrect."

        const bdc = await ADV_BDC.findOne({
            where : {
                id : Id_BDC
            }
        })
        if(bdc === null) throw "Aucun bon de commande correspondant."

        const universignAPI = new UniversignAPI('remi@qualicom-conseil.fr', 'Qualicom1@universign')
        const transactionInfo = await universignAPI.getTransactionInfoByCustomId(bdc.idTransactionUniversign)
        const READY = 'ready'

        if(transactionInfo.status !== READY) throw "Une relance ne peut pas être envoyée car le document est déjà signé ou a été annulé."

        const signataire = transactionInfo.signerInfos.find(signataire => signataire.status === READY)
        if(signataire === undefined) throw "Il n'y a aucun signataire à qui envoyer la relance."

        // création du mail html
        let html = await new Promise((resolve, reject) => {
            ejs.renderFile(`${__dirname}/../../public/mail/signature_relance.ejs`, { signataire, ref : bdc.ref }, (err, html) => {
                if(err) reject(err)
                resolve(html)
            })
        }) 

        await sendMail(TYPEMAIL.SIGNATURE, signataire.email,
            `Invitation à signer le bon de commande n°${bdc.ref}`,
            `Bonjour ${signataire.firstName} ${signataire.lastName}, Vous êtes invité à signer le bon de commande n°${bdc.ref} à l'adresse suivante : ${signataire.url} . Merci.`,
            html
        )

        infos = errorHandler(undefined, `Une relance vient d'être envoyée à ${signataire.firstName} ${signataire.lastName}.`)
    }
    catch(error) {
        infos = errorHandler(error)
    }

    res.send({
        infos
    })
})
// modification d'un bdc
.patch('/:Id_BDC', async (req, res) => {
    res.send("modification d'un bdc?")
})
// annulation d'un bdc
.patch('/:Id_BDC/cancel', async (req, res) => {
    const Id_BDC = Number(req.params.Id_BDC)

    let infos = undefined

    try {
        if(isNaN(Id_BDC)) throw "Identifiant incorrect."

        await sequelize.transaction(async (transaction) => {
            const bdc = await ADV_BDC.findOne({
                where : {
                    id : Id_BDC
                },
                transaction
            })
            if(bdc === null) throw "Aucun bon de commande correspondant."

            // on cherche s'il y a une vente associée
            const vente = await RDV.findOne({
                where : {
                    idBDC : bdc.id
                },
                transaction
            })
            // s'il y a une vente, on retire l'association avec le bdc
            if(vente) {
                vente.idBDC = null
                await vente.save({ transaction })
            }

            bdc.isCanceled = true
            await bdc.save({ transaction })

            // annule la transaction universign
            const universignAPI = new UniversignAPI('remi@qualicom-conseil.fr', 'Qualicom1@universign')
            const transactionInfo = await universignAPI.getTransactionInfoByCustomId(bdc.idTransactionUniversign)

            const READY = 'ready'

            if(transactionInfo.status === READY) await universignAPI.cancelTransaction(transactionInfo.transactionId)
        })

        infos = errorHandler(undefined, "Le bon de commande a bien été annulé.")
    }
    catch(error) {
        infos = errorHandler(error)
    }

    res.send({
        infos
    })
})
// suppression d'un bdc
.delete('/:Id_BDC', async (req, res) => {
    res.send("suppression d'un bdc")
})

/********************** GESTION DES COMPTEURS DE BDC *****************************************/
const compteurs = {
    COMPTEURS_BDC : 'COMPTEUR_BDC_',
    listeCompteursBDC : undefined,

    isNewYear(lastUpdate) {
        const currentYear = moment().format('YYYY')
        const usedYear = moment(lastUpdate).format('YYYY')
    
        return currentYear > usedYear
    },

    async init() {    
        this.listeCompteursBDC = await Compteur.findAll({
            where : {
                nom : {
                    [Op.like] : `${this.COMPTEURS_BDC}%`
                }
            }
        })
    },

    async reset() {
        const tabPromise = []
    
        for(const compteurBDC of this.listeCompteursBDC) {
            if(this.isNewYear(compteurBDC.updatedAt)) {
                compteurBDC.valeur = 0
                tabPromise.push(compteurBDC.save())
            }
        }
    
        await Promise.all(tabPromise)
    },

    async create(typeCompteur) {
        await Compteur.create({
            nom : typeCompteur,
            valeur : 0
        })
    },

    async get(typeCompteur) {
        if(this.listeCompteursBDC === undefined) {
            await this.init()
        }
    
        if(!typeCompteur.startsWith(this.COMPTEURS_BDC)) {
            throw `Impossible de récupérer le compteur ${typeCompteur}.`
        }
    
        let currentCompteurBDC = undefined
    
        if(typeCompteur.startsWith(this.COMPTEURS_BDC)) {
            currentCompteurBDC = this.listeCompteursBDC.find(compteur => compteur.nom === typeCompteur) 
            // if(currentCompteurBDC === undefined) throw `Impossible de récupérer le compteur ${typeCompteur}.`
            // si le compteur n'existe pas, on le crée
            if(currentCompteurBDC === undefined) {
                await this.create(typeCompteur)
                // désafecte la liste pour qu'elle soit mise à jour ensuite
                this.listeCompteursBDC = undefined
                // rappelle la fonction avec cette fois le compteur qui doit être créé                
                return this.get(typeCompteur)
            }
        }
    
        await this.reset()
    
        let valeur = 0
    
        if(currentCompteurBDC) {
            await sequelize.transaction({ 
                type : Sequelize.Transaction.TYPES.EXCLUSIVE 
            }, async (transaction) => {
                await currentCompteurBDC.increment('valeur')
                await currentCompteurBDC.reload()
                valeur = currentCompteurBDC.valeur
            })
        }
    
        return valeur
    }
}

/********************** GESTION DU FORMATAGE COMPTEURS DE BDC *****************************************/
const numeroBDCFormatter = {
    numeroFormatter(num) {
        const numSize = num.toString().length
        let formatedNumber = ''
    
        // on ajoute des 0 en dessous de 100
        if(numSize < 3) {
            const diff = 3 - numSize
            for(let i = 0; i < diff; i++) {
                formatedNumber += '0'
            }
        }
        formatedNumber += num
    
        return formatedNumber
    },

    createNumeroReferenceBase() {
        return `${moment().format('YYYY')}-***`
    },

    async setNumeroReferenceFinal(ref, agence) {
        if(!isSet(ref)) throw "Aucun numéro de référence transmis."

        const numero = await compteurs.get(`${compteurs.COMPTEURS_BDC}${agence}`)
    
        return ref.replace(/(\*){3}/g, this.numeroFormatter(numero))
    }
}

module.exports = router