const express = require('express')
const router = express.Router()
const models = global.db
const sequelize = require("sequelize")
const moment = require('moment')
const Op = sequelize.Op
const config = require('./../config/config.json');
const dotenv = require('dotenv')
const _ = require('lodash')
dotenv.config();
const validations = require('./utils/validations')
const clientInformationObject = require('./utils/errorHandler')
const isSet = require('./utils/isSet')
const { query } = require('../logger/logger')

const ovh = require('ovh')(config["OVH"])

require('../globals')

router.get('/' ,(req, res, next) => {
    res.redirect('/teleconseiller/tableau-de-bord');
});

router.get('/tableau-de-bord' ,(req, res, next) => {
    res.render('teleconseiller/telec_dashboard', { extractStyles: true, title: 'Tableau de bord | FUEGO', description:'Tableau de bord chargé(e) d\'affaires',  session: req.session.client, options_top_bar: 'telemarketing'});
});

router.get('/ajouter-client' ,(req, res, next) => {
    models.Source.findAll({})
    .then((findedSources) => {
        models.TypeLigne.findAll({})
        .then((findedTypes) => {
            res.render('teleconseiller/telec_addclient', { extractStyles: true, title: 'Ajouter prospect | FUEGO', description:'Ajout de prospect',  session: req.session.client, options_top_bar: 'telemarketing', findedSources: findedSources, findedTypes: findedTypes});
        })
    })
});

router.get('/a_repositionner' , async (req, res) => {
    let typeRecherche = Number(req.query.typeRecherche)
    const dateDebut = req.query.dateDebut
    const dateFin = req.query.dateFin
    let departementRecherche = req.query.departementRecherche

    let infoObject = undefined
    let historiques = undefined

    try {
        if(isSet(typeRecherche) && ![2,3].includes(typeRecherche)) {
            typeRecherche = undefined
        }

        if(isSet(departementRecherche)) {
            departementRecherche = Number(departementRecherche)
            if(!(departementRecherche > 0 && departementRecherche < 99)) throw "Le code postal est incorrect."
            if(departementRecherche < 10) {
                departementRecherche = `0${departementRecherche}`
            }
            else {
                departementRecherche = departementRecherche.toString()
            }
        }
        else {
            departementRecherche = undefined
        }

        const deps = []
        for(const structure of req.session.client.Structures) {
            if(isSet(structure.deps)) {
                const temp_deps = structure.deps.split(',')
                for(const dep of temp_deps) {
                    // si aucun code postal n'est fourni on recherche parmis ceux des strucures auxquelles l'utilisateur est rattaché
                    // si le code postal est fourni on ne cherchera que celui-ci si et seulement si il fait parti des structures de l'utilisateur
                    if(!isNaN(Number(dep)) && !deps.includes(dep) && (!isSet(departementRecherche) || dep === departementRecherche)) deps.push(dep)
                }
            }
        }

        let whereParametre = {}

        // si les deux sont définis on recherche un interval
        if(isSet(dateDebut) && isSet(dateFin)) {
            const debut = moment(dateDebut, 'DD/MM/YYYY').format('YYYY-MM-DD')
            const fin = moment(dateFin, 'DD/MM/YYYY').format('YYYY-MM-DD')

            const inBetween = {
                dateevent : {
                    [Op.between] : [debut, fin]
                }
            }

            whereParametre = { ...whereParametre, ...inBetween }
        }
        // recherche après la date de début
        else if(isSet(dateDebut)) {
            const debut = moment(dateDebut, 'DD/MM/YYYY').format('YYYY-MM-DD')

            const after = {
                dateevent : {
                    [Op.gte] : debut
                }
            }

            whereParametre = { ...whereParametre, ...after }
        }
        // recherche avant la date de fin
        else if(isSet(dateFin)) {
            const fin = moment(dateFin, 'DD/MM/YYYY').format('YYYY-MM-DD')

            const before = {
                dateevent : {
                    [Op.lte] : fin
                }
            }

            whereParametre = { ...whereParametre, ...before }
        }

        // récupère le dernier historique de chaque client
        const dernierHistoClients = await models.Historique.findAll({
            attributes : [
                [sequelize.fn('DISTINCT', sequelize.col('Historique.idClient')), 'idClient'],
                [sequelize.fn('MAX', sequelize.col('Historique.id')), 'id'],
                'idAction', 'dateevent', 'idRDV'
            ],
            where : whereParametre,
            include : [
                {
                    model : models.Client,
                    where : {
                        dep : {
                            [Op.in] : deps
                        }
                    }
                },
                { 
                    model : models.RDV,
                    include : [
                        { model : models.Etat }
                    ]
                }
            ],
            group : 'idClient',
            order : [['id', 'desc']]
        })

        if(dernierHistoClients === null || dernierHistoClients.length === 0) {
            throw "Une erreur est survenue, veuillez réessayer plus tard."
        }

        // filtre les historiques pour lesquels ce sont des rdv dont l'état est DEM SUIVI ou le statut A REPOSITIONNER si non fourni parl'utilisateur, 
        // sinon soit DEM SUIVI soit A REPOSITIONNER par rapport au choix de l'utilisateur
        historiques = dernierHistoClients.filter(historique => {
            return (
                // rdv
                (Number(historique.idAction) === 1 && isSet(historique.RDV)) && 
                (
                    (
                        !isSet(typeRecherche) &&
                        // DEM SUIVI || A REPOSITIONNER
                        (Number(historique.RDV.idEtat) === 2 || Number(historique.RDV.statut === 3))
                    )
                    ||
                    (
                        isSet(typeRecherche) &&
                        (
                            (typeRecherche === 2 && Number(historique.RDV.idEtat) === 2) || (typeRecherche === 3 && Number(historique.RDV.statut === 3))
                        )
                    )
                )
            )
        })

        if(historiques === null || historiques.length === 0) {
            infoObject = clientInformationObject(undefined, "La liste des repositionnements est vide.")
            historiques = undefined
        }
        else {
            // tri les historiques pour être dans l'ordre croissant
            historiques = _.orderBy(historiques, historique => moment(historique.dateevent, 'DD/MM/YYYY HH:mm').format('YYYYMMDDHHmm'), ['asc'])
        }
    }
    catch(error) {
        infoObject = clientInformationObject(error)
    }

    res.render('teleconseiller/telec_a_repositionner', { extractStyles: true, title: 'RDV à repositionner | FUEGO', description:'Liste des prospects avec rdv à repositionner',  session: req.session.client, options_top_bar: 'telemarketing', infoObject, historiques, dateDebut, dateFin, typeRecherche, departementRecherche });
});

