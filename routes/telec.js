const express = require('express')
const router = express.Router()
const models = require("../models/index")
const sequelize = require("sequelize")
const moment = require('moment')
const Op = sequelize.Op
const config = require('./../config/config.json');
const dotenv = require('dotenv')
dotenv.config();

const ovh = require('ovh')(config["OVH"])

require('../globals')

router.get('/' ,(req, res, next) => {
    res.redirect('/teleconseiller/tableau-de-bord');
});

router.get('/tableau-de-bord' ,(req, res, next) => {
    res.render('teleconseiller/telec_dashboard', { extractStyles: true, title: 'Tableau de bord | FUEGO', description:'Tableau de bord chargé(e) d\'affaires',  session: req.session.client, options_top_bar: 'telemarketing'});
});

router.get('/ajouter-client' ,(req, res, next) => {
    res.render('teleconseiller/telec_addclient', { extractStyles: true, title: 'Ajouter prospect | FUEGO', description:'Ajout de prospect',  session: req.session.client, options_top_bar: 'telemarketing'});
});

router.get('/a_repositionner' ,(req, res, next) => {
    res.render('teleconseiller/telec_a_repositionner', { extractStyles: true, title: 'RDV à repositionner | FUEGO', description:'Liste des prospects avec rdv à repositionner',  session: req.session.client, options_top_bar: 'telemarketing'});
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

router.post('/update' ,(req, res, next) => {

    if(typeof req.body.id != 'undefined'){
    models.Client.findOne({ where: { id: req.body.id } })
    .then((client) => {
      if (client) {
        client.update(req.body).then(() => {
            res.send('Ok');
        }).catch(error => {
            console.log(error);
            res.send('Pas ok');
        })
      }
    })
    }else{
        req.body.dep = req.body.cp.substr(0,2)
        models.Client.create(req.body).then((client) => {
            res.send({id: client.id});
        }).catch(error => {
            console.log(error);
            res.send('Pas ok');
        })
    }
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

router.post('/cree/historique' ,(req, res, next) => {

    req.body.idUser = req.session.client.id

    
    models.Historique.create(req.body)
    .then((historique) => {

        if(typeof req.body.prisavec != 'undefined'){
            req.body.idHisto = historique.id
            models.RDV.create(req.body).then( (rdv) => {
                historique.update({idRdv: rdv.id})
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
            res.render('teleconseiller/telec_rappels', { extractStyles: true, title: 'Rappels | FUEGO', description:'Rappels chargé(e) d\'affaires', session: req.session.client, options_top_bar: 'telemarketing', findedClients: findedClients});
    }).catch(function (e) {
        console.log('error', e);
    });
});

router.get('/rechercher-client' ,(req, res, next) => {
    models.Action.findAll({
        order : [['nom', 'asc']]
    }).then(findedActions => {
        models.sequelize.query('SELECT distinct sousstatut FROM Historiques WHERE sousstatut IS NOT NULL', { type: models.sequelize.QueryTypes.SELECT }).then((findedSousTypes) => {
            console.log(findedSousTypes[0].sousstatut)
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
    models.sequelize.query("SELECT CONCAT(nom, ' ', prenom) as xAxisID , CAST(count(idEtat) AS UNSIGNED) as yAxisID FROM RDVs JOIN Historiques ON RDVs.id=Historiques.idRdv JOIN Users ON Users.id=Historiques.idUser JOIN UserStructures ON Users.id=UserStructures.idUser WHERE idStructure=:structure AND idEtat=1 AND RDVs.source='TMK' AND date BETWEEN :datedebut AND :datefin  GROUP BY xAxisID ORDER BY yAxisID DESC"
    , { replacements: { 
        structure: req.session.client.Structures[0].id,
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

    models.sequelize.query("SELECT CONCAT(Clients.nom, '_', cp) as title, date as start, DATE_ADD(date, INTERVAL 2 HOUR) as end, backgroundColor FROM RDVs LEFT JOIN Clients ON RDVs.idClient=Clients.id JOIN Historiques ON RDVs.idHisto=Historiques.id LEFT JOIN Users ON Historiques.idUser=Users.id LEFT JOIN UserStructures ON Users.id=UserStructures.idUser LEFT JOIN Structures ON UserStructures.idStructure=Structures.id LEFT JOIN Depsecteurs ON Clients.dep=Depsecteurs.dep LEFT JOIN Secteurs ON Secteurs.id=Depsecteurs.idSecteur WHERE idStructure IN (:structure) AND idEtat NOT IN (6,12,13)", { replacements: {structure: idStructure}, type: sequelize.QueryTypes.SELECT})
    .then(findedEvent => {
        res.send(findedEvent)
    });
});

router.post('/abs' ,(req, res, next) => {
    models.sequelize.query("SELECT CONCAT(Users.nom,' ',Users.prenom, '_', motif) as title, start as start, end as end, allDay FROM Events JOIN Users ON Events.idCommercial=Users.id", {type: sequelize.QueryTypes.SELECT})
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

    models.User.findOne({
        include: [  
            {model: models.Role, include: models.Privilege},
            {model: models.Directive}
        ],
        where: {
            id: req.session.client.id
        }
    }).then(findedUser => {
        let dep = []
        let type = ""
        let sous = ""

        console.log(findedUser.Directive != null)
        if(findedUser.Directive != null){
            dep = findedUser.Directive.deps.split(', ')
            type = findedUser.Directive.type_de_fichier
            sous = findedUser.Directive.sous_type
        }
        let cp = {}

        console.log(type)
        console.log(sous)

        if(typeof dep[0] == 'undefined' || dep[0] == ''){
            cp = {
                source: {
                    [Op.substring]: type
                },
                type: {
                    [Op.substring]: sous
                },
                currentAction:{
                    [Op.is]: null
                },
                id: {
                    [Op.notIn]: usedIdLigne
                },
                dep: req.session.client.Structures[0].deps.split(',')
            }
        }else{
            cp = {
                dep: dep,
                source: {
                    [Op.substring]: type
                },
                type: {
                    [Op.substring]: sous
                },
                currentAction:{
                    [Op.is]: null
                },
                id: {
                    [Op.notIn]: usedIdLigne
                }
            }
        }

        models.Client.findOne({
            include: {
                model: models.Historique, include: [
                    {model: models.RDV, include: models.Etat},
                    {model: models.Action},
                    {model: models.User}
            ]},
            order : [['updatedAt', 'asc']],
            where: cp,
            limit: 1
        }).then(findedClient => {
            if(findedClient){

                usedIdLigne.push(findedClient.id)

                if(usedClient != ""){
                    usedIdLigne.splice( usedIdLigne.indexOf(parseInt(usedClient)) , 1)
                }
                console.log(usedIdLigne)
                if(method == 'get'){
                    res.render('teleconseiller/telec_prospection', { extractStyles: true, title: 'Prospection | FUEGO', description:'Prospection chargé(e) d\'affaires', findedClient: findedClient, options_top_bar: 'telemarketing'});
                }else{
                    res.send({findedClient: findedClient});
                }
            }else{
                req.flash('error_msg', 'Un problème est survenu, veuillez réessayer. Si le probleme persiste veuillez en informer votre superieur.');
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
    
    let where = {}

    if(req.body.tel != ''){
        where = {
            [Op.or]: {
                tel1 : {[Op.like] : '%'+req.body.tel+'%'},
                tel1 : {[Op.like] : '%'+req.body.tel+'%'},
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
    if(!req.session.client.Structures[0].deps.split(',').includes(req.body.dep) && req.body.dep != ''){
        where['dep'] = '9999'
    }else{
        if(req.body.dep != ''){
            where['dep'] = req.body.dep
        }else{
            where['dep'] = {[Op.in] : req.session.client.Structures[0].deps.split(',')}
        }
    }
    if(req.body.nom != ''){
        where['nom'] = {[Op.like] : '%'+req.body.nom+'%'};
    }
    if(req.body.prenom != ''){
        where['prenom'] = {[Op.like] : '%'+req.body.prenom+'%'};
    }

    console.log(where)

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
        order : [[models.Historique, 'createdAt', 'asc']],
        where: {
            id: id
        }
    }).then(findedClient => {
        if(findedClient){
            if(type == 'rappel'){
                res.render('teleconseiller/telec_prospection', { extractStyles: true, title: 'Prospection | FUEGO', description:'Prospection chargé(e) d\'affaires', findedClient: findedClient, options_top_bar: 'telemarketing', rappels: 'true'});
            }else{
                res.render('teleconseiller/telec_prospection', { extractStyles: true, title: 'Prospection | FUEGO', description:'Prospection chargé(e) d\'affaires', findedClient: findedClient, options_top_bar: 'telemarketing', recherche: 'true'});
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
    console.log(input)
    input.toString().trim().split('/\s*\([^)]*\)/').join('').split('/[^a-zA-Z0-9]/s').join('')
	return input.toString().toLowerCase()
}

module.exports = router;