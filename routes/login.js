const fs = require('fs')
let ejs = require('ejs')
const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const models = require("../models/index")

const nodemailer = require('nodemailer')

const Sequelize = require("sequelize")
const Op = Sequelize.Op

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'ptibnkiller@gmail.com',
        pass: 'bouboulover'
    }
})

router.get('/' ,(req, res) => {
    res.render('index', { extractStyles: true, title: 'INDEX'});
});

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
                    req.flash('success_msg', 'Bienvenu '+req.session.client.nom);
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
            bcrypt.hash([...Array(20)].map(i=>(~~(Math.random()*36)).toString(36)).join(''), 10, (err, hash) => {
                findedUser.update({password: hash, token: token}).then((findedUser) => {
                    ejs.renderFile(__dirname + "/../mail/mail_mdp.ejs", { nom: findedUser.nom+' '+findedUser.prenom , token: token }, (err, data) => {
                        if (err){
                            console.log(err);
                        }else{
                            let info = {
                                from: '"No-Reply" <support@fuego.ovh>', // sender address
                                to: 'johan@qualicom-conseil.fr', // list of receivers
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
                        }
                    })
                })
            })
        }else{
            req.flash('error_msg', "Cette adresse Email n'est relié a aucun compte");
            res.redirect('/');
        }
    }).catch(function (e) {
        req.flash('error', e);
    });

});


module.exports = router;