async function getProspect(idTelepro, idCurrentClient = undefined) {   
    const telepro = await models.User.findOne({
        include: [  
            {model: models.Structure, include: models.Type},
            {
                model: models.Directive,
                include : {
                    model : models.Campagne,
                    include : {
                        model : models.Client,
                        attributes : ['id']
                    }
                }
            }
        ],
        where : {
            id : idTelepro
        }
    })
    if(telepro === null) throw "Une erreur est survenue en récupérant les informations du téléconseiller."

    let depsAvailable = []
    let where = {
        id : {
            // le client doit ne doit pas déjà être en cours d'utilisation
            [Op.not] : global.usedIdLigne
        }
    }

    if(telepro.Directive) {
        if(telepro.Directive.deps) depsAvailable = telepro.Directive.deps.split(',')

        // s'il est assigné à une campagne on se base sur celle-ci
        if(telepro.Directive.Campagne) {
            let listeIdsClientsCampagne = []

            // si la campagne est active et que des clients sont liés à celle-ci c'est parmis ces clients qu'il faut se baser
            if(telepro.Directive.Campagne.etat_campagne === 1 && telepro.Directive.Campagne.Clients.length) {
                listeIdsClientsCampagne = telepro.Directive.Campagne.Clients.map(client => client.id)
            }

            where = {
                ...where,
                [Op.and] : [
                    {  
                        id : {
                            [Op.in] : listeIdsClientsCampagne
                        }
                    },
                    {
                        id : {
                            // le client doit ne doit pas déjà être en cours d'utilisation
                            [Op.not] : global.usedIdLigne
                        }
                    }
                ]
                
            }

            // **** les clients font déjà parties de clientsCampagne
            // if(telepro.Directive.Campagne.sources_types) {
            //     // récupération des différentes paires source,type
            //     const sourcesTypes = telepro.Directive.Campagne.sources_types.split('/')

            //     // cas simple avec une seule paire
            //     if(sourcesTypes.length === 1) {
            //         const [source, type] = sourcesTypes[0].split(',')

            //         if(source && type) {
            //             where = { 
            //                 ...where,
            //                 [Op.and] : [{source : source}, {type : type}]
            //             }
            //         }
            //         else if(source) {
            //             where.source = source
            //         }
            //         else if(type) {
            //             where.type = type
            //         }
            //     }
            //     // cas de plusieurs paires où la requête doit être composée de OR
            //     else {
            //         let reqOr = []
            //         // parcours des paires pour composer notre requête de type (source = source AND type = type) OR
            //         for(const sourceType of sourcesTypes) {
            //             if(sourceType) {
            //                 const [source, type] = sourceType.split(',')

            //                 if(source && type) {
            //                     reqOr.push({
            //                         [Op.and] : [{source : source}, {type : type}]
            //                     })
            //                 }
            //                 else if(source) reqOr.push({ source : source })
            //                 else if(type) reqOr.push({ type : type })
            //             }
            //         }

            //         where = {
            //             ...where,
            //             [Op.or] : [...reqOr]
            //         }
            //     }
            // }
            // if(telepro.Directive.Campagne.statuts) {
            //     where.currentAction = { [Op.in] : telepro.Directive.Campagne.statuts.split(',') }
            // }
        }
        // sinon on regarde quels sont les éléments qui décrivent la directive
        else {
            if(telepro.Directive.type_de_fichier) where.source = telepro.Directive.type_de_fichier
            if(telepro.Directive.sous_type) where.type = telepro.Directive.sous_type
        }
    }
    else if(telepro.Structures){   
        for(const structure of telepro.Structures) {
            if(structure.deps !== null && structure.deps !== '') {
                const deps = structure.deps.split(',')
                for(const dep of deps) {
                    if(!depsAvailable.includes(dep)) depsAvailable.push(dep)
                }
            }
        }
    }

    // si aucun statut particulier, on utilise le satut par défaut
    if(!where.currentAction) {
        const APPEL = 2
        const SANS_STATUT = null

        where = {
            ...where,
            [Op.or] : [
                { currentAction : SANS_STATUT },
                { currentAction : APPEL }
            ]
        }
    }

    where.dep = { [Op.in] : depsAvailable }

    // sélection du client
    const client = await models.Client.findOne({
        include: [
            {
                model: models.Historique, include: [
                    {model: models.RDV, include: models.Etat},
                    {model: models.Action},
                    {model: models.User}
                ]
            }
        ],
        // order : [[models.Historique, 'createdAt', 'desc']],
        order : [['updatedAt', 'asc'],[models.Historique, 'createdAt', 'desc']],
        where 
    })

    // si un client est trouvé on l'ajoute à la liste des clients en cours d'utilisation
    if(client) {
        global.usedIdLigne.push(client.id)
    }
    // s'il y avait un client précédent, il est retiré de la liste des clients en cours d'utilisation
    if(idCurrentClient){
        global.usedIdLigne.splice( global.usedIdLigne.indexOf(parseInt(idCurrentClient)) , 1)
    }

    return client
}

