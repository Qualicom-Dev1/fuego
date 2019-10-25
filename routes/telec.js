const express = require('express')
const router = express.Router()
const models = require("../models/index")
const sequelize = require("sequelize")
const moment = require('moment')
const Op = sequelize.Op
const ovh = require('ovh')({
    endpoint: 'ovh-eu',
    appKey: 'Tbx8U9NgpEGAuPhi',
    appSecret: 'WUuNiMi7Gk5D36xePq7LGtZseaFtmPjA',
    consumerKey: 'dLjmqTznqj68aR6Ga0PFuYDegmsaV7UU'
})

router.get('/' ,(req, res, next) => {
    res.redirect('/teleconseiller/tableau-de-bord');
});

router.get('/tableau-de-bord' ,(req, res, next) => {
    res.render('teleconseiller/telec_dashboard', { extractStyles: true, title: 'Menu', options_top_bar: 'telemarketing'});
});

router.get('/prospection' ,(req, res, next) => {
    prospectionGetOrPost(req, res, next, 'get');
});

router.post('/prospection' ,(req, res, next) => {
    prospectionGetOrPost(req, res, next, 'post');
});

router.get('/rappels/:Id' ,(req, res, next) => {
    rappelAndSearch(req, res, next, req.params.Id, 'rappel')
});

router.get('/recherche/:Id' ,(req, res, next) => {
    rappelAndSearch(req, res, next, req.params.Id, 'recherche')
});

router.post('/update' ,(req, res, next) => {

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
});

router.post('/call' ,(req, res, next) => {

    ovh.request('POST', '/telephony/'+sess.billing+'/line/'+'0033'+sess.telcall.substr(1)+'/click2Call', {
        'calledNumber': req.body.phone,
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

    req.body.idUser = sess.id

    
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
                req.flash('error_msg', 'un problème est survenu veuillez réessayer si le probleme persiste informer en votre superieure');
                res.redirect('/menu');
            }
        }).catch(function (e) {
            req.flash('error', e);
        });
    }).catch((err) => {
        console.log(err)
    })
});

router.get('/ajouter-client' ,(req, res, next) => {
    res.render('teleconseiller/telec_addclient', { extractStyles: true, title: 'Menu', options_top_bar: 'telemarketing'});
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
            currentUser: sess.id
        },
    }).then(findedClients => {
            res.render('teleconseiller/telec_rappels', { extractStyles: true, title: 'Menu', options_top_bar: 'telemarketing', findedClients: findedClients});
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
            res.render('teleconseiller/telec_searchclients', { extractStyles: true, title: 'Menu', options_top_bar: 'telemarketing', findedActions: findedActions, findedSousTypes: findedSousTypes});
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
        where : setQuery(req.body) , limit : 30}).then(findedClients => {
            res.send({findedClients : findedClients.rows, count: findedClients.count});
        }).catch(function (e) {
            console.log('error', e);
        });
});

router.get('/agenda' ,(req, res, next) => {
    res.render('teleconseiller/telec_agenda', { extractStyles: true, title: 'Menu', options_top_bar: 'telemarketing'});
});

