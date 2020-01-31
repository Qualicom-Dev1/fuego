const express = require('express');
const router = express.Router();
const models = require("../models/index")
const _ = require('lodash')

const Sequelize = require("sequelize")
const Op = Sequelize.Op

router.get('/leads_a_importer' ,(req, res, next) => {
    res.render('leads/leads_a_importer', { extractStyles: true, title: 'Leads à importer | FUEGO', description:'Derniers leads reçus à importer',  session: req.session.client,options_top_bar: 'leads'});
});

router.get('/' ,(req, res, next) => {
    res.render('leads/leads_recus', { extractStyles: true, title: 'Leads reçus | FUEGO', description:'Gestion des leads reçus',  session: req.session.client,options_top_bar: 'leads'});
});

router.get('/campagnes' ,(req, res, next) => {
    models.Campagne.findAll().then((findedCampgnes) => {
        res.render('leads/campagnes', { extractStyles: true, title: 'Campagnes | FUEGO', description:'Ajout, gestion des campagnes' ,session: req.session.client, findedCampagnes: findedCampgnes ,options_top_bar: 'leads'});
    })
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
                nom: element.nom != null ? element.nom.toUpperCase() : ' ',
                prenom: element.prenom != null ? element.prenom.toUpperCase() : ' ',
                adresse: element.adresse != null ? element.adresse.toUpperCase() : ' '
            }
        }).then(findedClientDoublon => {
            if(findedClientDoublon == null){
                models.Client.findOne({
                    where : {
                        nom: element.nom != null ? element.nom.toUpperCase() : ' ',
                        prenom: element.prenom != null ? element.prenom.toUpperCase() : ' ',
                        cp: element.cp != null ? element.cp : ' '
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

router.post('/campagnes/get-sources-types' ,(req, res, next) => {

    models.Client.aggregate('source', 'DISTINCT', {plain: false})
    .then(findedSource => {
        models.Client.aggregate('type', 'DISTINCT', {plain: false})
        .then(findedType => {
            res.send({findedSource: findedSource, findedType: findedType});
        })
    })
});

router.post('/campagnes/get-statuts' ,(req, res, next) => {
    models.Action.findAll().then((findedStatuts) => {
        res.send({findedStatuts: findedStatuts});
    }).catch((err) => {

    })
});

router.post('/campagnes/get-modal-campagne' ,(req, res, next) => {
    models.Client.findAll({
        where : createWhere(req.body)
    }).done((findedClient) => {
        res.send({findedClient : findedClient})
    })
});

router.post('/campagnes/set-campagne' ,(req, res, next) => {
    models.Campagne.create(req.body.campagnes)
    .then((createdCampagnes) => {
        models.Client.findAll({
            where : createWhere(req.body.data_request),
            order: Sequelize.literal('rand()'),
            limit: req.body.need_leads == "" ? 100000 : parseInt(req.body.need_leads)
        }).done((findedClient) => {
            let cc = []
            _.map(findedClient, 'id').forEach((element) => {
                cc.push({idClient: element, idCampagne: createdCampagnes.id})
            })
            models.ClientsCampagne.bulkCreate(cc).then(() => {
                res.send({findedClient : findedClient, createdCampagnes : createdCampagnes})
            })
        })


    })
});

router.post('/campagnes/delete-campagne' ,(req, res, next) => {
    models.Campagne.destroy({
        where : {
            id: req.body.id
        }
    })
    .then((resultat) => {

        models.ClientsCampagne.destroy({
            where : {
                idCampagne: req.body.id
            }
        }).then((resultat2) => {

            res.send({resultat, resultat2})
        })
    })
});

router.post('/campagnes/active-campagne' ,(req, res, next) => {
    
        models.Campagne.findOne({
            where: {
                id: req.body.id
            }
        })
        .then((campagne) => {
            campagne.update({etat_campagne : 1})
            models.ClientsCampagne.findAll({
                where : {
                    idCampagne: req.body.id
                }
            }).then((findedCampagnesClients) => {
                let total = 0
                findedCampagnesClients.forEach((element) => {
                    models.Client.update({currentCampagne: element.idCampagne, currentAction: null
                    },{
                        where: {
                            id: element.idClient
                        }
                    }).then((client) => {
                        console.log(client)
                        models.Historique.create({idClient: element.idClient, commentaire: 'Début de la campagne '+campagne.nom}).then(() => {
                            total++
                            if(total == findedCampagnesClients.length){
                                callback()
                            }
                        })
                    })
                })
            })
        })
        function callback(){
            res.send('OK')
        }
});

router.post('/campagnes/desactive-campagne' ,(req, res, next) => {
    
    models.Campagne.findOne({
        where: {
            id: req.body.id
        }
    })
    .then((campagne) => {
        campagne.update({etat_campagne : 2})
        models.ClientsCampagne.findAll({
            where : {
                idCampagne: req.body.id
            }
        }).then((findedCampagnesClients) => {
            let total = 0
            findedCampagnesClients.forEach((element) => {
                models.Client.update({currentCampagne: null
                },{
                    where: {
                        id: element.idClient
                    }
                }).then((client) => {
                    models.Historique.create({idClient: element.idClient, commentaire: 'Fin de la campagne '+campagne.nom}).then(() => {
                        total++
                        if(total == findedCampagnesClients.length){
                            callback()
                        }
                    })
                })
            })
        })
    })
    function callback(){
        res.send('OK')
    }
});

function createWhere(data_request){

    let defaultValue = {
        [Op.like] : '%%'
    }
    let defaultOrSources = {
        [Op.or] : {
            source: { [Op.like] : '%%'},
            type: { [Op.like] : '%%'},
        }
    }

    let where;

    let deps;
    let sources_types = [];
    let statuts;

    if(data_request.deps) {
        deps = {
            [Op.in] : data_request.deps
        }
    }

    if(data_request.statuts) {
        statuts = {
            [Op.in] : data_request.statuts
        }
    }

    if(data_request.sources_types) {
        data_request.sources_types.forEach((element) => {
            let source_type = {}
            if(element[0] != ''){
                source_type['source'] = element[0]
            }
            if(element[1] != ''){
                source_type['type'] = element[1]
            }
            sources_types.push(source_type)
        })
    }

    where = {
            dep: typeof deps == 'undefined' ? defaultValue : deps,
            [Op.or] : sources_types.length == 0 ? defaultOrSources : sources_types,
            currentAction : typeof statuts == 'undefined' ? defaultValue : statuts,
            currentCampagne : {
                [Op.or]: {
                    [Op.is]: null,
                    [Op.eq]: 0
                }
            }
    }

    return where

}

module.exports = router;



