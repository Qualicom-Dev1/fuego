const express = require('express');
const router = express.Router();
const models = require("../models/index");
const sequelize = require('sequelize');

router.get('/' ,(req, res, next) => {
    res.redirect('/telec/tableau-de-bord');
});

router.get('/tableau-de-bord' ,(req, res, next) => {
    res.render('telec_dashboard', { extractStyles: true, title: 'Menu'});
});

router.get('/prospection' ,(req, res, next) => {

    models.Client.findOne({
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
            console.log(findedClient)
            res.render('telec_prospection', { extractStyles: true, title: 'Menu', findedClient: findedClient});
        }else{
            req.flash('error_msg', 'un problème est survenu veuillez réessayer si le probleme persiste informer en votre superieure');
            res.redirect('/menu');
        }
    }).catch(function (e) {
        req.flash('error', e);
    });
});

router.post('/prospection' ,(req, res, next) => {

    models.Client.findOne({
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

router.post('/update/historique' ,(req, res, next) => {

    req.body.idUser = req.session.idUser

    models.Historique.create(req.body)
    .then((historique) => {

        res.send('Ok')

    }).catch((err) => {
        console.log(err)
    })
});

router.post('/ajouter/historique' ,(req, res, next) => {

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


router.get('/ajouter-client' ,(req, res, next) => {
    res.render('telec_addclient', { extractStyles: true, title: 'Menu'});
});

router.get('/rappels' ,(req, res, next) => {
    res.render('telec_rappels', { extractStyles: true, title: 'Menu'});
});

router.get('/rechercher-client' ,(req, res, next) => {
    res.render('telec_searchclient', { extractStyles: true, title: 'Menu'});
});

router.get('/agenda' ,(req, res, next) => {
    res.render('telec_agenda', { extractStyles: true, title: 'Menu'});
});



module.exports = router;