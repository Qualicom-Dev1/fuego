const express = require('express');
const router = express.Router();
const models = require("../models/index");

router.get('/' ,(req, res, next) => {
    res.render('mainchoices', { extractStyles: true, title: 'Menu', session: req.session.client ,privilege: req.session.client.Role.Privileges});
});


module.exports = router;