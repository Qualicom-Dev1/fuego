const express = require('express');
const router = express.Router();
const models = require("../models/index");

router.get('/' ,(req, res, next) => {
    res.render('mainchoices', { extractStyles: true, title: 'Menu'});
    
    models.User.findOne({
        where: {login: 'root'}, 
        include: [
            {model: models.Role, include: models.Privilege},
        ],
    }).then(findedUser => {
        console.log(findedUser.Role.Privileges)
    }).catch(function (e) {
        console.log(e)
        req.flash('error', e);
    });

});


module.exports = router;