router.post('/graphe' ,(req, res, next) => {
    models.sequelize.query("SELECT CONCAT(nom, ' ', prenom) as xAxisID, CAST(count(idEtat) AS UNSIGNED) as yAxisID FROM rdvs JOIN historiques ON rdvs.id=historiques.idRdv JOIN users ON users.id=Historiques.idUser WHERE idEtat=1 AND date BETWEEN :datedebut AND :datefin  GROUP BY xAxisID ORDER BY yAxisID DESC", { replacements: { datedebut: moment().startOf('month').format('YYYY-MM-DD') , datefin: moment().endOf('month').add(1, 'days').format('YYYY-MM-DD')}, type: sequelize.QueryTypes.SELECT})
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
    sess.Structures.forEach((element => {
        idStructure.push(element.id)    
    }))

    models.sequelize.query("SELECT CONCAT(Clients.nom, '_', cp) as title, date as start, DATE_ADD(date, INTERVAL 2 HOUR) as end, backgroundColor FROM RDVs LEFT JOIN Clients ON RDVs.idClient=Clients.id JOIN Historiques ON RDVs.idHisto=Historiques.id LEFT JOIN Users ON Historiques.idUser=Users.id LEFT JOIN userstructures ON Users.id=userstructures.idUser LEFT JOIN Structures ON userstructures.idStructure=Structures.id LEFT JOIN depsecteurs ON Clients.dep=depsecteurs.dep LEFT JOIN Secteurs ON Secteurs.id=depsecteurs.idSecteur WHERE idStructure IN (:structure) AND idEtat NOT IN (6,12,13)", { replacements: {structure: idStructure}, type: sequelize.QueryTypes.SELECT})
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

function prospectionGetOrPost(req, res, next, method){

    models.User.findOne({
        include: [  
            {model: models.Role, include: models.Privilege},
            {model: models.Directive}
        ],
        where: {
            id: sess.id
        }
    }).then(findedUser => {
        let dep = findedUser.Directive.deps.split(', ')
        let type = findedUser.Directive.type_de_fichier
        let sous = findedUser.Directive.sous_type
        let cp = {}
        console.log(dep[0])

        if(dep[0] == ''){
            cp = {
                cp: {
                    [Op.startsWith]: dep
                },
                source: {
                    [Op.substring]: type
                },
                type: {
                    [Op.substring]: sous
                }
            }
        }else{
            cp = {
                dep: dep,
                source: {
                    [Op.substring]: type
                },
                type: {
                    [Op.substring]: sous
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
            order : [[models.Historique, 'createdAt', 'asc'],[sequelize.fn('RAND')]],
            where: cp,
            limit: 1
        }).then(findedClient => {
            if(findedClient){
                if(method == 'get'){
                    res.render('teleconseiller/telec_prospection', { extractStyles: true, title: 'Menu', findedClient: findedClient, options_top_bar: 'telemarketing'});
                }else{
                    res.send({findedClient: findedClient});
                }
            }else{
                req.flash('error_msg', 'un problème est survenu veuillez réessayer si le probleme persiste informer en votre superieure');
                res.redirect('/menu');
            }
        }).catch(function (e) {
            req.flash('error', e);
        });
    }).catch(function (e) {
        req.flash('error', e);
    });
}

function setQuery(req){
    
    let where = {}

    if(req.tel != ''){
        where = {
            [Op.or]: {
                tel1 : {[Op.like] : '%'+req.tel+'%'},
                tel1 : {[Op.like] : '%'+req.tel+'%'},
                tel3 : {[Op.like] : '%'+req.tel+'%'},
            },
        }
    }
    if(req.statut != ''){
        if(req.statut == 'null'){
            where['currentAction'] = null;
        }else{
            where['currentAction'] = req.statut;
        }
    }
    if(req.dep != ''){
        where['dep'] = req.dep;
    }
    if(req.nom != ''){
        where['nom'] = {[Op.like] : '%'+req.nom+'%'};
    }
    if(req.prenom != ''){
        where['prenom'] = {[Op.like] : '%'+req.prenom+'%'};
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
        order : [[models.Historique, 'createdAt', 'asc']],
        where: {
            id: id
        }
    }).then(findedClient => {
        if(findedClient){
            if(type == 'rappel'){
                res.render('teleconseiller/telec_prospection', { extractStyles: true, title: 'Menu', findedClient: findedClient, options_top_bar: 'telemarketing', rappels: 'true'});
            }else{
                res.render('teleconseiller/telec_prospection', { extractStyles: true, title: 'Menu', findedClient: findedClient, options_top_bar: 'telemarketing', recherche: 'true'});
            }
        }else{
            req.flash('error_msg', 'un problème est survenu veuillez réessayer si le probleme persiste informer en votre superieure');
            res.redirect('/menu');
        }
    }).catch(function (e) {
        req.flash('error', e);
    });
}

module.exports = router;