const express = require('express');
const router = express.Router();

router.get('/' ,(req, res, next) => {
    res.render('marketing/gestion', { extractStyles: true, title: 'Menu'});
});

router.get('/besoins-commandes' ,(req, res, next) => {
    res.render('marketing/besoins_commandes', { extractStyles: true, title: 'Menu'});
});

router.get('/suivi-commandes' ,(req, res, next) => {
    res.render('marketing/suivi_commandes', { extractStyles: true, title: 'Menu'});
});


module.exports = router;