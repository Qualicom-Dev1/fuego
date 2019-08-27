const express = require('express');
const router = express.Router();

router.get('/' ,(req, res, next) => {
    res.redirect('/vendeur/tableau-de-bord');
});

router.get('/tableau-de-bord' ,(req, res, next) => {
    res.render('vendeur_dashboard', { extractStyles: true, title: 'Menu'});
});

router.get('/ventes' ,(req, res, next) => {
    res.render('vendeur_ventes', { extractStyles: true, title: 'Menu'});
});

router.get('/dem-suivi' ,(req, res, next) => {
    res.render('vendeur_demsuivi', { extractStyles: true, title: 'Menu'});
});

module.exports = router;