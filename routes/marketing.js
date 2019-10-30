const express = require('express');
const router = express.Router();

router.get('/' ,(req, res, next) => {
    res.render('marketing/gestion', { extractStyles: true, title: 'Gestion Marketing | FUEGO', description:'Gestion Marketing', session: req.session.client, options_top_bar: 'marketing'});
});

router.get('/besoins-commandes' ,(req, res, next) => {
    res.render('marketing/besoins_commandes', { extractStyles: true, title: 'Besoins commandes | FUEGO', description:'Détail des besoins commande Marketing', session: req.session.client, options_top_bar: 'marketing'});
});

router.get('/suivi-commandes' ,(req, res, next) => {
    res.render('marketing/suivi_commandes', { extractStyles: true, title: 'Suivi commandes | FUEGO', description:'Suivi des commandes de leads Marketing', session: req.session.client, options_top_bar: 'marketing'});
});


module.exports = router;