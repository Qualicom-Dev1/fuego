const express = require('express');
const router = express.Router();
const models = require("../models/index");

router.get('/commerciaux' ,(req, res, next) => {
    res.render('parametres/equipes_commerciaux', { extractStyles: true, title: 'Menu', options_top_bar: 'parametres'});
});
router.get('/' ,(req, res, next) => {
    res.render('parametres/equipes_commerciaux', { extractStyles: true, title: 'Menu', options_top_bar: 'parametres'});
});

router.get('/telemarketing' ,(req, res, next) => {
    res.render('parametres/equipes_telemarketing', { extractStyles: true, title: 'Menu', options_top_bar: 'parametres'});
});

router.get('/utilisateurs' ,(req, res, next) => {
    res.render('parametres/utilisateurs', { extractStyles: true, title: 'Menu', options_top_bar: 'parametres'});
});

router.get('/privileges' ,(req, res, next) => {
    models.Privilege.findAll()
    .then((findedPrivileges) => {
        models.Role.findAll()
        .then((findedRoles) => {
            res.render('parametres/roles_privileges', { extractStyles: true, title: 'Menu', options_top_bar: 'parametres', findedPrivileges : findedPrivileges, findedRoles : findedRoles});
        }).catch(err => {
            console.log(err)    
        })
    }).catch((err) => {
        console.log(err)
    })
});

router.get('/secteurs' ,(req, res, next) => {
    res.render('parametres/zones_deps', { extractStyles: true, title: 'Menu', options_top_bar: 'parametres'});
});


module.exports = router;