router.get('/prospection' , async (req, res) => {
    // prospectionGetOrPost(req, res, 'get');

    let client = undefined
    let infos = undefined

    try {
        let currentProspect = undefined
        if(req.session.currentProspect) {
            currentProspect = req.session.currentProspect
            if(isNaN(Number(currentProspect))) currentProspect = undefined

            req.session.currentProspect = undefined
        }

        client = await getProspect(req.session.client.id, currentProspect)
        if(client === null) {
            client = undefined
            infos = clientInformationObject(undefined, "Aucun client disponible.")
        }
    }
    catch(error) {
        client = undefined
        infos = clientInformationObject(error)
    }

    res.render('teleconseiller/telec_prospection', { 
        extractStyles: true, 
        title: 'Prospection | FUEGO', 
        session: req.session.client, 
        description:'Prospection chargé(e) d\'affaires', 
        infos,
        findedClient: client, 
        options_top_bar: 'telemarketing'});
})
.get('/prospection/next/:Id_Client?', (req, res) => {
    const Id_Client = Number(req.params.Id_Client)
    if(!isNaN(Id_Client) && Id_Client) {
        req.session.currentProspect = Id_Client
    }

    res.redirect('/teleconseiller/prospection')
})
.post('/prospection/releaseProspect/:Id_Client', (req, res) => {
    const Id_Client = Number(req.params.Id_Client)

    let infos = undefined

    try {
        if(!isNaN(Id_Client)) {
            global.usedIdLigne.splice( global.usedIdLigne.indexOf(Id_Client) , 1)
        }

        infos = clientInformationObject(undefined, `Le client ${Id_Client} a été retiré de la liste des clients en cours d'utilisation.`)
    }
    catch(error) {
        infos = clientInformationObject(error)
    }

    res.send({ infos })
})

router.post('/prospection' ,async (req, res) => {
    // prospectionGetOrPost(req, res, 'post', req.body.currentClient);

    let client = undefined
    let infos = undefined

    try {
        client = await getProspect(req.session.client.id, req.body.currentClient)
        if(client === null) {
            client = undefined
            infos = clientInformationObject(undefined, "Aucun client disponible.")
        }
    }
    catch(error) {
        client = undefined
        infos = clientInformationObject(error)
    }

    res.send({
        infos,
        findedClient : client
    })
});

router.get('/rappels/:Id' ,(req, res, next) => {
    rappelAndSearch(req, res, next, req.params.Id, 'rappel')
});

router.get('/recherche/:Id' ,(req, res, next) => {
    rappelAndSearch(req, res, next, req.params.Id, 'recherche')
});

