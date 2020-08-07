const express = require('express')
const router = express.Router()
const models = require("../models/index")
const sequelize = require("sequelize")
const moment = require('moment')
const Op = sequelize.Op
const config = require('./../config/config.json');
const dotenv = require('dotenv')
const _ = require('lodash')
dotenv.config();
const validations = require('./utils/validations')
const clientInformationObject = require('./utils/errorHandler')

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

router.get('/a_repositionner' ,(req, res, next) => {

    let StructuresId = []
    let StructuresDeps = []
    req.session.client.Structures.forEach(s => {
        StructuresId.push(s.id)
        s.deps.split(',').forEach(d => {
            StructuresDeps.push(d)
        })
    })
    models.sequelize.query("SELECT c.id, DATE_FORMAT(r.date, '%d/%m/%Y %k:%i') as date, r.statut, Etats.nom as enom, c.nom, c.prenom, c.cp, c.ville, r.commentaire FROM Clients c JOIN RDVs r ON c.id=r.idClient JOIN Etats ON r.idEtat=Etats.id LEFT OUTER JOIN RDVs r2 ON (c.id=r2.idClient AND (r.date < r2.date OR (r.date=r2.date AND r.id < r2.id))) WHERE r2.id IS NULL AND r.idEtat = 2 OR r.statut = 3 AND c.dep IN (:dependence)"
    ,{ replacements: { 
        dependence: StructuresDeps
    }, 
    type: sequelize.QueryTypes.SELECT}
    ).then(findedRdvs => {
            res.render('teleconseiller/telec_a_repositionner', { extractStyles: true, title: 'RDV à repositionner | FUEGO', description:'Liste des prospects avec rdv à repositionner',  session: req.session.client, options_top_bar: 'telemarketing', findedRdvs: findedRdvs});
    }).catch(function (e) {
        req.flash('error', e);
    });
});

router.get('/prospection' ,(req, res, next) => {
    prospectionGetOrPost(req, res, 'get');
});

