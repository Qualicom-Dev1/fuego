const express = require('express');
const router = express.Router();

router.get('/' ,(req, res, next) => {
    res.redirect('/manager/tableau-de-bord');
});

router.get('/tableau-de-bord' ,(req, res, next) => {
    res.render('manager_dashboard', { extractStyles: true, title: 'Menu'});
});

router.get('/directives' ,(req, res, next) => {
    res.render('manager_directives', { extractStyles: true, title: 'Menu'});
});

router.get('/dem-suivi' ,(req, res, next) => {
    res.render('manager_rdv_demsuivi', { extractStyles: true, title: 'Menu'});
});

router.get('/agenda' ,(req, res, next) => {
    res.render('manager_agenda', { extractStyles: true, title: 'Menu'});
});

module.exports = router;