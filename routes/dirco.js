const express = require('express');
const router = express.Router();

router.get('/' ,(req, res, next) => {
    res.redirect('/dirco/tableau-de-bord');
});

router.get('/tableau-de-bord' ,(req, res, next) => {
    res.render('/dirco/dirco_dashboard', { extractStyles: true, title: 'Menu'});
});

router.get('/rdv' ,(req, res, next) => {
    res.render('/dirco/dirco_rdv', { extractStyles: true, title: 'Menu'});
});

router.get('/agenda' ,(req, res, next) => {
    res.render('/dirco/dirco_agenda', { extractStyles: true, title: 'Menu'});
});

router.get('/histo' ,(req, res, next) => {
    res.render('/dirco/dirco_histo', { extractStyles: true, title: 'Menu'});
});


module.exports = router;