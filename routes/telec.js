const express = require('express')
const router = express.Router()
const models = require("../models/index")
const sequelize = require("sequelize")
const Op = sequelize.Op

router.get('/' ,(req, res, next) => {
    res.redirect('/telec/tableau-de-bord');
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
                res.send({findedClient: findedClient});
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
            model: models.Historique, where : {
                idUser: sess.id,
                [Op.not] : {idAction: 2},
            },
            limit: 1, order: [['createdAt', 'desc']], 
            include: [
                {model: models.RDV, include: models.Etat},
                {model: models.Action},
                {model: models.User}
        ],
        },
    }).then(findedClients => {
        if(findedClients){
            findedClients.forEach( (element, index) => {
                if(typeof element.Historiques[0] != 'undefined'){
                    console.log(element.Historiques[0].idAction)
                    if(element.Historiques[0].idAction != 8){
                        delete findedClients[index]
                    }
                }else{
                    delete findedClients[index]
                }
            })
            res.render('teleconseiller/telec_rappels', { extractStyles: true, title: 'Menu', options_top_bar: 'telemarketing', findedClients: findedClients});
        }else{
            req.flash('error_msg', 'un problème est survenu veuillez réessayer si le probleme persiste informer en votre superieure');
            res.redirect('/menu');
        }
    }).catch(function (e) {
        console.log('error', e);
    });
});

router.get('/rechercher-client' ,(req, res, next) => {
    res.render('teleconseiller/telec_searchclients', { extractStyles: true, title: 'Menu', options_top_bar: 'telemarketing'});
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

module.exports = router;