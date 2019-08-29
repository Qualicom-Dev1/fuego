const express = require('express');
const router = express.Router();
const models = require("../models/index");

router.get('/' ,(req, res, next) => {
    res.render('mainchoices', { extractStyles: true, title: 'Menu', privilege: sess.Role.Privileges});
});


module.exports = router;