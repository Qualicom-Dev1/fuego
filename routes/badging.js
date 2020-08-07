const express = require('express');
const router = express.Router();
const models = require("../models/index")
const sequelize = require('sequelize');
const moment = require('moment');
const { Op } = sequelize
const clientInformationObject = require('./utils/errorHandler');
const isSet = require('./utils/isSet');
const validations = require('./utils/validations')

const LISTE_SOURCES_BADGING = ['BADGING', 'PARRAINAGE', 'PERSO']

function formatPhone(phoneNumber){

    if(phoneNumber != null && typeof phoneNumber != 'undefined' && phoneNumber != ' '){
        phoneNumber = cleanit(phoneNumber);
	    phoneNumber = phoneNumber.split(' ').join('')
        phoneNumber = phoneNumber.split('.').join('')

        if(phoneNumber.length != 10){

            phoneNumber = '0'+phoneNumber;

            if(phoneNumber.length != 10){
                return undefined
            }else{
                return phoneNumber
            }
        }else{
            return phoneNumber
        }
    }
}

function cleanit(input) {
    input.toString().trim().split('/\s*\([^)]*\)/').join('').split('/[^a-zA-Z0-9]/s').join('')
	return input.toString().toLowerCase()
}

function setQuery(req){
    // let StructuresDep = []
    // req.session.client.Structures.forEach(s => {
    //     s.deps.split(',').forEach(d => {
    //         StructuresDep.push(d)
    //     })
    // })

    let where = {}

    if(req.body.tel != ''){
        const tel = {
            [Op.or]: {
                tel1 : {[Op.like] : '%'+req.body.tel+'%'},
                tel2 : {[Op.like] : '%'+req.body.tel+'%'},
                tel3 : {[Op.like] : '%'+req.body.tel+'%'},
            },
        }
        where = { ...where, ...tel }
    }
    if(req.body.statut != ''){
        if(req.body.statut == 'null'){
            where['currentAction'] = null;
        }else{
            where['currentAction'] = req.body.statut;
        }
    }
    // if(!StructuresDep.includes(req.body.dep) && req.body.dep != ''){
    //     where['dep'] = '9999'
    // }else{
    //     if(req.body.dep != ''){
    //         where['dep'] = req.body.dep
    //     }else{
    //         where['dep'] = {[Op.in] : StructuresDep}
    //     }
    // }
    if(req.body.dep !== '') {
        where['dep'] = req.body.dep
    }
    if(req.body.nom != ''){
        // where['nom'] = {[Op.like] : '%'+req.body.nom+'%'};
        where['nom'] = models.sequelize.where(models.sequelize.fn('UPPER', models.sequelize.col('nom')), 'LIKE', `%${req.body.nom.toUpperCase()}%`)
    }
    if(req.body.prenom != ''){
        // where['prenom'] = {[Op.like] : '%'+req.body.prenom+'%'};
        where['prenom'] = models.sequelize.where(models.sequelize.fn('UPPER', models.sequelize.col('prenom')), 'LIKE', `%${req.body.prenom.toUpperCase()}%`)
    }

    return where
}

