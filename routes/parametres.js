const express = require('express');
const router = express.Router();

router.get('/commerciaux' ,(req, res, next) => {
    res.render('parametres/equipes_commerciaux', { extractStyles: true, title: 'Menu', options_top_bar: 'parametres'});
});
router.get('/' ,(req, res, next) => {
    res.render('parametres/equipes_commerciaux', { extractStyles: true, title: 'Menu', options_top_bar: 'parametres'});
});

router.get('/telemarketing' ,(req, res, next) => {
    res.render('parametres/equipes_telemarketing', { extractStyles: true, title: 'Menu', options_top_bar: 'parametres'});
});

router.get('/utilisateurs' ,(req, res, next) => {
    res.render('parametres/roles_privileges', { extractStyles: true, title: 'Menu', options_top_bar: 'parametres'});
});

router.get('/secteurs' ,(req, res, next) => {
    res.render('parametres/zones_deps', { extractStyles: true, title: 'Menu', options_top_bar: 'parametres'});
});


module.exports = router;



