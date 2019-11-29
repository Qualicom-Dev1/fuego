const express = require('express');
const router = express.Router();

router.get('/leads_a_importer' ,(req, res, next) => {
    res.render('leads/leads_a_importer', { extractStyles: true, title: 'Leads à importer | FUEGO', description:'Derniers leads reçus à importer',  session: req.session.client,options_top_bar: 'leads'});
});
router.get('/' ,(req, res, next) => {
    res.render('leads/leads_recus', { extractStyles: true, title: 'Leads reçus | FUEGO', description:'Gestion des leads reçus',  session: req.session.client,options_top_bar: 'leads'});
});

router.get('/campagnes' ,(req, res, next) => {
    res.render('leads/campagnes', { extractStyles: true, title: 'Campagnes | FUEGO', description:'Ajout, gestion des campagnes', session: req.session.client,options_top_bar: 'leads'});
});

router.get('/import' ,(req, res, next) => {
    res.render('leads/import', { extractStyles: true, title: 'Import | FUEGO', description:'Import prestataire',  session: req.session.client,options_top_bar: 'leads'});
});

router.post('/import/test' ,(req, res, next) => {
    console.log(req)
    res.render('leads/import', { extractStyles: true, title: 'Import | FUEGO', description:'Import prestataire',  session: req.session.client,options_top_bar: 'leads'});

});

router.get('/gestion' ,(req, res, next) => {
    res.render('leads/leads_recus', { extractStyles: true, title: 'Leads reçus | FUEGO', description:'Gestion des leads reçus', session: req.session.client,options_top_bar: 'leads'});
});


module.exports = router;



