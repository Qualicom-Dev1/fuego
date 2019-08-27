const express = require('express');
const router = express.Router();

router.get('/' ,(req, res, next) => {
    res.render('mainchoices', { extractStyles: true, title: 'Menu'});
});

module.exports = router;