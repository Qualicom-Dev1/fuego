const express = require('express')
const router = express.Router()
const models = require("../models/index")
const sequelize = require("sequelize")
const Op = sequelize.Op

router.get('/' ,(req, res, next) => {
    res.redirect('/telec/tableau-de-bord');
});

router.get('/tableau-de-bord' ,(req, res, next) => {
    res.render('telec_dashboard', { extractStyles: true, title: 'Menu', options_top_bar: 'telemarketing'});
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
    res.render('telec_addclient', { extractStyles: true, title: 'Menu', options_top_bar: 'telemarketing'});
});

router.get('/rappels' ,(req, res, next) => {
    res.render('telec_rappels', { extractStyles: true, title: 'Menu', options_top_bar: 'telemarketing'});
});

router.get('/rechercher-client' ,(req, res, next) => {
    res.render('telec_searchclients', { extractStyles: true, title: 'Menu', options_top_bar: 'telemarketing'});
});

router.get('/agenda' ,(req, res, next) => {
    res.render('telec_agenda', { extractStyles: true, title: 'Menu', options_top_bar: 'telemarketing'});
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
        models.Client.findOne({
            include: {
                model: models.Historique, include: [
                    {model: models.RDV, include: models.Etat},
                    {model: models.Action},
                    {model: models.User}
            ]},
            order : [[models.Historique, 'createdAt', 'asc'],[sequelize.fn('RAND')]],
            where: {
                cp: {
                    [Op.startsWith]: dep
                },
                source: {
                    [Op.substring]: type
                },
                type: {
                    [Op.substring]: sous
                },
            },
            limit: 1
        }).then(findedClient => {
            if(findedClient){
                if(method == 'get'){
                    res.render('telec_prospection', { extractStyles: true, title: 'Menu', findedClient: findedClient, options_top_bar: 'telemarketing'});
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