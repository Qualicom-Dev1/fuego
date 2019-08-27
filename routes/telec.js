const express = require('express');
const router = express.Router();

router.get('/' ,(req, res, next) => {
    res.redirect('/telec/tableau-de-bord');
});

router.get('/tableau-de-bord' ,(req, res, next) => {
    res.render('telec_dashboard', { extractStyles: true, title: 'Menu'});
});

router.get('/prospection' ,(req, res, next) => {
    res.render('telec_prospection', { extractStyles: true, title: 'Menu'});
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