router.post('/prospection' ,(req, res) => {
    prospectionGetOrPost(req, res, 'post', req.body.currentClient);
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
            order : [[models.Historique, 'createdAt', 'asc'],[sequelize.fn('RAND')]],
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

router.get('/rappels' ,(req, res, next) => {

    models.Client.findAll({
        include: {
            model: models.Historique, include: [
                {model: models.RDV, include: models.Etat},
                {model: models.Action},
                {model: models.User}
        ], where: {
            idAction: 8,
        }, order: [['createdAt', 'desc']], limit: 1
        },
        where: {
            currentAction: 8,
            currentUser: req.session.client.id
        },
    }).then(findedClients => {
            res.render('teleconseiller/telec_rappels', { extractStyles: true, title: 'Rappels | FUEGO', description:'Rappels chargé(e) d\'affaires', session: req.session.client, options_top_bar: 'telemarketing', findedClients: _.orderBy(findedClients, (o) => { return moment(moment(o.Historiques[0].dateevent, 'DD/MM/YYYY HH:mm')).format('YYYYMMDDHHmm'); }, ['asc'])});
    }).catch(function (e) {
        console.log('error', e);
    });
});

router.get('/rechercher-client' ,(req, res, next) => {
    models.Action.findAll({
        order : [['nom', 'asc']]
    }).then(findedActions => {
        models.sequelize.query('SELECT distinct sousstatut FROM Historiques WHERE sousstatut IS NOT NULL', { type: models.sequelize.QueryTypes.SELECT }).then((findedSousTypes) => {
            res.render('teleconseiller/telec_searchclients', { extractStyles: true, title: 'Rechercher Client | FUEGO', description:'Rechercher Client chargé(e) d\'affaires', session: req.session.client, options_top_bar: 'telemarketing', findedActions: findedActions, findedSousTypes: findedSousTypes});
        });
    })
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
            model: models.Historique, required: false ,include: [
                {model: models.RDV, include: models.Etat},
                {model: models.Action},
                {model: models.User}
        ], where: where},
        order : [[models.Historique, 'createdAt', 'desc']],
        where : setQuery(req) , limit : 30}).then(findedClients => {
            res.send({findedClients : findedClients.rows, count: findedClients.count});
        }).catch(function (e) {
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

router.post('/event' ,(req, res, next) => {
    let idStructure = []
    req.session.client.Structures.forEach((element => {
        idStructure.push(element.id)    
    }))

    // models.sequelize.query("SELECT DISTINCT RDVs.id, CONCAT(Clients.nom, '_', cp,IF(RDVs.r IS NOT NULL, CONCAT(' / R',RDVs.r), '')) as title, date as start, DATE_ADD(date, INTERVAL 2 HOUR) as end FROM RDVs LEFT JOIN Clients ON RDVs.idClient=Clients.id JOIN Historiques ON RDVs.idHisto=Historiques.id LEFT JOIN Users ON Historiques.idUser=Users.id LEFT JOIN UserStructures ON Users.id=UserStructures.idUser LEFT JOIN Structures ON UserStructures.idStructure=Structures.id LEFT JOIN Depsecteurs ON Clients.dep=Depsecteurs.dep LEFT JOIN Secteurs ON Secteurs.id=Depsecteurs.idSecteur WHERE (idStructure IN (:structure) OR RDVs.source IN ('BADGING', 'PARRAINAGE', 'PERSO')) AND idEtat NOT IN (6,12,13)", { replacements: {structure: idStructure}, type: sequelize.QueryTypes.SELECT})
    models.sequelize.query("SELECT DISTINCT RDVs.id, CONCAT(Users.nom, ' ', Users.prenom, ' : ', IF(RDVs.r IS NOT NULL, CONCAT(' / R', RDVs.r, ' '), ''), Clients.prenom, ' ', Clients.nom, ' (', Clients.cp, ')') as tooltip, CONCAT(Users.nom, ' ', Users.prenom) as title, date as start, DATE_ADD(date, INTERVAL 2 HOUR) as end, RDVs.source as source FROM RDVs LEFT JOIN Clients ON RDVs.idClient=Clients.id JOIN Historiques ON RDVs.idHisto=Historiques.id LEFT JOIN Users ON Historiques.idUser=Users.id LEFT JOIN UserStructures ON Users.id=UserStructures.idUser LEFT JOIN Structures ON UserStructures.idStructure=Structures.id LEFT JOIN Depsecteurs ON Clients.dep=Depsecteurs.dep LEFT JOIN Secteurs ON Secteurs.id=Depsecteurs.idSecteur WHERE (idStructure IN (:structure) OR RDVs.source IN ('BADGING', 'PARRAINAGE', 'PERSO')) AND idEtat NOT IN (6,12,13)", { replacements: {structure: idStructure}, type: sequelize.QueryTypes.SELECT})
    .then(findedEvent => {
        res.send(findedEvent)
    });
});

router.post('/abs' ,(req, res, next) => {
    // models.sequelize.query("SELECT CONCAT(Users.nom,' ',Users.prenom, '_', motif) as title, start as start, end as end, allDay FROM Events JOIN Users ON Events.idCommercial=Users.id", {type: sequelize.QueryTypes.SELECT})
    models.sequelize.query("SELECT CONCAT(Users.prenom, ' ', Users.nom, ' : ', IF(LENGTH(motif), motif, 'Aucun motif')) as tooltip, CONCAT(Users.nom,' ', Users.prenom) as title, start as start, end as end, allDay FROM Events JOIN Users ON Events.idCommercial=Users.id", {type: sequelize.QueryTypes.SELECT})
    .then(findedAbs => {
        findedAbs.forEach((element, index) => {
            if(element.allDay == 'false'){
                findedAbs[index].allDay = false
            }else{
                findedAbs[index].allDay = true
            }
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
                        [Op.notIn]: usedIdLigne
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
                        [Op.notIn]: usedIdLigne
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
                        [Op.notIn]: usedIdLigne
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
                        [Op.notIn]: usedIdLigne
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

                usedIdLigne.push(findedClient.id)
                
                if(usedClient != ""){
                    usedIdLigne.splice( usedIdLigne.indexOf(parseInt(usedClient)) , 1)
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