router.post('/update' , async (req, res) => {
    let sentClient = req.body
    let infoObject = undefined
    let client = undefined

    try {
        sentClient.id = Number(sentClient.id)

        // ajout client
        if(isNaN(sentClient.id)) {
            sentClient.id = undefined

            // validation des données
            if(sentClient.source === undefined || sentClient.source === 'undefined' || sentClient.source === '') {
                throw 'Une source doit être sélectionnée.'
            }
            sentClient = validations.validationClient(sentClient)

            // vérification si le client existe déjà
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

            client = await models.Client.create(sentClient)

            if(client === null) {
                throw 'Une erreur est survenue lors de la création du client. Veuillez recommencer plus tard.'
            }

            clientInformationObject(undefined, "Le client a bien été créé.")
        }
        // update client
        else {
            // vérifie si le client existe
            client = await models.Client.findOne({
                where : {
                    id : sentClient.id
                }
            })

            if(client === null) throw "Le client demandé est introuvable. Veuillez recommencer plus tard et si l'erreur persiste prévenir votre webmaster."

            // validation des données
            sentClient = validations.validationClient(sentClient)

            // màj client
            await client.update(sentClient)

            // affectation des infos envoyées plutôt que de refaire une requête en BDD
            client = sentClient
            infoObject = clientInformationObject(undefined, "Le client a bien été mis à jour.")
        }
    }
    catch(error) {
        client = undefined
        infoObject = clientInformationObject(error)
    }

    res.send({
        infoObject,
        client
    })

    // if(typeof req.body.id != 'undefined'){
    // models.Client.findOne({ where: { id: req.body.id } })
    // .then((client) => {
    //   if (client) {
    //     client.update(req.body).then((test) => {
    //         res.send('Ok');
    //     }).catch(error => {
    //         console.log(error);
    //         res.send('Pas ok');
    //     })
    //   }
    // })
    // }else{
    //     req.body.dep = req.body.cp.substr(0,2)
    //     models.Client.create(req.body).then((client) => {
    //         res.send({id: client.id});
    //     }).catch(error => {
    //         console.log(error);
    //         res.send('Pas ok');
    //     })
    // }
});

router.post('/call' ,(req, res, next) => {
    ovh.request('POST', '/telephony/'+req.session.client.billing+'/line/'+'0033'+req.session.client.telcall.substr(1)+'/click2Call', {
        'calledNumber': formatPhone(req.body.phone),
        'intercom': true,
    }, (err, result) => {
        console.log(err || result);
    })
});

router.post('/hangup' ,(req, res, next) => {
    ovh.request('GET', '/telephony/mo87260-ovh-2/line/0033972647599/calls/', (err, result) => {
        ovh.request('POST', '/telephony/mo87260-ovh-2/line/0033972647599/calls/'+ result[0] +'/hangup/', (err, result) => {
            console.log(err || result);
        })
    })
});

router.post('/cree/historique' ,async (req, res, next) => {

    req.body.idUser = req.session.client.id

    const client = await models.Client.findOne({
        where : {
            id : req.body.idClient
        }
    })

    if(client !== null) {
        if(client.currentCampagne > 0) {
            req.body.idCampagne = client.currentCampagne
        }

        if(['BADGING', 'PARRAINAGE', 'PERSO' ].includes(client.source )) {
            const appartenanceVendeur = await models.AppartenanceClientsVendeur.findOne(
                {
                    where : {
                        idClient : client.id
                    }
                }
            )
    
            if(appartenanceVendeur !== null) {
                req.body.idVendeur = appartenanceVendeur.idVendeur
            }
        }
    }  
    // models.Client.findOne({
    //     where: {
    //         id: req.body.idClient
    //     }
    // }).then(clicli => {

    // if(clicli.currentCampagne > 0 ){
    //     req.body.idCampagne = clicli.currentCampagne
    // }

    if(isSet(req.body.date)) req.body.date = moment(req.body.date, 'DD/MM/YYYY HH:mm').format('YYYY-MM-DD HH:MM')
    if(isSet(req.body.dateevent)) req.body.dateevent = moment(req.body.dateevent, 'DD/MM/YYYY HH:mm').format('YYYY-MM-DD HH:MM')
        
    models.Historique.create(req.body)
    .then((historique) => {

        if(typeof req.body.prisavec != 'undefined'){
            req.body.idHisto = historique.id
            models.RDV.create(req.body).then( (rdv) => {
                historique.update({idRdv: rdv.id})
                models.RDV.update({
                    statut: 1
                },
                {
                    where: {
                        idClient: req.body.idClient,
                        statut: 3
                    }
                })
            });

        }
        models.Client.findOne({
            where: {
                id: req.body.idClient
            },
            include: {
                model: models.Historique, include: [
                    {model: models.RDV, include: models.Etat},
                    {model: models.Action},
                    {model: models.User}
            ]},
            order : [[models.Historique, 'createdAt', 'desc']],
            limit: 1
        }).then(findedClient => {
            if(findedClient){
                if(historique.idAction != 2){
                    findedClient.update({countNrp: -1, currentAction: historique.idAction, currentUser: historique.idUser}).then((findedClient2) => {
                        res.send({findedClient: findedClient2});
                    });
                }else{
                    if(findedClient.countNrp+1 == 11){
                        models.Historique.create({idAction: 11, idClient: historique.idClient, idUser: historique.idUser})
                        findedClient.update({countNrp: -1, currentAction: 11, currentUser: historique.idUser}).then((findedClient2) => {
                            res.send({findedClient: findedClient2});
                        });
                    }else{
                        findedClient.update({countNrp: findedClient.countNrp+1}).then((findedClient2) => {
                            res.send({findedClient: findedClient2});
                        });
                    }
                }
            }else{
                req.flash('error_msg', 'Un problème est survenu, veuillez réessayer. Si le probleme persiste veuillez en informer votre superieur.');
                res.redirect('/menu');
            }
        }).catch(function (e) {
            console.log('error', e);
        });
    }).catch((err) => {
        console.log(err)
    })

// })
});

