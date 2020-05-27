const express = require('express');
const router = express.Router();

router.get('/' ,(req, res, next) => {
    res.render('terrain/terrain_addclient', { extractStyles: true, title: 'Ajouter un prospect | FUEGO', description:'Ajouter un prospect',  session: req.session.client, options_top_bar: 'terrain'});
});


router.get('/ajouter-un-prospect' ,(req, res, next) => {
    res.render('terrain/terrain_addclient', { extractStyles: true, title: 'Ajouter un prospect | FUEGO', description:'Ajouter un prospect',  session: req.session.client, options_top_bar: 'terrain'});
});

router.get('/rechercher-un-prospect' ,(req, res, next) => {
    res.render('terrain/terrain_searchclients', { extractStyles: true, title: 'Rechercher un badging | FUEGO', description:'Rechercher un badging',  session: req.session.client, options_top_bar: 'terrain'});
});
router.get('/liste-rendez-vous' ,(req, res, next) => {
    res.render('terrain/terrain_listerdv', { extractStyles: true, title: 'Liste rendez-vous | FUEGO', description:'Liste rendez-vous',  session: req.session.client, options_top_bar: 'terrain'});
});

router.get('/objectifs' ,(req, res, next) => {
    res.render('terrain/terrain_objectifs', { extractStyles: true, title: 'Rechercher un prospect | FUEGO', description:'Rechercher un prospect',  session: req.session.client, options_top_bar: 'terrain'});
});



module.exports = router;