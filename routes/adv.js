const express = require('express');
const router = express.Router();

router.get('/' ,(req, res, next) => {
    res.render('adminventes/adv_ventes', { extractStyles: true, title: 'Menu', options_top_bar: 'adv'});
});
router.get('/adv_ventes' ,(req, res, next) => {
    res.render('adminventes/ventes', { extractStyles: true, title: 'Menu', options_top_bar: 'adv'});
});



module.exports = router;