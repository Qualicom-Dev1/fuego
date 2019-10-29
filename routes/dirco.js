const express = require('express');
const router = express.Router();

router.get('/' ,(req, res, next) => {
    res.redirect('/vendeur/dirco_dashboard');
});

router.get('/tableau-de-bord' ,(req, res, next) => {
    res.render('./vendeur/dirco_dashboard', { extractStyles: true, title: 'Menu', session: req.session.client, options_top_bar: 'commerciaux'});
});

router.get('/rendez-vous' ,(req, res, next) => {
    res.render('./vendeur/dirco_rdv', { extractStyles: true, title: 'Menu',  session: req.session.client,options_top_bar: 'commerciaux'});
});

router.get('/agenda' ,(req, res, next) => {
    res.render('./vendeur/dirco_agenda', { extractStyles: true, title: 'Menu',  session: req.session.client,options_top_bar: 'commerciaux'});
});

router.get('/historique' ,(req, res, next) => {
    res.render('./vendeur/dirco_histo', { extractStyles: true, title: 'Menu',  session: req.session.client,options_top_bar: 'commerciaux'});
});


module.exports = router;