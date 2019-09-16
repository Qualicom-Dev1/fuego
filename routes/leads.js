const express = require('express');
const router = express.Router();

router.get('/' ,(req, res, next) => {
    res.render('leads/leads_a_importer', { extractStyles: true, title: 'Menu'});
});

router.get('/campagnes' ,(req, res, next) => {
    res.render('leads/campagnes', { extractStyles: true, title: 'Menu'});
});

router.get('/suivi-commandes' ,(req, res, next) => {
    res.render('leads/suivi_commandes', { extractStyles: true, title: 'Menu'});
});


module.exports = router;