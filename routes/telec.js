const express = require('express')
const router = express.Router()
const models = require("../models/index")
const sequelize = require("sequelize")
const Op = sequelize.Op


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
    models.Client.findOne({
        include: {
            model: models.Historique, include: [
                {model: models.RDV, include: models.Etat},
                {model: models.Action},
                {model: models.User}
        ]},
        order : [[models.Historique, 'createdAt', 'asc']],
        where: {
            id: req.params.Id
        }
    }).then(findedClient => {
        if(findedClient){
            res.render('teleconseiller/telec_prospection', { extractStyles: true, title: 'Menu', findedClient: findedClient, options_top_bar: 'telemarketing', rappels: 'true'});
        }else{
            req.flash('error_msg', 'un problème est survenu veuillez réessayer si le probleme persiste informer en votre superieure');
            res.redirect('/menu');
        }
    }).catch(function (e) {
        req.flash('error', e);
    });
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
                    findedClient.update({currentAction: historique.idAction, currentUser: historique.idUser}).then((findedClient2) => {
                        res.send({findedClient: findedClient2});
                    });
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

module.exports = router;