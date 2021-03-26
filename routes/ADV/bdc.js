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
const { response } = require('express')

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
async function createListeCategoriesBDC(listeProduits, tableauCorrespondancesCategories = []) {
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
                    const bdc_categorie = await create_BDC_categorie({ nom : categorie.nom, idADV_categorie : categorie.id })
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
            const resSousProduits = await createListeCategoriesBDC(listeProduits[i].listeProduits, tableauCorrespondancesCategories)
            
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
async function getFormatedBDC(Id_BDC) {
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
        }
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

    const prix = await calculePrixBDC(bdc)
    bdc = { ...bdc, prix }

    return bdc
}

// retourne un BDC selon son id formaté ou simple (infos génrales pas le contenu)
async function getOne(Id_BDC, formated = false, user) {
    let infos = undefined
    let bdc = undefined

    try {
        bdc = await ADV_BDC.findOne({
            where : {
                id : Id_BDC,
                idStructure : {
                    [Op.in] : user.Structures.map(structure => structure.id)
                }
            }
        })
        if(bdc === null) throw "Aucun bon de commande correspondant."

        if(formated) {
            bdc = await getFormatedBDC(bdc.id)
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
// récupère un bon de commande
.get('/:Id_BDC', async (req, res) => {
    const Id_BDC = Number(req.params.Id_BDC)

    let infos = undefined
    let bdc = undefined

    try {
        if(isNaN(Id_BDC)) throw "L'identifiant du bon de commande est incorrect."

        const isFormated = (req.query.formated && !!Number(req.query.formated))

        const data = await getOne(Id_BDC, isFormated, req.session.client)
        
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
// récupère les infos d'un BDC et génère son pdf
.post('/generate/pdf/:Id_BDC', async (req, res) => {
    const Id_BDC = Number(req.params.Id_BDC)

    let infos = undefined
    let uuid = undefined

    try {
        if(isNaN(Id_BDC)) throw "Identifiant incorrect."

        let data = await getOne(Id_BDC, true, req.session.client)
        if(data.infos && data.infos.error) throw data.infos.error

        uuid = await uuidv4()

        const responseGenerationPDF = await axios({
            method : 'POST',
            url : `http://localhost:8080/pdf/generateBDC/${uuid}`,
            data : data.bdc,
            responseType : 'json'
        })

        if(responseGenerationPDF.status !== 200) throw "Une erreur est survenue, veuillez recommencer."
        if(responseGenerationPDF.data.infos && responseGenerationPDF.data.infos.error) throw responseGenerationPDF.data.infos.error
    }
    catch(error) {
        uuid = undefined
        infos = errorHandler(infos)
        console.error(error)
    }

    res.send({
        infos,
        uuid
    })
})
// création d'un bdc
.post('', async (req, res) => {
    let infos = undefined
    let bdc = undefined

    try {
        bdc = await checkBDC(req.body, req.session.client)   

        // création du client
        bdc.client = await create_BDC_client(bdc.client)
        bdc.infosPaiement.idADV_BDC_client = bdc.client.id
        
        // création des catégories liées à la liste de produits
        const {listeProduits, tableauCorrespondancesCategories} = await createListeCategoriesBDC(bdc.listeProduits)
        bdc.listeProduits = listeProduits
        bdc.tableauCorrespondancesCategories = tableauCorrespondancesCategories

        // crée la liste des produits, lie les sous produits des groupements, lie les catégories aux produits et sous produits
        bdc.listeProduits = await create_BDC_listeProduits(bdc.listeProduits)

        // crée la fiche d'informations de paiement
        bdc.infosPaiement = await create_BDC_infosPaiement({ infosPaiement : bdc.infosPaiement, prixTTC : bdc.prixTTC })

        // crée la fiche d'acceptation du BDC
        bdc.ficheAcceptation = await createFicheAcceptation(bdc, req.session.client)

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
        })
        if(createdBDC === null) throw "Une erreur est survenue lors de la création du bon de commande."

        // ajoute les produits au BDC
        for(const produit of bdc.listeProduits) {
            // ajoute les produit un à un afin de conserver l'ordre dans lequel ils ont été ajoutés
            await createdBDC.addListeProduits(produit.id, { through : {
                isGroupe : produit.isGroupe,
                quantite : produit.quantite,
                prixUnitaireHT : produit.prixUnitaireHT,
                prixUnitaireTTC : produit.prixUnitaireTTC,
                prixHT : produit.prixHT,
                prixTTC : produit.prixTTC,
                tauxTVA : produit.tauxTVA,
                montantTVA : produit.montantTVA
            } })
        }
        
        // si tout est ok après création, créer la ref du bdc et mettre à jour le BDC
        createdBDC.ref = await numeroBDCFormatter.setNumeroReferenceFinal(createdBDC.ref, req.session.client.Structures[0].nom)
        await createdBDC.save()

        // récupération du BDC complet pour le renvoyer        
        const data = await getOne(createdBDC.id, false, req.session.client)
        if(data.infos && data.infos.error) throw `Erreur lors de la récupération du bon de commande après sa création : ${data.infos.error} Veuillez recommencer.`

        bdc = data.bdc
        infos = errorHandler(undefined, "Le bon de commande a bien été créé et est prêt à être signé.")
    }
    catch(error) {
        infos = errorHandler(error)
        // détruit tout ce qui a été créé en cas d'erreur
        // TODO: voir pour utiliser un système de transaction plutôt que de créer et détruire
        // if(bdc) {
        //     try {
        //         if(bdc.client && bdc.client instanceof ADV_BDC_client) {
        //             await ADV_BDC_client_ficheRenseignementsTechniques.destroy({
        //                 where : {
        //                     id : bdc.client.idClientFicheRenseignementsTechniques
        //                 }
        //             })
        //             await bdc.client.destroy()
        //         }
        //         if(bdc.infosPaiement && bdc.infosPaiement instanceof ADV_BDC_infoPaiement) await bdc.infosPaiement.destroy()
        //         if(bdc.ficheAcceptation && bdc.ficheAcceptation instanceof ADV_BDC_ficheAcceptation) await bdc.ficheAcceptation.destroy()
        //         if(bdc.listeProduits) {
        //             const tabPromise = []
        //             for(const produit of bdc.listeProduits) {
        //                 if(produit instanceof ADV_BDC_produit) {
        //                     if(produit.isGroupe) {
        //                         for(const sousProduit of produit.listeProduits) {
        //                             if(sousProduit instanceof ADV_BDC_produit) tabPromise.push(sousProduit.destroy())
        //                         }
        //                     }
        //                     tabPromise.push(produit.destroy())
        //                 }
        //             }
        //             await Promise.all(tabPromise)
        //         }
        //         if(bdc.tableauCorrespondancesCategories) {
        //             await ADV_BDC_categorie.destroy({
        //                 where : {
        //                     [Op.in] : bdc.tableauCorrespondancesCategories.map(correspondance => correspondance.idADV_BDC_categorie)
        //                 }
        //             })
        //         }
        //         if(bdc instanceof ADV_BDC) await bdc.destroy()
        //     }
        //     catch(error2) {
        //         infos = errorHandler(`${infos.error} ${error}`)
        //     }
        // }
        bdc = undefined
    }

    res.send({
        infos,
        bdc
    })

    // res.send("création d'un bdc")
})
// modification d'un bdc
.patch(':Id_BDC', async (req, res) => {
    res.send("modification d'un bdc?")
})
// annulation d'un bdc
.patch(':Id_BDC/cancel', async (req, res) => {
    // penser à mettre à null la vente avec l'ID du BDC s'il y en a une
    res.send("annulation d'un bdc?")
})
// suppression d'un bdc
.delete('', async (req, res) => {
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