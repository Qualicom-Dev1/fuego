const express = require('express');
const router = express.Router();
const models = global.db;

router.get('/' ,(req, res, next) => {
    res.render('mainchoices', { extractStyles: true, title: 'Menu | FUEGO', description:'Menu principal', session: req.session.client, privilege: req.session.client.Role.Privileges, role: req.session.client.Role});
});


module.exports = router;