const express = require('express');
const router = express.Router();
const models = require("../models/index");

router.get('/' ,(req, res, next) => {
//    console.log(req.session.client.Role.nom) 
    res.render('mainchoices', { extractStyles: true, title: 'Menu | FUEGO', description:'Menu principal', session: req.session.client, privilege: req.session.client.Role.Privileges, role: req.session.client.Role});
});


module.exports = router;