router.get('/rappels' ,async (req, res, next) => {
    const dateDebut = req.query.dateDebut
    const dateFin = req.query.dateFin

    let infoObject = undefined
    let clients = undefined

    try {
        let whereParametre = {
            idAction: 8,

        }

        // si les deux sont définis on recherche un interval
        if(isSet(dateDebut) && isSet(dateFin)) {
            const debut = moment(dateDebut, 'DD/MM/YYYY').format('YYYY-MM-DD')
            const fin = moment(dateFin, 'DD/MM/YYYY').format('YYYY-MM-DD')

            const inBetween = {
                dateevent : {
                    [Op.between] : [debut, fin]
                }
            }

            whereParametre = { ...whereParametre, ...inBetween }
        }
        // recherche après la date de début
        else if(isSet(dateDebut)) {
            const debut = moment(dateDebut, 'DD/MM/YYYY').format('YYYY-MM-DD')

            const after = {
                dateevent : {
                    [Op.gte] : debut
                }
            }

            whereParametre = { ...whereParametre, ...after }
        }
        // recherche avant la date de fin
        else if(isSet(dateFin)) {
            const fin = moment(dateFin, 'DD/MM/YYYY').format('YYYY-MM-DD')

            const before = {
                dateevent : {
                    [Op.lte] : fin
                }
            }

            whereParametre = { ...whereParametre, ...before }
        }

        // récupère les clients qui sont en rappel avec leur dernier historique de rappel
        clients = await models.Client.findAll({
            where : {
                currentAction: 8,
                currentUser: req.session.client.id
            },
            include: {
                model: models.Historique, 
                include: [
                    {model: models.RDV, include: models.Etat},
                    {model: models.Action},
                    {model: models.User}
                ], 
                where: whereParametre, 
                order: [
                    ['dateevent', 'desc'],
                    ['createdAt', 'desc']
                ], 
                limit: 1
            }
        })
        
        if(clients === null || clients.length === 0) {
            infoObject = clientInformationObject(undefined, "La liste des rappels est vide.")
            clients = undefined
        }
        else {
            // filtre pour ne garder que les clients avec un historique (car sequelize utilise deux requêtes plutôt qu'une, donc un historique est toujours retourné même si vide)
            clients = clients.filter(client => client.Historiques.length > 0)

            if(clients === null || clients.length === 0) {
                infoObject = clientInformationObject(undefined, "La liste des rappels est vide.")
                clients = undefined
            }
            else {
                // tri les clients selon leur historique de rappel par ordre croissant
                clients = _.orderBy(clients, client => moment(client.Historiques[0].dateevent, 'DD/MM/YYYY HH:mm').format('YYYYMMDDHHmm'), ['asc'])
            }
        }
    }
    catch(error) {
        infoObject = clientInformationObject(error)
    }

    // res.render('teleconseiller/telec_rappels', { extractStyles: true, title: 'Rappels | FUEGO', description:'Rappels chargé(e) d\'affaires', session: req.session.client, options_top_bar: 'telemarketing', findedClients: _.orderBy(findedClients, (o) => { return moment(moment(o.Historiques[0].dateevent, 'DD/MM/YYYY HH:mm')).format('YYYYMMDDHHmm'); }, ['asc'])});
    res.render('teleconseiller/telec_rappels', { extractStyles: true, title: 'Rappels | FUEGO', description:'Rappels chargé(e) d\'affaires', session: req.session.client, options_top_bar: 'telemarketing', infoObject, clients, dateDebut, dateFin })
});

router.get('/rechercher-client' , async (req, res) => {

    let infoObject = undefined
    let actions = undefined
    let sousStatuts = undefined
    let sources = undefined

    try {
        actions = await models.Action.findAll({
            order : [['nom', 'asc']]
        })

        if(actions === null || actions.length === 0) {
            throw "Impossible de récupérer les statuts, veuillez réessayer plus tard."
        }

        sousStatuts = await models.Historique.findAll({
            attributes : [[sequelize.fn('DISTINCT', sequelize.col('sousstatut')), 'sousstatut']],
            where : {
                sousstatut : {
                    [Op.not] : null
                }
            },
            order : [['sousstatut', 'asc']]
        })

        if(sousStatuts === null || sousStatuts.length === 0) {
            throw "Impossible de récupérer les sous-statuts, veuillez réessayer plus tard."
        }

        sources = await models.Source.findAll({
            order : [['nom', 'asc']]
        })
    }
    catch(error) {
        infoObject = clientInformationObject(error)
    }

    res.render('teleconseiller/telec_searchclients', { extractStyles: true, title: 'Rechercher Client | FUEGO', description:'Rechercher Client chargé(e) d\'affaires', session: req.session.client, options_top_bar: 'telemarketing', infoObject, actions, sousStatuts, sources});
    
    
    // models.Action.findAll({
    //     order : [['nom', 'asc']]
    // }).then(findedActions => {
    //     models.sequelize.query('SELECT distinct sousstatut FROM Historiques WHERE sousstatut IS NOT NULL', { type: models.sequelize.QueryTypes.SELECT }).then((findedSousTypes) => {
    //         res.render('teleconseiller/telec_searchclients', { extractStyles: true, title: 'Rechercher Client | FUEGO', description:'Rechercher Client chargé(e) d\'affaires', session: req.session.client, options_top_bar: 'telemarketing', findedActions: findedActions, findedSousTypes: findedSousTypes});
    //     });
    // })
});

