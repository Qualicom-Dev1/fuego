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

router.post('/import/import' ,(req, res, next) => {
    JSON.parse(req.body.liste).forEach((element) => {
        models.Client.findOne({
            where : {
                nom: element.nom,
                prenom: element.prenom,
                adresse: element.adresse
            }
        }).then(findedClient => {

        })
    })
    res.send('OK')
});

router.get('/gestion' ,(req, res, next) => {
    res.render('leads/leads_recus', { extractStyles: true, title: 'Leads reçus | FUEGO', description:'Gestion des leads reçus', session: req.session.client,options_top_bar: 'leads'});
});


module.exports = router;



