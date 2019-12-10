const express = require('express');
const router = express.Router();
const models = require("../models/index")

const Sequelize = require("sequelize")
const Op = Sequelize.Op

router.get('/leads_a_importer' ,(req, res, next) => {
    res.render('leads/leads_a_importer', { extractStyles: true, title: 'Leads à importer | FUEGO', description:'Derniers leads reçus à importer',  session: req.session.client,options_top_bar: 'leads'});
});
router.get('/' ,(req, res, next) => {
    res.render('leads/leads_recus', { extractStyles: true, title: 'Leads reçus | FUEGO', description:'Gestion des leads reçus',  session: req.session.client,options_top_bar: 'leads'});
});

router.get('/campagnes' ,(req, res, next) => {
    res.render('leads/campagnes', { extractStyles: true, title: 'Campagnes | FUEGO', description:'Ajout, gestion des campagnes', session: req.session.client,options_top_bar: 'leads'});
});

router.get('/import' ,(req, res, next) => {
    res.render('leads/import', { extractStyles: true, title: 'Import | FUEGO', description:'Import prestataire',  session: req.session.client,options_top_bar: 'leads'});
});

router.post('/import/import' ,(req, res, next) => {
    let i = 0
    let pdoublon = []
    let doublon = []
    let erreur = []
    let ite = 0
    let liste = JSON.parse(req.body.liste)
    
    liste.forEach((element) => {
        models.Client.findOne({
            where : {
                nom: typeof element.nom != 'undefined' ? element.nom : ' ',
                prenom: typeof element.prenom != 'undefined' ? element.prenom : ' ',
                adresse: typeof element.adresse != 'undefined' ? element.adresse : ' '
            }
        }).then(findedClientDoublon => {
            if(findedClientDoublon == null){
                models.Client.findOne({
                    where : {
                        nom: typeof element.nom != 'undefined' ? element.nom : ' ',
                        prenom: typeof element.prenom != 'undefined' ? element.prenom : ' ',
                        cp: typeof element.cp != 'undefined' ? element.cp : ' '
                    }
                }).then(findedClientPDoublon => {
                    if(findedClientPDoublon){
                        element['doublon'] = '<button>Doublon</button>'
                        element['import'] = '<button>Import</button>'
                        element['_children'] = findedClientPDoublon
                        pdoublon.push(element)
                        ite++
                        if(ite == liste.length){
                            res.send({pdoublon: pdoublon, doublon: doublon, erreur: erreur})
                        }
                    }else{
                        element.dep = element.cp.substring(0,2)
                        models.Client.create(element).catch((e) => {
                            erreur.push(e)
                        })
                        ite++
                        if(ite == liste.length){
                            res.send({pdoublon: pdoublon, doublon: doublon, erreur: erreur})
                        }
                    }
                }).catch((e) => {
                    console.log(e)
                })
            }else{
                i++
                ite++
                if(ite == liste.length){
                    res.send({pdoublon: pdoublon, doublon: doublon, erreur: erreur})
                }
                doublon.push(element)
            }
        }).catch(e => {
            console.log(e)
        })
    })
});

router.get('/gestion' ,(req, res, next) => {
    res.render('leads/leads_recus', { extractStyles: true, title: 'Leads reçus | FUEGO', description:'Gestion des leads reçus', session: req.session.client,options_top_bar: 'leads'});
});


module.exports = router;