router.post('/rechercher-client' ,(req, res, next) => {

    let where = {}

    if(req.body.sousstatut == ''){
        where = {
            [Op.not] : {idAction: 2}
        }
    }else{
        where = {
            [Op.not] : {idAction: 2},
            sousstatut : {[Op.like] : '%'+req.body.sousstatut+'%'}
        }
    }
    models.Client.findAndCountAll({
        include: {
            model: models.Historique,
            required: false,
            include: [
                {model: models.RDV, include: models.Etat},
                {model: models.Action},
                {model: models.User}
            ], 
            where: where
        },
        order : [
            [models.Historique, 'dateevent', 'desc'],
            [models.Historique, 'createdAt', 'desc']
        ],
        where : setQuery(req),
        limit : 30
    }).then(findedClients => {
        res.send({findedClients : findedClients.rows, count: findedClients.count});
    }).catch(function (e) {
        console.error(e)
        console.log('error', e);
    });
});

router.get('/agenda' ,(req, res, next) => {
    res.render('teleconseiller/telec_agenda', { extractStyles: true, title: 'Agenda | FUEGO', description:'Agenda chargé(e) d\'affaires', session: req.session.client, options_top_bar: 'telemarketing'});
});

router.post('/graphe' ,(req, res, next) => {

    let StructuresId = []
    req.session.client.Structures.forEach(s => {
        StructuresId.push(s.id)
    })

    models.sequelize.query("SELECT CONCAT(Users.nom, ' ', prenom) as xAxisID , CAST(count(idEtat) AS UNSIGNED) as yAxisID FROM RDVs JOIN Historiques ON RDVs.id=Historiques.idRdv JOIN Users ON Users.id=Historiques.idUser JOIN UserStructures ON Users.id=UserStructures.idUser JOIN Roles ON Users.idRole=Roles.id WHERE idStructure IN (:structure) AND idEtat=1 AND RDVs.source<>'PERSO' AND date BETWEEN :datedebut AND :datefin AND typeDuRole='TMK' GROUP BY xAxisID ORDER BY yAxisID DESC"
    , { replacements: { 
        structure: StructuresId,
        datedebut: moment().startOf('month').format('YYYY-MM-DD') , 
        datefin: moment().endOf('month').add(1, 'days').format('YYYY-MM-DD')
    }, 
        type: sequelize.QueryTypes.SELECT})
    .then(findgraph => {
        let label = new Array();
        let value = new Array();
        findgraph.forEach(element => {
            label.push(element.xAxisID)
            value.push(element.yAxisID)
        });

        let resultat = new Array(label, value);
        res.send(resultat)
    });
});