router
.get('/', (req, res) => {
    res.redirect('/badging/ajouter-un-badging')
})
.get('/ajouter-un-badging' , async (req, res) => {
    const sources = await models.Source.findAll({
        where : {
            nom : {
                [Op.in] : ['PERSO', 'BADGING', 'PARRAINAGE']
            }
        },
        order : [
            ['nom', 'ASC']
        ]
    })

    const types = await models.TypeLigne.findAll({})

    const user = req.session.client

    const commerciaux = []
    if(user.Role.typeDuRole === 'Commercial') {
        // ajoute lui-même
        commerciaux.push({ 
            id : user.id,
            nom : `${user.prenom} ${user.nom}`
        })

        // si c'est plus qu'un simple commercial, on récupère les personnes sous ses ordres pour qu'il puisse les affecter
        if(user.Role.nom !== 'Commerciaux') {
            const commerciaux_dependants = await models.Usersdependence.findAll({
                where : {
                    idUserSup : user.id,
                    idUserInf : {
                        [Op.notIn] : [1000, 1001, user.id]
                    }
                },
                include : [
                    { model : models.User }
                ]
            })
    
            if(commerciaux_dependants !== null) {
                for(const commercial of commerciaux_dependants) {
                    if(commercial.User !== null) {
                        commerciaux.push({
                            id : commercial.User.id,
                            nom : `${commercial.User.prenom} ${commercial.User.nom}`
                        })
                    }
                }
            }
        }
    }
    // dans le cas où c'est le TMK ou un admin on récupère tous ceux qui sont commerciaux ou dirigent des commerciaux
    else {
        const liste_commerciaux = await models.User.findAll({
            attributes : [
                'id', 
                [sequelize.fn('CONCAT', sequelize.col('prenom'), ' ', sequelize.col('User.nom')), 'nom']
            ],
            include : {
                model : models.Role,
                where : {
                    typeDuRole : 'Commercial'
                }
            },
            order : [['nom', 'ASC']]
        })

        if(liste_commerciaux !== null) {
            commerciaux.push(...liste_commerciaux)
        }
    }

    res.render('badging/badging_addclient', { extractStyles: true, title: 'Ajouter un badging | FUEGO', description:'Ajouter un badging',  session: req.session.client, options_top_bar: 'badging', sources, types, commerciaux});
})
.post('/get-referent', async (req, res) => {
    let search = req.body.search

    const returnedObject = {
        error : false,
        error_message : '',
        clients : [],
        nb_clients : 0
    }

    try {
        if(search === undefined || search === 'undefined' || search === '' || search.trim() === '') {
            throw 'Le référent est vide'
        }

        search = search.toUpperCase()

        const [liste_client, metadata] = await models.sequelize.query(`
            SELECT DISTINCT(id), CONCAT(prenom, ' ', nom, ' ', cp) AS nom FROM Clients 
            WHERE CONCAT(prenom, ' ', nom) LIKE '%${search}%'
            OR CONCAT(nom, ' ', prenom) LIKE '%${search}%'
            ORDER BY nom ASC
        `)

        if(liste_client !== null) {
            returnedObject.nb_clients = liste_client.length
            returnedObject.clients = liste_client.slice(0, 10)
        }
    }
    catch(error) {
        console.error(error)
        returnedObject.error = true
        returnedObject.error_message = "Une erreur s'est produite, veuillez recommencer plus tard"
    }

    res.send(returnedObject)
})
.post('/create-client', async (req, res) => {
    let sentClient = req.body.client
    let idParrain = Number.parseInt(req.body.idParrain)
    const idVendeur = Number.parseInt(req.body.idVendeur)

    const returnedObject = {
        error : false,
        error_message : '',
        idClient : undefined
    }

    try {
        if(sentClient.source === undefined || sentClient.source === 'undefined' || sentClient.source === '') {
            throw 'Une source doit être sélectionnée.'
        }
        if(sentClient.source === 'PARRAINAGE' && isNaN(idParrain)) {
            throw "Un parrain doit être choisi."
        }
        if(sentClient.source !== 'PARRAINAGE' && !isNaN(idParrain)) {
            throw "Un parrain est sélectionné mais la source n'est pas un parrainage."
        }
        if(isNaN(idVendeur)) {
            throw 'Un vendeur doit être assigné.'
        }

        sentClient = validations.validationClient(sentClient)

        const vendeur = await models.User.findOne({
            where : {
                id : idVendeur
            }
        })
        if(vendeur === null) {
            throw "Le vendeur sélectionné n'existe pas."
        }

        if(!isNaN(idParrain)) {
            const parrain = await models.Client.findOne({
                where : {
                    id : idParrain
                }
            })

            if(parrain === null) {
                throw "Le parrain sélectionné n'a pas été retrouvé."
            }
            idParrain = parrain.id
        }

        const existingClient = await models.Client.findOne({
            where : {
                [Op.and] : [
                    { nom : sentClient.nom },
                    { prenom : sentClient.prenom },
                    { cp : sentClient.cp },
                    { tel1 : sentClient.tel1 }
                ]
            }
        })

        if(existingClient !== null) {
            throw 'Le client existe déjà.'
        }

        const client = await models.Client.create(sentClient)

        if(client === null) {
            throw 'Une erreur est survenue lors de la création du client. Veuillez recommencer plus tard.'
        }

        await models.AppartenanceClientsVendeur.create({
            idVendeur : vendeur.id,
            idClient : client.id,
            idParrain : idParrain
        })

        returnedObject.idClient = client.id
    }
    catch(error) {
        returnedObject.error = true
        returnedObject.error_message = clientInformationObject(error).error
    }

    res.send(returnedObject)
})
.get('/client/:idClient', async (req, res) => {
    const idClient = Number.parseInt(req.params.idClient)

    const errorObject = {
        error : false,
        error_message : ''
    }

    let client = undefined

    try {
        if(isNaN(idClient)) {
            throw "Aucun client trouvé."
        }

        client = await models.Client.findOne({
            where : {
                id : idClient
            },
            include: {
                model: models.Historique, include: [
                    {model: models.RDV, include: models.Etat},
                    {model: models.Action},
                    {model: models.User}
            ]}
        })

        if(client === null) {
            throw "Le client n'existe pas."
        }

        const user = req.session.client

        const liste_commerciaux = []
        liste_commerciaux.push(user.id)
        
        const commerciaux_dependants = await models.Usersdependence.findAll({
            where : {
                idUserSup : user.id,
                idUserInf : {
                    [Op.notIn] : [1000, 1001, user.id]
                }
            },
            include : [
                { model : models.User }
            ]
        })

        if(commerciaux_dependants !== null) {
            for(const commercial of commerciaux_dependants) {
                liste_commerciaux.push(commercial.idUserInf)
            }
        }

        // recherche si le client est un client badging et si le commercial à le droit d'accéder à celui-ci
        const badging = await models.AppartenanceClientsVendeur.findOne({
            where : {
                idVendeur : {
                    [Op.in] : liste_commerciaux
                },
                idClient : client.id
            }
        })

        if(badging === null) {
            throw "Vous n'avez pas accès à ce client."
        }
    }
    catch(error) {
        console.error(error)
        errorObject.error = true
        errorObject.error_message = error
    }

    // res.send(returnedObject)
    res.render('badging/badging_client', { extractStyles: true, title: 'Rechercher un badging | FUEGO', session: req.session.client, description:'Afficher un badging', findedClient: client, options_top_bar: 'badging', errorObject});
})
.get('/rechercher-un-badging', async (req, res) => {
    let actions = undefined
    let sous_statuts = undefined
    const errorObject = {
        error : false,
        error_message : ''
    }

    try {
        actions = await models.Action.findAll({
            order : [['nom', 'asc']]
        })

        if(actions === null) {
            actions = []
        }

        sous_statuts = await models.sequelize.query('SELECT distinct sousstatut FROM Historiques WHERE sousstatut IS NOT NULL', { type: models.sequelize.QueryTypes.SELECT })

        if(sous_statuts === null) {
            sous_statuts = []
        }
    }
    catch(error) {
        console.error(error)
        errorObject.error = true
        errorObject.error_message = 'Une erreur est survenue, veuillez réessayer plus tard.'
    }

    res.render('badging/badging_searchclients', { extractStyles: true, title: 'Rechercher un badging | FUEGO', description:'Rechercher un badging',  session: req.session.client, options_top_bar: 'badging', actions, sous_statuts, errorObject});
})
.post('/rechercher-client', async (req, res) => {
    const returnedObject = {
        error : false,
        error_message : '',
        clients : []
    }

    try {
        const user = req.session.client

        const liste_commerciaux = []
        liste_commerciaux.push(user.id)

        const commerciaux_dependants = await models.Usersdependence.findAll({
            where : {
                idUserSup : user.id,
                idUserInf : {
                    [Op.notIn] : [1000, 1001, user.id]
                }
            },
            include : [
                { model : models.User }
            ]
        })

        if(commerciaux_dependants !== null) {
            for(const commercial of commerciaux_dependants) {
                liste_commerciaux.push(commercial.idUserInf)
            }
        }
        
        // recherche de tous les clients correspondants aux infos de la recherche
        // qui appartiennent à ce commercial ou aux commerciaux sous ses ordres

        // const liste_clients = await models.AppartenanceClientsVendeur.findAll({
        //     where : {
        //         idVendeur : {
        //             [Op.in] : liste_commerciaux
        //         }
        //     },
        //     include : [
        //         {
        //             model : models.Client,
        //             where : setQuery(req),
        //             include: [
        //                 {
        //                     model: models.Historique, required: false,
        //                     include: [
        //                         {model: models.RDV, include: models.Etat},
        //                         {model: models.Action},
        //                         {model: models.User}
        //                     ], 
        //                     where: 
        //                     ((req.body.sousstatut === '') 
        //                         ? { [Op.not] : {idAction: 2} }
        //                         : { [Op.not] : {idAction: 2}, sousstatut : {[Op.like] : '%'+req.body.sousstatut+'%'} }
        //                     ),
        //                     order : [[{ model : models.Historique }, 'createdAt', 'DESC']]
        //                 },
        //             ],
        //             order : [[models.Historique, 'createdAt', 'desc']]
        //         }
        //     ],
        //     limit : 30,
        //     raw : true
        // })

        let liste_clients = await models.AppartenanceClientsVendeur.findAll({
            where : {
                idVendeur : {
                    [Op.in] : liste_commerciaux
                }
            },
            include : {
                model : models.Client
            }
        })

        if(liste_clients === null || liste_clients.length === 0) {
            throw 'Aucun client correspondant à la recherche.'
        }

        // conversion en object classique pour que JSON.stringify prenne en compte les éléments qui seronts ajoutés ensuite
        liste_clients = liste_clients.map(elt => {
            return {
                Client : {
                    id : elt.Client.id,
                    nom : elt.Client.nom,
                    prenom : elt.Client.prenom,
                    cp : elt.Client.cp,
                    ville : elt.Client.ville
                }
            }
        })

        // récupération du dernier historique du client
        for(const appartenance of liste_clients) {
            let where = {
                idClient : appartenance.Client.id
            }

            const idAction = {
                [Op.not] : {idAction: 2}
            }
            where = { ...where, ...idAction }

            if(req.body.sousstatut !== '') {
                const sousstatut = {
                    [Op.like] : '%'+req.body.sousstatut+'%'
                }
                where = { ...where, ...sousstatut }
            }

            const historique = await models.Historique.findOne({
                where,
                include : [
                    {model: models.RDV, include: models.Etat},
                    {model: models.Action},
                    {model: models.User}
                ],
                order : [['createdAt', 'DESC']]
            })

            if(historique === null) {
                appartenance.Client.Historique = undefined
                console.log('aucun historique')
            }
            else {
                appartenance.Client.Historique = historique
            }
        }

        returnedObject.clients = liste_clients
    }
    catch(error) {
        console.error(error)
        returnedObject.error = true
        returnedObject.error_message = error
    }

    res.send(returnedObject)
})
.get('/manage', async (req, res) => {
    let rdvs = undefined
    const errorObject = {
        error : false,
        error_message : ''
    }

    try {
        const user = req.session.client

        const liste_commerciaux = []
        liste_commerciaux.push(user.id)

        const commerciaux_dependants = await models.Usersdependence.findAll({
            where : {
                idUserSup : user.id,
                idUserInf : {
                    [Op.notIn] : [1000, 1001, user.id]
                }
            },
            include : [
                { model : models.User }
            ]
        })

        if(commerciaux_dependants !== null) {
            for(const commercial of commerciaux_dependants) {
                liste_commerciaux.push(commercial.idUserInf)
            }
        }

        const liste_rdvs = await models.RDV.findAll({
            where : {
                idVendeur : {
                    [Op.in] : liste_commerciaux
                },
                source : {
                    [Op.in] : LISTE_SOURCES_BADGING
                }
            },
            include: [
                {model : models.Client},
                {model : models.Historique, include: [
                    {model : models.User, include : [
                        {model : models.Structure}
                    ]}
                ]},
                {model : models.User},
                {model : models.Etat},
                {model : models.Campagne}
            ],
            order: [['date', 'asc']]
        })

        if(liste_rdvs === null) {
            throw 'Aucun rendez-vous badging.'
        }

        rdvs = liste_rdvs
    }
    catch(error) {
        console.error(error)
        errorObject.error = true
        errorObject.error_message = error
    }

    res.render('badging/badging_manage', { extractStyles: true, title: 'Gestion RDVs badging | FUEGO', description:'Gestion RDVs badging',  session: req.session.client, options_top_bar: 'badging', rdvs, errorObject});
})
.post('/manage', async (req, res) => {
    let rdvs = undefined
    const errorObject = {
        error : false,
        error_message : ''
    }

    try {
        const user = req.session.client

        const liste_commerciaux = []
        liste_commerciaux.push(user.id)

        const commerciaux_dependants = await models.Usersdependence.findAll({
            where : {
                idUserSup : user.id,
                idUserInf : {
                    [Op.notIn] : [1000, 1001, user.id]
                }
            },
            include : [
                { model : models.User }
            ]
        })

        if(commerciaux_dependants !== null) {
            for(const commercial of commerciaux_dependants) {
                liste_commerciaux.push(commercial.idUserInf)
            }
        }

        // ajouter des conditions de recherche de dates
        const where_dates = {}
        let dateDebut = req.body.datedebut
        let dateFin = req.body.datefin

        if(dateDebut !== undefined && dateDebut !== 'undefined' && dateDebut !== null && dateDebut !== '') {
            dateDebut = moment(dateDebut, 'DD/MM/YYYY').format('YYYY-MM-DD 00:00:00')

            if(dateFin !== undefined && dateFin !== 'undefined' && dateFin !== null && dateFin !== '') {
                dateFin = moment(dateFin, 'DD/MM/YYYY').format('YYYY-MM-DD 23:59:59')

                where_dates.date = {
                    [Op.between] : [dateDebut, dateFin]
                }
            }
            else {
                where_dates.date = {
                    [Op.gte] : dateDebut
                }
            }
        }

        const where_statut = {}
        let statut = Number(req.body.statutRDV)
        
        if(!isNaN(statut) && [0, 1].includes(statut)) {
            where_statut.statut = statut

            where_statut.idEtat = {
                [Op.or] : [0, null]
            }
        }

        let liste_rdvs = null

        // cas RDV à traiter
        if(statut === 3) {
            const etatsATraiter = await models.Etat.findAll({
                where : {
                    nom : {
                        [Op.in] : ['DEM SUIVI', 'REPO COMMERCIAL', 'REPO CLIENT']
                    }
                }
            })

            if(etatsATraiter == null) {
                throw "Une erreur est survenue, impossible de retrouver les états pour triater la requête."
            }

            const listeEtatsATraiter = etatsATraiter.map(etat => etat.id)

            // recherche de tous les rdvs qui nécessitent un second traitement
            const rdvs = await models.RDV.findAll({
                where : {
                    idVendeur : {
                        [Op.in] : liste_commerciaux
                    },
                    source : {
                        [Op.in] : LISTE_SOURCES_BADGING
                    },
                    ...where_dates,
                    [Op.or] : {
                        idEtat : {
                            [Op.in] : listeEtatsATraiter
                        },
                        //  statut à repositionner
                        statut : 3
                    }
                },
                include: [
                    {model : models.Client},
                    {model : models.Historique, include: [
                        {model : models.User, include : [
                            {model : models.Structure}
                        ]}
                    ]},
                    {model : models.User},
                    {model : models.Etat},
                    {model : models.Campagne}
                ],
                order: [['date', 'asc']]
            })

            if(rdvs !== null) {
                liste_rdvs = []

                // vérification si le second traitement a déjà été effectué
                for(rdv of rdvs) {
                    const mostRecentRDV = await models.RDV.findOne({
                        where : {
                            idClient : rdv.idClient,
                            idVendeur : rdv.idVendeur,
                            createdAt : {
                                [Op.gt] : rdv.createdAt
                            }
                        }
                    })

                    // s'il n'y a pas eu de rdv de repris le rdv est à traiter
                    if(mostRecentRDV === null) {
                        liste_rdvs.push(rdv)
                    }
                }

                if(liste_rdvs.length === 0) liste_rdvs = null
            }
        }
        // tous les autres cas
        else {
            liste_rdvs = await models.RDV.findAll({
                where : {
                    idVendeur : {
                        [Op.in] : liste_commerciaux
                    },
                    source : {
                        [Op.in] : LISTE_SOURCES_BADGING
                    },
                    ...where_dates,
                    ...where_statut
                },
                include: [
                    {model : models.Client},
                    {model : models.Historique, include: [
                        {model : models.User, include : [
                            {model : models.Structure}
                        ]}
                    ]},
                    {model : models.User},
                    {model : models.Etat},
                    {model : models.Campagne}
                ],
                order: [['date', 'asc']]
            })
        }

        if(liste_rdvs === null || liste_rdvs.length === 0) {
            throw 'Aucun rendez-vous badging.'
        }

        rdvs = liste_rdvs
    }
    catch(error) {
        console.error(error)
        errorObject.error = true
        errorObject.error_message = error
    }

    res.send({
        rdvs,
        errorObject
    })
})



module.exports = router;