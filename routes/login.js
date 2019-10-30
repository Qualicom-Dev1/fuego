const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const models = require("../models/index");

const Sequelize = require("sequelize");
const Op = Sequelize.Op;

router.get('/' ,(req, res, next) => {
    res.render('index', { extractStyles: true, title: 'Se Connecter | FUEGO'});
});

/*bcrypt.hash('root', 10, function(err, hash) {
    console.log(hash)
});*/

router.post('/', (req, res) => {

    models.User.findOne({
        where: {
            [Op.or]: [{login: req.body.login}, {mail: req.body.login}]
        }, 
        include: [  
            {model: models.Role, include: models.Privilege},
            {model: models.Structure}
        ],
    }).then(findedUser => {
        
        if(findedUser){
            bcrypt.compare(req.body.pass, findedUser.password).then((match) => {
                if(match){
                    req.session.client = findedUser;
                    console.log(req.session)
                    req.flash('success_msg', 'Bienvenue '+req.session.client.nom);
                    res.redirect('/menu');
                }else{
                    req.flash('error_msg', 'Mauvais mot de passe ou identifiant/email');
                    res.redirect('/');
                }
            });

        }else{
            req.flash('error_msg', 'Mauvais mot de passe ou identifiant/email');
            res.redirect('/');
        }
    }).catch(function (e) {
        req.flash('error', e);
    });
});

router.get('/logout', (req, res) => {
    
    req.session.client = undefined

    req.session.destroy(function(err) {
        res.redirect('/');
    })

});

module.exports = router;