router.post('/event' , async (req, res) => {    
    let events = undefined

    try {
        if(!isSet(req.body.start) || !isSet(req.body.end)) throw "L'interval sur lequel les événements doivent être sélectionnés doit être renseigné."

        // récupération des structures auquelles appartient l'utilisateur en cours
        const listeIdsStructures = []
        req.session.client.Structures.forEach(structure => {
            listeIdsStructures.push(structure.id)
        })

        // récupération des commerciaux dépendants de ces structures
        const structuresDependances = await models.Structuresdependence.findAll({
            where : {
                idStructure: listeIdsStructures
            },
            attributes: ['idUser']
        })

        const listeIdsVendeurs = []
        structuresDependances.forEach(dependance => {
            listeIdsVendeurs.push(dependance.idUser)
        })

        const listeRdvs = await models.RDV.findAll({
            attributes : [
                'id', 'date', 'source'
            ],
            include : [
                { 
                    model: models.User, 
                    attributes : ['nom', 'prenom']
                },
                { 
                    model : models.Client,
                    attributes : ['nom', 'prenom', 'cp']
                }
            ],
            where : {
                idVendeur : {
                    [Op.in] : listeIdsVendeurs
                },
                idEtat : {
                    // ANNULE, REPO COMMERCIAL, REPO CLIENT
                    [Op.notIn] : (6,12,13)
                },
                date : {
                    [Op.between] : [req.body.start, req.body.end]
                }
            },
            order : [['date', 'ASC']]
        })
        if(listeRdvs === null) throw "Une erreur s'est produite lors de la récupération de la liste de RDVs."

        events = listeRdvs.map(rdv => {
            return {
                id : rdv.id,
                tooltip : `${rdv.User.nom} ${rdv.User.prenom} : ${rdv.Client.nom} ${rdv.Client.prenom} (${rdv.Client.cp})`,
                title : `${rdv.User.nom} ${rdv.User.prenom}`,
                source : rdv.source,
                start : moment(rdv.date, 'DD/MM/YYYY HH:mm').format('YYYY-MM-DD HH:mm'),
                end : moment(rdv.date, 'DD/MM/YYYY HH:mm').add(2, 'hours').format('YYYY-MM-DD HH:mm')
            }
        })
    }
    catch(error) {
        events = undefined
        clientInformationObject(error)
        res.status(500)
    }

    res.send(events)

    // let idStructure = []
    // req.session.client.Structures.forEach((element => {
    //     idStructure.push(element.id)    
    // }))

    // models.sequelize.query("SELECT DISTINCT RDVs.id, CONCAT(Clients.nom, '_', cp,IF(RDVs.r IS NOT NULL, CONCAT(' / R',RDVs.r), '')) as title, date as start, DATE_ADD(date, INTERVAL 2 HOUR) as end FROM RDVs LEFT JOIN Clients ON RDVs.idClient=Clients.id JOIN Historiques ON RDVs.idHisto=Historiques.id LEFT JOIN Users ON Historiques.idUser=Users.id LEFT JOIN UserStructures ON Users.id=UserStructures.idUser LEFT JOIN Structures ON UserStructures.idStructure=Structures.id LEFT JOIN DepSecteurs ON Clients.dep=DepSecteurs.dep LEFT JOIN Secteurs ON Secteurs.id=DepSecteurs.idSecteur WHERE (idStructure IN (:structure) OR RDVs.source IN ('BADGING', 'PARRAINAGE', 'PERSO')) AND idEtat NOT IN (6,12,13)", { replacements: {structure: idStructure}, type: sequelize.QueryTypes.SELECT})
    // models.sequelize.query("SELECT DISTINCT RDVs.id, CONCAT(Users.nom, ' ', Users.prenom, ' : ', IF(RDVs.r IS NOT NULL, CONCAT('R', RDVs.r, ' / '), ''), Clients.prenom, ' ', Clients.nom, ' (', Clients.cp, ')') as tooltip, CONCAT(Users.nom, ' ', Users.prenom) as title, date as start, DATE_ADD(date, INTERVAL 2 HOUR) as end, RDVs.source as source FROM RDVs LEFT JOIN Clients ON RDVs.idClient=Clients.id JOIN Historiques ON RDVs.idHisto=Historiques.id LEFT JOIN Users ON Historiques.idUser=Users.id LEFT JOIN UserStructures ON Users.id=UserStructures.idUser LEFT JOIN Structures ON UserStructures.idStructure=Structures.id LEFT JOIN DepSecteurs ON Clients.dep=DepSecteurs.dep LEFT JOIN Secteurs ON Secteurs.id=DepSecteurs.idSecteur WHERE (idStructure IN (:structure) OR RDVs.source IN ('BADGING', 'PARRAINAGE', 'PERSO')) AND idEtat NOT IN (6,12,13)", { replacements: {structure: idStructure}, type: sequelize.QueryTypes.SELECT})
    // .then(findedEvent => {
    //     res.send(findedEvent)
    // });
});

router.post('/abs' ,(req, res, next) => {
    // models.sequelize.query("SELECT CONCAT(Users.nom,' ',Users.prenom, '_', motif) as title, start as start, end as end, allDay FROM Events JOIN Users ON Events.idCommercial=Users.id", {type: sequelize.QueryTypes.SELECT})
    models.sequelize.query("SELECT CONCAT(Users.prenom, ' ', Users.nom, ' : ', IF(LENGTH(motif), motif, 'Aucun motif')) as tooltip, CONCAT(Users.nom,' ', Users.prenom) as title, start as start, end as end, allDay FROM Events JOIN Users ON Events.idCommercial=Users.id", {type: sequelize.QueryTypes.SELECT})
    .then(findedAbs => {
        findedAbs.forEach((element, index) => {
            findedAbs[index].allDay = element.allDay
        })
        res.send(findedAbs)
    });
});

