const express = require('express');
const router = express.Router();

router.get('/' ,(req, res, next) => {
    res.render('statistiques/stats_campagnes', { extractStyles: true, title: 'Menu', session: req.session.client, options_top_bar: 'statistiques'});
});

router.get('/campagnes' ,(req, res, next) => {
    res.render('statistiques/stats_campagnes', { extractStyles: true, title: 'Menu', session: req.session.client, options_top_bar: 'statistiques'});
});

router.get('/sources' ,(req, res, next) => {
    res.render('statistiques/stats_fichiers', { extractStyles: true, title: 'Menu', session: req.session.client, options_top_bar: 'statistiques'});
});

router.get('/telemarketing' ,(req, res, next) => {
    res.render('statistiques/stats_telemarketing', { extractStyles: true, title: 'Menu', session: req.session.client, options_top_bar: 'statistiques'});
});

router.get('/commerciaux' ,(req, res, next) => {
    res.render('statistiques/stats_vendeurs', { extractStyles: true, title: 'Menu', session: req.session.client, options_top_bar: 'statistiques'});
});


module.exports = router;



