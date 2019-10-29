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
    ejs.renderFile(__dirname + "/../mail/mail_mdp.ejs", { name: 'Stranger' }, (err, data) => {
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
                    console.log('Message sent: ' + info2.response);
                }
            })
        }
    })
});


module.exports = router;