function prospectionGetOrPost(req, res, method, usedClient = ""){

    let cp = {}

    let StructuresDep = []
    req.session.client.Structures.forEach(s => {
        s.deps.split(',').forEach(d => {
            StructuresDep.push(d)
        })
    })

    models.User.findOne({
        include: [  
            {model: models.Role, include: models.Privilege},
            {model: models.Directive}
        ],
        where: {
            id: req.session.client.id
        }
    }).then(findedUser => {

        if(findedUser.Directive != null && findedUser.Directive.campagnes != null &&  findedUser.Directive.campagnes != ""){
            let dep = []

            if(findedUser.Directive != null){
                dep = findedUser.Directive.deps.split(',')
            }

            if(typeof dep[0] == 'undefined' || dep[0] == ''){
                cp = {
                    currentCampagne:{
                        [Op.in]: findedUser.Directive.campagnes.split(',')
                    },
                    id: {
                        [Op.notIn]: global.usedIdLigne
                    },
                    dep: StructuresDep,
                    currentAction:{
                        [Op.is]: null
                    }
                }
            }else{
                cp = {
                    dep: dep,
                    currentCampagne:{
                        [Op.in]: findedUser.Directive.campagnes.split(',')
                    },
                    id: {
                        [Op.notIn]: global.usedIdLigne
                    },
                    currentAction:{
                        [Op.is]: null
                    }
                }
            }

        }else{
            let dep = []
            let type = ""
            let sous = ""

            if(findedUser.Directive != null){
                dep = findedUser.Directive.deps.split(',')
                type = findedUser.Directive.type_de_fichier
                sous = findedUser.Directive.sous_type
            }

            if(typeof dep[0] == 'undefined' || dep[0] == ''){
                cp = {
                    source: type,
                    type: sous,
                    currentAction:{
                        [Op.is]: null
                    },
                    id: {
                        [Op.notIn]: global.usedIdLigne
                    },
                    dep: StructuresDep
                }
            }else{
                cp = {
                    dep: dep,
                    source: type,
                    type: sous,
                    currentAction:{
                        [Op.is]: null
                    },
                    id: {
                        [Op.notIn]: global.usedIdLigne
                    }
                }
            }

            if(type == ""){
                delete cp.source
            }
            if(sous == ""){
                delete cp.type
            }
        }

        models.Client.findOne({
            include: {
                model: models.Historique, include: [
                    {model: models.RDV, include: models.Etat},
                    {model: models.Action},
                    {model: models.User}
            ],
            },
            order : [['updatedAt', 'asc'],[models.Historique, 'createdAt', 'desc']],
            where: cp,
            limit: 1
        }).then(findedClient => {
            if(findedClient){

                global.usedIdLigne.push(findedClient.id)
                
                if(usedClient != ""){
                    global.usedIdLigne.splice( global.usedIdLigne.indexOf(parseInt(usedClient)) , 1)
                }
                
                if(method == 'get'){
                    res.render('teleconseiller/telec_prospection', { extractStyles: true, title: 'Prospection | FUEGO', session: req.session.client, description:'Prospection chargé(e) d\'affaires', findedClient: findedClient, options_top_bar: 'telemarketing'});
                }else{
                    res.send({findedClient: findedClient});
                }
            }else{
                req.flash('error_msg', 'Aucun prospect n\'a été trouvé. Si le probleme persiste veuillez en informer votre superieur.');
                res.redirect('/menu');
            }
        }).catch(function (e) {
            console.log(e)
        });
    }).catch(function (e) {
        console.log(e)
    });
}

function setQuery(req){
    
    let StructuresDep = []
    req.session.client.Structures.forEach(s => {
        s.deps.split(',').forEach(d => {
            StructuresDep.push(d)
        })
    })

    let where = {}

    if(req.body.tel != ''){
        where = {
            [Op.or]: {
                tel1 : {[Op.like] : '%'+req.body.tel+'%'},
                tel2 : {[Op.like] : '%'+req.body.tel+'%'},
                tel3 : {[Op.like] : '%'+req.body.tel+'%'},
            },
        }
    }
    if(req.body.statut != ''){
        if(req.body.statut == 'null'){
            where['currentAction'] = null;
        }else{
            where['currentAction'] = req.body.statut;
        }
    }
    if(!StructuresDep.includes(req.body.dep) && req.body.dep != ''){
        where['dep'] = '9999'
    }else{
        if(req.body.dep != ''){
            where['dep'] = req.body.dep
        }else{
            where['dep'] = {[Op.in] : StructuresDep}
        }
    }
    if(req.body.nom != ''){
        where['nom'] = {[Op.like] : '%'+req.body.nom+'%'};
    }
    if(req.body.prenom != ''){
        where['prenom'] = {[Op.like] : '%'+req.body.prenom+'%'};
    }
    if(isSet(req.body.sources) && req.body.sources !== '') {
        const source = {
            source : req.body.sources
        }

        where = { ...where, ...source }
    }

    return where
}

function rappelAndSearch(req, res, next, id, type){
    models.Client.findOne({
        include: {
            model: models.Historique, include: [
                {model: models.RDV, include: models.Etat},
                {model: models.Action},
                {model: models.User}
        ]},
        order : [[models.Historique, 'createdAt', 'desc']],
        where: {
            id: id
        }
    }).then(findedClient => {
        if(findedClient){
            if(type == 'rappel'){
                res.render('teleconseiller/telec_prospection', { extractStyles: true, title: 'Prospection | FUEGO', session: req.session.client, description:'Prospection chargé(e) d\'affaires', findedClient: findedClient, options_top_bar: 'telemarketing', rappels: 'true'});
            }else{
                res.render('teleconseiller/telec_prospection', { extractStyles: true, title: 'Prospection | FUEGO', session: req.session.client, description:'Prospection chargé(e) d\'affaires', findedClient: findedClient, options_top_bar: 'telemarketing', recherche: 'true'});
            }
        }else{
            req.flash('error_msg', 'Un problème est survenu, veuillez réessayer. Si le probleme persiste veuillez en informer votre superieur.');
            //res.redirect('/menu');
        }
    }).catch(function (e) {
        console.log('error', e);
    });
}

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

module.exports = router;