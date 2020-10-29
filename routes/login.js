const fs = require('fs')
let ejs = require('ejs')
const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const models = global.db

const nodemailer = require('nodemailer')

const Sequelize = require("sequelize")
const Op = Sequelize.Op
const logger = require('../logger/logger')

const transporter = nodemailer.createTransport({
    host: 'ssl0.ovh.net',
    port:'465',
    auth: {
        type: 'POP3',
        user: 'support@fuego.ovh',
        pass: 'Bouboulover21'
    }
})

router.get('/' ,(req, res, next) => {
    res.render('index', { extractStyles: true, title: 'Se Connecter | FUEGO'});
});

router.post('/', (req, res) => {

    models.User.findOne({
        where: {
            [Op.or]: [{login: req.body.login}, {mail: req.body.login}]
        }, 
        include: [  
            {model: models.Role, include: models.Privilege},
            {model: models.Structure},
            {model: models.Usersdependence}
        ],
    }).then(findedUser => {
        
        if(findedUser){
            bcrypt.compare(req.body.pass, findedUser.password).then((match) => {
                if(match){
                    req.session.client = findedUser;
                    console.log(`Connexion de ${req.body.login}`)
                    //req.flash('success_msg', 'Bienvenue '+req.session.client.prenom);
                    res.redirect('/menu');
                }else{
                    logger.warn(`Tentative de connexion de ${req.body.login}`)
                    req.flash('error_msg', 'Mauvais mot de passe ou identifiant/email');
                    res.redirect('/');
                }
            });

        }else{
            logger.warn(`Tentative de connexion de ${req.body.login}`)
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

router.get('/forget', (req, res) => {
    res.render('emailpassword', { extractStyles: true, title: 'INDEX'});
});

router.get('/forget/:token', (req, res, next) => {
    models.User.findOne({
        where: {
            token : req.params.token
        },
        include: [  
            {model: models.Role, include: models.Privilege},
            {model: models.Structure}
        ],
    }).then(findedUser => {
        console.log(findedUser)
        if(findedUser){
            req.session.client = findedUser
            res.render('parametres/mon_compte', { extractStyles: true, title: 'Mon Compte', session: req.session.client});
        }else{
            req.flash('error_msg', "Ce lien n'est plus valide");
            res.redirect('/');
        }
    }).catch(function (e) {
        req.flash('error', e);
    });
});

router.post('/forget', (req, res) => {

    models.User.findOne({
        where: {
            mail: req.body.emailpass
        },
        include: [  
            {model: models.Role, include: models.Privilege},
            {model: models.Structure}
        ],
    }).then(findedUser => {
        
        if(findedUser){
            let token = [...Array(50)].map(i=>(~~(Math.random()*36)).toString(36)).join('')
            /*bcrypt.hash([...Array(20)].map(i=>(~~(Math.random()*36)).toString(36)).join(''), 10, (err, hash) => {*/
                findedUser.update({token: token}).then((findedUser) => {
                    ejs.renderFile(__dirname + "/../mail/mail_mdp.ejs", { nom: findedUser.nom+' '+findedUser.prenom , url: req.protocol+'://'+req.headers.host+'/forget/' ,token: token }, (err, data) => {
                        /*if (err){
                            console.log(err);
                        }else{*/
                            let info = {
                                from: '"No-Reply" <support@fuego.ovh>', // sender address
                                to: findedUser.mail, // list of receivers
                                subject: 'Mot de passe oublié', // Subject line
                                text: 'Ce mail est un mail HTML', // plain text body
                                html: data
                            }
                    
                            transporter.sendMail(info, (err, info2) => {
                                if (err) {
                                    console.log(err);
                                } else {
                                    res.render('index', { extractStyles: true, title: 'INDEX'});
                                    console.log('Message sent: ' + info2.response);
                                }
                            })
                        /*}*/
                    })
                })
            /*})*/
        }else{
            req.flash('error_msg', "Cette adresse Email n'est relié a aucun compte");
            res.redirect('/');
        }
    }).catch(function (e) {
        req.flash('error', e);
    });

});


module.exports = router;