const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const session = require('express-session');
const models = require("../models/index");

const Sequelize = require("sequelize");
const Op = Sequelize.Op;

router.get('/' ,(req, res, next) => {
    res.render('index', { extractStyles: true, title: 'INDEX'});
});

/*bcrypt.hash('root', 10, function(err, hash) {
    console.log(hash)
});*/

router.post('/', (req, res) => {

    models.User.findOne({
        where: {
            [Op.or]: [{login: req.body.login}, {mail: req.body.login}]
        }, include: 'role'
    }).then(findedUser => {
        sess = req.session;
        if(findedUser){
            bcrypt.compare(req.body.pass, findedUser.password).then((match) => {
                if(match){
                    sess.user = findedUser;
                    req.flash('success_msg', 'Bienvenu '+sess.nom);
                    res.redirect('/menu');
                }else{
                    req.flash('error_msg', 'Mauvais mot de passe ou identifiant/Email');
                    res.redirect('/');
                }
            });

        }else{
            req.flash('error_msg', 'Mauvais mot de passe ou identifiant/Email');
            res.redirect('/');
        }
    }).catch(function (e) {
        req.flash('error', e);
    });
});

module.exports = router;