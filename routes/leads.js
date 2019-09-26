const express = require('express');
const router = express.Router();

router.get('/leads_a_importer' ,(req, res, next) => {
    res.render('leads/leads_a_importer', { extractStyles: true, title: 'Menu', options_top_bar: 'leads'});
});
router.get('/' ,(req, res, next) => {
    res.render('leads/leads_a_importer', { extractStyles: true, title: 'Menu', options_top_bar: 'leads'});
});

router.get('/campagnes' ,(req, res, next) => {
    res.render('leads/campagnes', { extractStyles: true, title: 'Menu', options_top_bar: 'leads'});
});

router.get('/import' ,(req, res, next) => {
    res.render('leads/import', { extractStyles: true, title: 'Menu', options_top_bar: 'leads'});
});

router.get('/gestion' ,(req, res, next) => {
    res.render('leads/leads_recus', { extractStyles: true, title: 'Menu', options_top_bar: 'leads'});
});


module.exports = router;



