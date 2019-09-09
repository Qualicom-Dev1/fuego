const express = require('express');
const router = express.Router();
const models = require("../models/index");
const moment = require('moment');
const Sequelize = require('sequelize')
const Op = Sequelize.Op;


router.get('/' , (req, res, next) => {
    res.redirect('/manager/tableau-de-bord');
});

router.get('/tableau-de-bord' ,(req, res, next) => {
    res.render('manager_dashboard', { extractStyles: true, title: 'Menu'});
});

router.get('/directives' ,(req, res, next) => {
    res.render('manager_directives', { extractStyles: true, title: 'Menu'});
});

router.get('/dem-suivi' ,(req, res, next) => {
    res.render('manager_rdv_demsuivi', { extractStyles: true, title: 'Menu'});
});

router.get('/agenda' ,(req, res, next) => {
    res.render('manager_agenda', { extractStyles: true, title: 'Menu'});
});

router.get('/liste-rendez-vous' ,(req, res, next) => {

    /*models.RDV.findOne({
        include: [
                {model : models.Historique}, 
                {model : models.Client},
                {model : models.User},
                {model : models.Etat},
                {model : models.Campagne}    
            ],
        order : [models.RDV, 'date', 'asc'],
        where : {
            date : {
                [Op.like]: moment().format('L')
            }
        }   
    }).then(findedClient => {
        if(findedClient){
            console.log(findedClient)
            res.render('manager_listerdv', { extractStyles: true, title: 'Menu', findedRdvs});
        }else{
            req.flash('error_msg', 'un problème est survenu veuillez réessayer si le probleme persiste informer en votre superieure');
            res.redirect('/menu');
        }
    }).catch(function (e) {
        req.flash('error', e);
    });*/

    res.render('manager_listerdv', { extractStyles: true, title: 'Menu'});

});

module.exports = router;