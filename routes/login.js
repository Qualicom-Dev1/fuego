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

router.post('/', (req, res) => {

    models.User.findOne({
        where: {
            [Op.or]: [{login: req.body.login}, {mail: req.body.login}]
        }, include: 'role'
    }).then(findedUser => {

        sess = req.session;

        console.log('tet');

        if(findedUser){

            console.log(findedUser.password);
            console.log(req.body.pass);

            bcrypt.compare(req.body.pass, findedUser.password).then((match) => {
                console.log('test3');
                console.log(match);
                if(match){
                    sess.user = findedUser;
                    console.log(sess);
                    res.redirect('/menu');
                }else{
                    res.redirect('/');
                }
            });

        }else{
            res.redirect('/');
        }
    }).catch(function (e) {
        console.log(e);
    });
});

module.exports = router;