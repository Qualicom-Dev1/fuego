const express = require('express');
const router = express.Router();

router.get('/' ,(req, res, next) => {
    res.render('badging/badging_addclient', { extractStyles: true, title: 'Ajouter un badging | FUEGO', description:'Ajouter un badging',  session: req.session.client, options_top_bar: 'badging'});
});


router.get('/ajouter-un-badging' ,(req, res, next) => {
    res.render('badging/badging_addclient', { extractStyles: true, title: 'Ajouter un badging | FUEGO', description:'Ajouter un badging',  session: req.session.client, options_top_bar: 'badging'});
});

router.get('/rechercher-un-badging' ,(req, res, next) => {
    res.render('badging/badging_searchclients', { extractStyles: true, title: 'Rechercher un badging | FUEGO', description:'Rechercher un badging',  session: req.session.client, options_top_bar: 'badging'});
});


module.exports = router;