const express = require('express');
const router = express.Router();
const models = global.db;
const moment = require('moment');
const sequelize = require('sequelize')
const Op = sequelize.Op;
const _ = require('lodash')
const config = require('./../config/config.json');
const dotenv = require('dotenv')
const clientInformationObject = require('./utils/errorHandler');
const isSet = require('./utils/isSet');
dotenv.config();

const ovh = require('ovh')(config["OVH"])
const { getServiceSMS, getSMS, getListeIdSMS, getListeSMS } = require('./utils/sms')

router.get('/' , (req, res, next) => {
    res.redirect('/manager/tableau-de-bord');
});

router.get('/tableau-de-bord' ,(req, res, next) => {
    res.render('manager/manager_dashboard', { extractStyles: true, title: 'Tableau de bord | FUEGO', description:'Tableau de bord manager Marketing', session: req.session.client, options_top_bar: 'telemarketing'});
});

router.post('/statistiques' ,(req, res, next) => {
    let resultatmois = []
    let resultatsemaine = []
    let resultatjour = []

    let idDependence = []
    req.session.client.Usersdependences.forEach((element => {
        idDependence.push(element.idUserInf)    
    }))

    idDependence.push(req.session.client.id)

    models.sequelize.query("SELECT CONCAT(Users.nom, ' ',Users.prenom) as nomm, Actions.nom, Etats.nom as etat ,count(Historiques.id) as count FROM Historiques LEFT JOIN RDVs ON Historiques.id=RDVs.idHisto LEFT JOIN Users ON Users.id=Historiques.idUser LEFT JOIN Actions ON Actions.id=Historiques.idAction LEFT JOIN Etats ON Etats.id=RDVs.idEtat WHERE Users.id IN (:idUsers) AND Historiques.createdAt BETWEEN :datedebut AND :datefin GROUP BY nomm, Actions.nom, Etats.nom",
        { replacements: { 
            idUsers: idDependence,
            datedebut: moment().startOf('month').format('YYYY-MM-DD'), 
            datefin: moment().endOf('month').add(1, 'days').format('YYYY-MM-DD')
    }, type: sequelize.QueryTypes.SELECT}
    ).then(findedStatsMois => {
            models.sequelize.query("SELECT CONCAT(Users.nom, ' ',Users.prenom) as nomm, Actions.nom, Etats.nom as etat ,count(Historiques.id) as count FROM Historiques LEFT JOIN RDVs ON Historiques.id=RDVs.idHisto LEFT JOIN Users ON Users.id=Historiques.idUser LEFT JOIN Actions ON Actions.id=Historiques.idAction LEFT JOIN Etats ON Etats.id=RDVs.idEtat WHERE Users.id IN (:idUsers) AND Historiques.createdAt BETWEEN :datedebut AND :datefin GROUP BY nomm, Actions.nom, Etats.nom",
            { replacements: { 
                idUsers: idDependence,
                    datedebut: moment().startOf('week').format('YYYY-MM-DD'), 
                    datefin: moment().endOf('week').add(1, 'days').format('YYYY-MM-DD')
                }, type: sequelize.QueryTypes.SELECT}
                ).then(findedStatsSemaine => {
                    models.sequelize.query("SELECT CONCAT(Users.nom, ' ',Users.prenom) as nomm, Actions.nom, Etats.nom as etat ,count(Historiques.id) as count FROM Historiques LEFT JOIN RDVs ON Historiques.id=RDVs.idHisto LEFT JOIN Users ON Users.id=Historiques.idUser LEFT JOIN Actions ON Actions.id=Historiques.idAction LEFT JOIN Etats ON Etats.id=RDVs.idEtat WHERE Users.id IN (:idUsers) AND Historiques.createdAt BETWEEN :datedebut AND :datefin GROUP BY nomm, Actions.nom, Etats.nom",
                    { replacements: { 
                        idUsers: idDependence,
                            datedebut: moment().format('YYYY-MM-DD'), 
                            datefin: moment().add(1, 'days').format('YYYY-MM-DD')
                        }, type: sequelize.QueryTypes.SELECT})
                        .then(findedStatsJours => {
        
                            res.send({findedStatsMois : findedStatsMois, findedStatsSemaine : findedStatsSemaine, findedStatsJours : findedStatsJours});
                        
                        }).catch(err => {
                            console.log(err)
                        })
            }).catch(err => {
                console.log(err)
            })
        }).catch(err => {
            console.log(err)
        })
});

router.get('/directives' , async (req, res) => {
    let infos = undefined
    let depsAvailable = undefined
    let telepros = undefined
    let sources = undefined
    let typesFichiers = undefined
    let zones = undefined
    let campagnes = undefined

    try {
        // récupération des ids des télépros à afficher
        const idsTelepros = [req.session.client.id]
        if(req.session.client.Usersdependences) {
            for(const dependance of req.session.client.Usersdependences) {
                idsTelepros.push(dependance.idUserInf)
            }
        }

        // récupération des département disponibles
        depsAvailable = []
        if(req.session.client.Structures) {
            for(const structure of req.session.client.Structures) {
                if(structure.deps !== null && structure.deps !== '') {
                    const deps = structure.deps.split(',')
                    for(const dep of deps) {
                        if(!depsAvailable.includes(dep)) depsAvailable.push(dep)
                    }
                }
            }
        }

        const [queryTelepros, querySources, queryTypesFichiers, queryZones, queryCampagnes] = await Promise.all([
            models.User.findAll({
                include: [  
                    {model: models.Role, include: models.Privilege},
                    {model: models.Directive, include : [models.Campagne, models.Zone, models.SousZone, models.Agence]},
                    {model: models.Structure ,include: models.Type}
                ],
                where : {
                    id: {
                        [Op.in]: idsTelepros
                    }
                },
                order : [['nom', 'ASC'], ['prenom', 'ASC']]
            }),
            models.Client.findAll({
                attributes : [[sequelize.fn('DISTINCT', sequelize.col('Client.source')), 'nom']],
                order : [[sequelize.col('nom'), 'ASC']]
            }),
            models.Client.findAll({
                attributes : [[sequelize.fn('DISTINCT', sequelize.col('Client.type')), 'nom']],
                order : [[sequelize.col('nom'), 'ASC']]
            }),
            models.Zone.findAll({
                order : [['nom', 'ASC']]
            }),
            models.Campagne.findAll({
                where : {
                    etat_campagne : 1
                }
            })
        ])
        if(queryTelepros === null) throw "Une erreur est survenue lors de la récupération des téléconseillers."
        if(querySources === null) throw "Une erreur est survenue lors de la récupération des sources de fichiers."
        if(queryTypesFichiers === null) throw "Une erreur est survenue lors de la récupération des types de fichiers."
        if(queryZones === null) throw "Une erreur est survenue lors de la récupération des zones."
        if(queryCampagnes === null) throw "Une erreur est survenue lors de la récupération des campagnes."

        telepros = queryTelepros
        sources = querySources
        typesFichiers = queryTypesFichiers
        zones = queryZones
        campagnes = queryCampagnes

        // récupération des vendeurs pour lorsqu'il y en a qui sont attribués à un télépro
        if(telepros && telepros.length) {
            for(const telepro of telepros) {
                if(telepro.Directive && telepro.Directive.listeIdsVendeurs !== null) {
                    const ids = telepro.Directive.listeIdsVendeurs.split(',')
                    const vendeurs = await models.User.findAll({
                        attributes : ['prenom', 'nom'],
                        where : {
                            id : {
                                [Op.in] : ids
                            }
                        }
                    })
                    if(vendeurs === null) throw `Une erreur s'est produite lors de la récupération de la liste des vendeurs pour ${telepro.prenom} ${telepro.nom}.`

                    telepro.Directive.dataValues.listeVendeurs = vendeurs
                }
            }
        }

        // récupération du nombre de lignes disponibles par télépro
        const countLignesPromises = []
        for(const telepro of telepros) {
            countLignesPromises.push(addCount(telepro))
        }

        const tabCount = await Promise.all(countLignesPromises)
        for(let i = 0; i < telepros.length; i++) {
            telepros[i].dataValues.count = tabCount[i]
        }

        // récupération des statuts de campagne
        for(const campagne of campagnes) {
            campagne.dataValues.Statuts = undefined
            if(campagne.statuts && campagne.statuts !== '') {              
                const idsStatuts = campagne.statuts.split(',')
                const statuts = await models.Action.findAll({
                    where : {
                        id : {
                            [Op.in] : idsStatuts
                        }
                    }
                })
                if(statuts === null) throw "Une erreur est survenue lors de la récupération des statuts d'une campagne."

                campagne.dataValues.Statuts = statuts.map(statut => statut.nom).toString()
            }
        }
    }
    catch(error) {
        depsAvailable = undefined
        telepros = undefined
        sources = undefined
        typesFichiers = undefined
        zones = undefined
        campagnes = undefined
        infos = clientInformationObject(error)
    }

    res.render('manager/manager_directives', 
        { 
            extractStyles: true, 
            title: 'Directives téléconseillers', 
            session: req.session.client, 
            options_top_bar: 'telemarketing', 
            infos, 
            depsAvailable,  
            telepros,
            sources,
            typesFichiers,
            zones,
            campagnes
        }
    );
});

router.post('/update/directives' , async (req, res) => {
    const directiveSent = req.body

    let infos = undefined

    try {
        if(!isSet(directiveSent)) throw "Une directive doit être transmise."
        if(!isSet(directiveSent.idTelepro)) throw "Un téléconseiller doit être sélectionné."
        if(!isSet(directiveSent.isCampagne)) throw "une erreur est survenue lors de la transmission des données."
        if(directiveSent.isCampagne && !isSet(directiveSent.campagne)) throw "Une campagne doit être sélectionnée."
        if(!directiveSent.isCampagne && isSet(directiveSent.listeIdsVendeurs) && !isSet(directiveSent.agence)) throw "Des vendeurs ne peuvent pas être sélectionnés si l'agence à laquelle ils appartiennent ne l'est pas."
        if(!directiveSent.isCampagne && isSet(directiveSent.agence) && !isSet(directiveSent.sousZone)) throw "Une agence ne peut pas être sélectionnée si la sous-zone à laquelle elle appartient ne l'est pas."
        if(!directiveSent.isCampagne && isSet(directiveSent.sousZone) && !isSet(directiveSent.zone)) throw "une sous-zone ne peut pas être sélectionnée si la zone à laquelle elle appartient ne l'est pas."

        const telepro = await models.User.findOne({
            include : [
                { model : models.Directive },
                { model: models.Structure }
            ],
            where : {
                id : directiveSent.idTelepro
            }
        })
        if(telepro === null) throw "Aucun téléconseiller correspondant."

        if(directiveSent.isCampagne && !isNaN(directiveSent.campagne)) {
            const campagne = await models.Campagne.findOne({
                where : {
                    id : directiveSent.campagne
                }
            })
            if(campagne === null) throw "Aucune campagne correspondante."
            if(!campagne.etat_campagne) throw "La campagne sélectionnée n'est pas active."
        }

        if(isSet(directiveSent.zone) && !isNaN(Number(directiveSent.zone))) {
            const zone = await models.Zone.findOne({
                where : {
                    id : directiveSent.zone
                }
            })
            if(zone === null) throw "Aucune zone correspondante."
        }

        if(isSet(directiveSent.sousZone) && !isNaN(Number(directiveSent.sousZone))) {
            const sousZone = await models.SousZone.findOne({
                where : {
                    id : directiveSent.sousZone
                }
            })
            if(sousZone === null) throw "Aucune sous-zone correspondante."
        }

        if(isSet(directiveSent.agence) && !isNaN(Number(directiveSent.agence))) {
            const agence = await models.Agence.findOne({
                where : {
                    id : directiveSent.agence
                }
            })
            if(agence === null) throw "Aucune agence correspondante."
        }

        if(isSet(directiveSent.listeIdsVendeurs)) {
            const ids = directiveSent.listeIdsVendeurs.split(',')

            const vendeurs = await models.User.findAll({
                include : {
                    model : models.Role,
                    where : {
                        typeDuRole : 'Commercial'
                    }
                },
                where : {
                    id : {
                        [Op.in] : ids
                    }
                }
            })
            if(vendeurs === null) throw "Une erreur est survenue lors de la récupération des vendeurs."
            if(vendeurs.length !== ids.length) throw "Certains vendeurs sont introuvables."
        }

        // s'il n'y a pas de départements 
        if(!isSet(directiveSent.deps)) {
            let depsAvailable = []

            // s'il y a une campagne on affecte tous les départements de la campagne
            if(directiveSent.isCampagne) {
                const campagne = await models.Campagne.findOne({
                    where : {
                        id : directiveSent.campagne
                    }
                })
                depsAvailable = campagne.deps.split(',')
            }
            // sans campagne mais avec des vendeurs de sélectionnés on se réfère à ceux-ci
            else if(isSet(directiveSent.listeIdsVendeurs)) {
                const ids = directiveSent.listeIdsVendeurs.split(',')

                const vendeurs = await models.AppartenanceAgence.findAll({
                    where : {
                        idVendeur : {
                            [Op.in] : ids
                        }
                    }
                })

                for(const vendeur of vendeurs) {
                    if(vendeur.deps) {
                        const depsVendeur = vendeur.deps.split(',')
                        for(const dep of depsVendeur) {
                            if(!depsAvailable.includes(dep)) depsAvailable.push(dep)
                        }
                    }    
                }
            }
            // sans campagne mais avec une agence de sélectionnée on se réfère à celle-ci
            else if(isSet(directiveSent.agence)) {
                const agence = await models.Agence({
                    where : {
                        id : directiveSent.agence
                    }
                })
                depsAvailable = agence.deps.split(',')
            }
            // sans campagne mais avec une sous-zone de sélectionnée on se réfère à celle-ci
            else if(isSet(directiveSent.sousZone)) {
                const sousZone = await models.SousZone({
                    where : {
                        id : directiveSent.sousZone
                    }
                })
                depsAvailable = sousZone.deps.split(',')
            }
            // sans campagne mais avec une zone de sélectionnée on se réfère à celle-ci
            else if(isSet(directiveSent.zone)) {
                const zone = await models.Zone({
                    where : {
                        id : directiveSent.zone
                    }
                })
                depsAvailable = zone.deps.split(',')
            }
            // on fournit tous ceux des structures dont le télépro fait partie
            else {
                if(telepro.Structures) {
                    for(const structure of telepro.Structures) {
                        if(structure.deps !== null && structure.deps !== '') {
                            const deps = structure.deps.split(',')
                            for(const dep of deps) {
                                if(!depsAvailable.includes(dep)) depsAvailable.push(dep)
                            }
                        }
                    }
                }
            }
            
            directiveSent.deps = depsAvailable.toString()
        }

        // création de l'objet type à écrire en base de donénes
        const directiveToBDD = {
            idUser : telepro.id,
            idCampagne : directiveSent.campagne ? directiveSent.campagne : null,
            type_de_fichier : directiveSent.source ? directiveSent.source : null,
            sous_type : directiveSent.type ? directiveSent.type : null,
            idZone : directiveSent.zone ? directiveSent.zone : null,
            idSousZone : directiveSent.sousZone ? directiveSent.sousZone : null,
            idAgence : directiveSent.agence ? directiveSent.agence : null,
            listeIdsVendeurs : directiveSent.listeIdsVendeurs ? directiveSent.listeIdsVendeurs : null,
            deps : directiveSent.deps
        }

        let directive = undefined
        // on vérifie s'il existe déjà une directive à mettre à jour
        if(telepro.Directive) directive = await telepro.Directive.update(directiveToBDD)
        // ou on en crée une s'il n'en existait pas encore
        else directive = await models.Directive.create(directiveToBDD)

        if(directive === null) throw "Une erreur est survenue lors de la création de la directive, veuillez réessayer plus tard."

        infos = clientInformationObject(undefined, "La directive a bien été créée.")
    }
    catch(error) {
        infos = clientInformationObject(error)
    }

    res.send({
        infos
    })
});

router.get('/agenda' ,(req, res, next) => {
    let StructuresId = []
    req.session.client.Structures.forEach(s => {
        StructuresId.push(s.id)
    })
    models.Structuresdependence.findAll({
        where : {
            idStructure: {
                [Op.in] : StructuresId
            }
        },
        attributes: ['idUser']
    }).then(findedStructuredependence => {
        let dependence = []
        findedStructuredependence.forEach((element) => {
            dependence.push(element.idUser)
        })
        models.User.findAll({
            where: {
                id: {
                    [Op.in] : dependence,
                }
            },
            order: [['nom', 'asc']],
        }).then(findedUsers => {
            models.Event.findAll({
                include: [
                    {model: models.User, 
                        where: {
                                id: {
                                    [Op.in] : dependence
                                }
                            }
                    }
                ],
                order : [['start', 'DESC']]
            }).then( (findedEvents) => {
                res.render('manager/manager_agenda', { extractStyles: true, title: 'Agenda | FUEGO', description:'Agenda manager', session: req.session.client, options_top_bar: 'telemarketing', findedUsers: findedUsers, findedEvents: findedEvents})
            })
        })
    })
});

router.post('/agenda/delete' ,(req, res, next) => {
    
    models.Event.destroy({
        where: {
            id: req.body.id
        }
    }).then( deleteEvent => {
        let StructuresId = []
        req.session.client.Structures.forEach(s => {
            StructuresId.push(s.id)
        })

        models.Structuresdependence.findAll({
            where : {
                idStructure: StructuresId
            },
            attributes: ['idUser']
        }).then(findedStructuredependence => {
            let dependence = []
            findedStructuredependence.forEach((element) => {
                dependence.push(element.idUser)
            })
            models.User.findAll({
                where: {
                    id: {
                        [Op.in] : dependence,
                    }
                },
                order: [['nom', 'asc']],
            }).then(findedUsers => {
                models.Event.findAll({
                    include: [
                        {model: models.User, 
                            where: {
                                    id: {
                                        [Op.in] : dependence
                                    }
                                }
                        }
                    ],
                    order : [['start', 'DESC']]
                }).then((findedEvents) => {
                    res.send({findedEvents: findedEvents})
                })
            })
        })
    }).catch(e => {
        res.send('error')
    })
});

router.post('/agenda/ajoute-event' ,(req, res, next) => {
    let StructuresId = []
    req.session.client.Structures.forEach(s => {
        StructuresId.push(s.id)
    })

    let pattern = 'YYYY/MM/DD HH:mm'
    if(req.body.allDay === 'true') {
        pattern = 'DD/MM/YYYY'
    }
    req.body.start = moment(req.body.start, pattern).format('YYYY/MM/DD HH:mm')
    req.body.end = moment(req.body.end, pattern).format('YYYY/MM/DD HH:mm')

    models.Event.create(req.body).then( (createdEvent) => {
        models.Structuresdependence.findAll({
            where : {
                idStructure: StructuresId
            },
            attributes: ['idUser']
        }).then(findedStructuredependence => {
            let dependence = []
            findedStructuredependence.forEach((element) => {
                dependence.push(element.idUser)
            })
            models.User.findAll({
                where: {
                    id: {
                        [Op.in] : dependence,
                    }
                },
                order: [['nom', 'asc']],
            }).then(findedUsers => {
                models.Event.findAll({
                    include: [
                        {model: models.User, 
                            where: {
                                    id: {
                                        [Op.in] : dependence
                                    }
                                }
                        }
                    ],
                    order : [['start', 'DESC']]
                }).then((findedEvents) => {
                    res.send({findedEvents: findedEvents})
                })
            })
        })
    })
});

router.get('/objectifs' ,(req, res, next) => {
    let StructuresId = []
    req.session.client.Structures.forEach(s => {
        StructuresId.push(s.id)
    })
    models.Structuresdependence.findAll({
        where : {
            idStructure: StructuresId
        },
        attributes: ['idUser']
    }).then(findedStructuredependence => {
        let dependence = []
        findedStructuredependence.forEach((element) => {
            dependence.push(element.idUser)
        })
        models.User.findAll({
            where: {
                id: {
                    [Op.in] : dependence,
                }
            },
            order: [['nom', 'asc']],
        }).then(findedUsers => {
            res.render('manager/manager_objectifs', { extractStyles: true, title: 'Objectifs | FUEGO', description:'Objectifs manager', session: req.session.client, options_top_bar: 'telemarketing', findedUsers : findedUsers});
        })
    })
});

router.post('/objectifs/rdv' ,(req, res, next) => {
    models.RDV.findAll({
        include: [
            {model: models.User},
            {model: models.Client}
        ],
        where: { date : {
            [Op.between]: [req.body.datestart, req.body.dateend], 
        }
    }}).then(findedRdvs => {
        res.send({findedRdvs : findedRdvs});
    })
});

router.post('/objectifs/abs' ,(req, res, next) => {
    models.sequelize.query("SELECT * FROM Events WHERE start <= CONCAT(:date, '00:00:00') AND end >= :date", {replacements: { date: req.body.date}, type: sequelize.QueryTypes.SELECT})
    .then(findedAbs => {
        res.send({findedAbs : findedAbs});
    })
});

async function getListeRdvs(user, dateDebut = undefined, dateFin = undefined) {
    let StructuresId = []
    let StructuresDeps = []

    user.Structures.forEach(structure => {
        StructuresId.push(structure.id)
        structure.deps.split(',').forEach(dep => {
            StructuresDeps.push(dep)
        })
    })

    if(!isSet(dateDebut) && !isSet(dateFin)) {
        dateDebut = `${moment().format('YYYY-MM-DD')} 00:00:00`
        dateFin = `${moment().format('YYYY-MM-DD')} 23:59:59`
    }    

    let whereDate = {}

    if(isSet(dateDebut) && isSet(dateFin)) {
        whereDate = {
            date : {
                [Op.between] : [dateDebut, dateFin]
            }
        }
    }
    else if(isSet(dateDebut)) {
        whereDate = {
            date : {
                [Op.gte] : dateDebut
            }
        }
    }
    else if(isSet(dateFin)) {
        whereDate = {
            date : {
                [Op.lte] : dateDebut
            }
        }
    }

    return models.RDV.findAll({
        include: [
            {
                model : models.Client,
                include : {
                    model : models.Historique,
                    order : [['Historiques.id', 'desc']]
                }
            },
            {
                model : models.Historique, 
                include: [
                    {
                        model : models.User, 
                        include : [
                            { model : models.Structure }
                        ]
                    }
                ]
            },
            {model : models.User},
            {model : models.Etat},
            {model : models.Campagne}
        ],
        where: {
            // date : {
            //     [Op.between] : [dateDebut, dateFin]
            // },
            ...whereDate,
            [Op.or] : [
                {
                    [Op.and] : [      
                        {
                            '$Historique->User->Structures.id$': {
                                [Op.in] : StructuresId
                            }
                        },    
                        {          
                            '$Client.dep$': {
                                [Op.in] : StructuresDeps
                            }
                        }
                    ]
                },
                { 
                    source : {
                        [Op.in] : ['BADGING', 'PARRAINAGE', 'PERSO']
                    } 
                }
            ]
            // '$Historique->User->Structures.id$': {
            //     [Op.in] : StructuresId
            // },
            // '$Client.dep$': {
            //     [Op.in] : StructuresDeps
            // }
        },
        order: [['date', 'asc']],
    })
}

// ajoute le booléen hasNewDate à tous les RDVs et le passe à true à ceux qui ont un état de repositionnement (DEM SUIVI, REPO COMMERCIAL, REPO CLIENT) avec un nouveau rdv de déjà fixé
function addHasNewDate(listeRdvs) {
    for(let i = 0; i < listeRdvs.length; i++) {
        const rdv = listeRdvs[i]
        let hasNewDate = false
        // si DEM SUIVI ou REPO COMMERCIAL ou REPO CLIENT
        if([2,12,13].includes(Number(rdv.idEtat))) {
            rdv.hasNewDate = false
            // recherche si un nouveau RDV a été pris
            for(const historique of rdv.Client.Historiques) {
                // si l'historique est antérieur ou celui traité, on passe
                if(rdv.Historique.id >= historique.id) continue
                // s'il y a un historique plus récent avec un rdv, on indique q'un rdv a bien été pris
                if(Number(historique.idAction) === 1) {
                    rdv.hasNewDate = true
                    hasNewDate = true
                    break
                }
            }
        }

        // conversion en objet classique puis ajout de la nouvelle propriété afin qu'elle puisse être envoyée
        listeRdvs[i] = rdv.toJSON()
        listeRdvs[i].hasNewDate = hasNewDate
    }

    return listeRdvs
}

router.get('/liste-rendez-vous' , async (req, res) => {
    res.render('manager/manager_listerdv', { extractStyles: true, title: 'Liste RDV', description:'Liste des rendez-vous Manager', session: req.session.client, options_top_bar: 'telemarketing', date: moment().format('DD/MM/YYYY')});
});

router.post('/liste-rendez-vous' ,async (req, res) => {
    let infoObject = undefined
    let listeRdvs = undefined
    let dateDebut = req.body.datedebut
    let dateFin = req.body.datefin

    try {
        if(!isSet(dateDebut) && !isSet(dateFin)) throw "Une date de début ou de fin doit être choisie."

        if(isSet(dateDebut)) dateDebut = `${moment(dateDebut, 'DD/MM/YYYY').format('YYYY-MM-DD')} 00:00:00`
        if(isSet(dateFin)) dateFin = `${moment(dateFin, 'DD/MM/YYYY').format('YYYY-MM-DD')} 23:59:59`

        listeRdvs = await getListeRdvs(req.session.client, dateDebut, dateFin)

        if(listeRdvs === null || listeRdvs.length === 0) {
            infoObject = clientInformationObject(undefined, "Aucun RDV disponible.")
        }
        else {  
            listeRdvs = addHasNewDate(listeRdvs)
        }        
    }
    catch(error) {
        infoObject = clientInformationObject(error)
        listeRdvs = undefined
    }

    res.send({
        infoObject,
        listeRdvs
    })
});

router.post('/liste-rendez-vous/delete-rendez-vous' ,(req, res, next) => {
    models.RDV.findOne({
        where: {
            id : req.body.id 
        }
    }).then(findedRdv => {
        findedRdv.destroy()
        .then(() => {
            models.Historique.findOne({
                where: {
                    idRdv : req.body.id 
                }
            }).then(findedHisto => {
                findedHisto.destroy()
                .then(() => {
                    res.send('OK')
                })
            })
        }).catch(function (e) {
            req.flash('error', e);
        });
    });
});

router.post('/compte-rendu' ,(req, res, next) => {

    models.RDV.findOne({
        include: [
            {model : models.Client},
            {model : models.Historique, include: [
                {model : models.User, include : [
                    {model : models.Structure}
                ]}
            ]},
            {model : models.User},
            {model : models.Etat},
            {model : models.Campagne}
        ],
        where: {
            id: req.body.id
        }
    }).then(findedRdv => {
        if(!findedRdv){
            req.flash('error_msg', 'Un problème est survenu, veuillez réessayer. Si le probleme persiste veuillez en informer votre superieur.');
            res.redirect('/menu');
        }
        let StructuresId = []
        req.session.client.Structures.forEach(s => {
            StructuresId.push(s.id)
        })
        models.Structuresdependence.findAll({
            where : {
                idStructure: StructuresId
            },
            attributes: ['idUser']
        }).then(findedStructuredependence => {
            let dependence = []
            findedStructuredependence.forEach((element) => {
                dependence.push(element.idUser)
            })
            models.User.findAll({
                where: {
                    id: {
                        [Op.in] : dependence,
                    }
                },
                order: [['nom', 'asc']],
            }).then(findedUsers => {
                if(findedUsers){
                    let accesFicheClient = false

                    if(["Manager", "Admin"].includes(req.session.client.Role.nom)) {
                        accesFicheClient = true
                    }

                    res.send({ findedRdv: findedRdv, findedUsers: findedUsers, accesFicheClient });
                }else{
                    req.flash('error_msg', 'Un problème est survenu, veuillez réessayer. Si le probleme persiste veuillez en informer votre superieur.');
                    res.redirect('/menu');
                }
            }).catch(function (e) {
                console.log('error', e);
            });
        }).catch(function (e) {
            console.log('error', e);
        });  
    }).catch(function (e) {
        console.log('error', e);
    });
});

router.post('/update/compte-rendu' , async (req, res) => {
    let infoObject = undefined

    req.body.idUser = req.session.client.id
    req.body.idEtat = req.body.idEtat == '' ? null : req.body.idEtat
    req.body.idVendeur = req.body.idVendeur ==  '' ? null : req.body.idVendeur
    if(isSet(req.body.datenew)) req.body.datenew = moment(req.body.datenew, 'DD/MM/YYYY HH:mm').format('YYYY-MM-DD HH:mm')

    try {
        try {
            ovh.request('GET', '/sms/', async (err, service_sms) => {
                if(err) throw `Erreur ovh service sms : ${err}`

                const findedRdv = await models.RDV.findOne({
                    include: [
                        {model : models.Historique, include: models.Client }  
                    ],
                    where: {
                        id: req.body.idRdv
                    }
                })
                
                let exist = false
                let number = getNumber(findedRdv.Historique.Client.tel1, findedRdv.Historique.Client.tel2, findedRdv.Historique.Client.tel3)    
                
                ovh.request('GET', '/sms/'+service_sms[0]+'/jobs/', (err, result3) => {
                    let i = 0
                    if(typeof err == 'undefined'){
                        result3.forEach((element, index, array) => {
                            ovh.request('GET', '/sms/'+service_sms[0]+'/jobs/'+element, (err, result2) => {
                                if((result2.receiver) == "+33"+number){
                                    exist = result2.id
                                }
                                i++
                                if(i === array.length) {
                                    if(req.body.statut == 1){
                                        if(exist == false){
                                            let diff = moment(moment(findedRdv.date, 'DD/MM/YYYY HH:mm').format('YYYY-MM-DD')).add(8, 'hours').diff(moment(), 'minutes')
                                            if(diff > 0 && number){
                                                console.log('send message')
                                                let content = {
                                                    "charset" : "UTF-8",
                                                    "class" : "phoneDisplay",
                                                    "coding" : "7bit",
                                                    "differedPeriod" : diff, 	
                                                    "message" : "Bonjour M./MME. " + findedRdv.Historique.Client.nom + ", nous confirmons votre RDV de ce jour à " + moment(findedRdv.date, 'DD/MM/YYYY HH:mm').format('HH:mm') + " avec notre technicien. Visitez notre site internet www.hitech-habitats-services.com",
                                                    "noStopClause" : true,
                                                    "priority" : "high",
                                                    "receivers" : ["+33"+number],
                                                    "senderForResponse" : true,
                                                    "validityPeriod" : 2880
                                                }
                                                /*ovh.request('POST', '/sms/'+service_sms[0]+'/jobs/', content , (err, result2) => {
                                                    console.log(err || result2);
                                                })*/
                                            }
                                        }else{
                                            console.log('allready send message')
                                        }
                                    }else{
                                        if(exist != false){
                                            ovh.request('DELETE', '/sms/'+service_sms[0]+'/jobs/'+exist, (err, result) => {
                                                console.log('delete message')
                                            })
                                        }
                                    }
                                }
                            })
                        })
                    }
                })
            })
        }
        catch(error) {
            console.error(error)
        }

        // cherche le rdv
        const rdv = await models.RDV.findOne({
            include: [
                {model : models.Client},
                {model : models.Historique, include: [
                    {model : models.User, include : [
                        {model : models.Structure}
                    ]}
                ]},
                {model : models.User},
                {model : models.Etat},
                {model : models.Campagne}
            ],
            where: {
                id: req.body.idRdv
            }
        })

        if(rdv === null) throw "Le RDV est introuvable"

        // variable permettant de récupérer l'idEtat avant modification dans le cadre où le rdv a déjà été facturé
        let currentIdEtat = undefined
        if(rdv.facturation) currentIdEtat = Number(rdv.idEtat)

        // on vérifie s'il existe un historique en hors critère pour le retirer (cas d'une erreur)
        if(Number(req.body.statut) !== 2) {
            const historique = await models.Historique.findOne({
                where : {
                    idClient : rdv.idClient,
                    idAction : 5
                },
                order : [['id', 'DESC']]
            })

            if(historique !== null) {
                historique.destroy()
            }
        }
        
        // statut hors critère
        // création d'un historique en hors critères
        if(Number(req.body.statut) === 2) {
            const temp_histo = {
                idAction : 5,
                idCampagne: rdv.Historique.idCampagne,
                sousstatut : req.body.sousstatut,
                commentaire : req.body.commentaireHC,
                dateevent: moment(rdv.date, 'DD/MM/YYYY HH:mm').format('YYYY-MM-DD HH:mm'),
                idClient: rdv.Historique.idClient,
                idUser: rdv.Historique.idUser
            }

            const historique = await models.Historique.create(temp_histo)
            // req.body.idHisto = historique.id
        }
        // compte rendu hors critère
        if(Number(req.body.idEtat) === 14) {      
            req.body.commentaire = req.body.commentaireHC

            // màj de l'historique de rdv en cours
            rdv.Historique.sousstatut = req.body.sousstatut
            rdv.Historique.commentaire = req.body.commentaire
            // await rdv.Historique.save()
        }        

        // retrait du sous statut et du commentaire s'il y en avait un et qu'il n'y en a plus
        if(rdv.Historique.sousstatut && !req.body.sousstatut) {
            rdv.Historique.sousstatut = null
        }
        if(rdv.Historique.commentaire && (!req.body.commentaire || !req.body.commentaireHC)) {
            rdv.Historique.commentaire = null
        }

        const tabPromises = [
            // met à jour l'historique si des modifs ont été apportées
            rdv.Historique.save(),
            // met à jour le rdv
            rdv.update(req.body),
            // crée le log de la modification du rdv
            models.logRdv.create(req.body)
        ]

        await Promise.all(tabPromises)

        // si le statut est à repositionner et qu'une date est fixée on crée l'historique du rappel
        if(Number(req.body.statut) === 3 && isSet(req.body.dateRappel)) {
            const historique = await models.Historique.create({
                idAction : 8,
                idCampagne: rdv.Historique.idCampagne,
                dateevent: moment(req.body.dateRappel, 'DD/MM/YYYY HH:mm').format('YYYY-MM-DD HH:mm'),
                idClient: rdv.Historique.idClient,
                idUser: rdv.Historique.idUser,
                commentaire : isSet(req.body.commentaireRappel) ? req.body.commentaireRappel : null
            })

            if(historique === null) throw "Erreur lors de la création du rappel."

            rdv.Client.currentAction = 8
            await rdv.Client.save()
        }
        // si le rdv est reporté
        else if(req.body.datenew != "" && typeof req.body.datenew != 'undefined') {
            const temp_histo = {
                idAction: 1,
                idCampagne: rdv.Historique.idCampagne,
                dateevent: req.body.datenew,
                idClient: rdv.Historique.idClient,
                idUser: rdv.Historique.idUser
            }

            const historique = await models.Historique.create(temp_histo)

            const temp_rdv = {
                idClient: historique.idClient,
                idHisto: historique.id,
                idVendeur: rdv.idVendeur,
                idCampagne: rdv.Historique.idCampagne,
                idEtat: 0,
                commentaire: req.body.commentaireNew,
                date: req.body.datenew,
                r: req.body.rnew != "" ? req.body.rnew : null,
                source : rdv.source
            }

            const rdv_new = await models.RDV.create(temp_rdv)

            historique.idRdv = rdv_new.id
            await historique.save()
        }

        // gestion de l'état pour la facturation
        if(currentIdEtat !== undefined) {
            const newIdEtat = Number(rdv.idEtat)
            // dans le cas où il y a eu un changement
            if(currentIdEtat !== newIdEtat) {
                const ETAT_VENTE = 1
                const ETAT_DEMSUI = 2
                const ETAT_DEMRAF = 3
                const ETAT_DECOUVERTE = 8
                const ETAT_DEVIS = 9

                // cas d'un rdv déjà facturé qui passe en vente
                if([ETAT_DEMSUI, ETAT_DEMRAF, ETAT_DECOUVERTE, ETAT_DEVIS].includes(currentIdEtat) && newIdEtat === ETAT_VENTE) {
                    rdv.flagFacturationChange = true
                    await rdv.save()
                }
            }
        }

        infoObject = clientInformationObject(undefined, "Le compte rendu a bien été ajouté.")
    }
    catch(error) {
        infoObject = clientInformationObject(error)
    }

    res.send({
        infoObject
    })    
});

router.post('/get-type' ,(req, res, next) => {
    models.Client.aggregate('type', 'DISTINCT', {
        plain: false,
        where: {
            source: req.body.type_de_fichier
        }
    })
    .then(findedType => {
        res.send(findedType);
    })
});

router
// accès à la page des sms
.get('/sms', (req, res) => {
    res.render('manager/manager_sms', { extractStyles: true, title: 'SMS | FUEGO', description:'SMS envoyés / reçus', session: req.session.client, options_top_bar: 'telemarketing', dateDebut : moment().startOf('month').format('DD/MM/YYYY'), dateFin : moment().endOf('month').format('DD/MM/YYYY') });
})
// récupère les sms envoyés
.get('/sms/sent', async (req, res) => {
    let infoObject = undefined
    let smsSent = undefined

    let dateDebut = req.query.dateDebut
    let dateFin = req.query.dateFin

    try {
        if(isSet(dateDebut) && isSet(dateFin)) {
            dateDebut = moment(dateDebut, 'DD/MM/YYYY').format('YYYY-MM-DD')
            dateFin = moment(dateFin, 'DD/MM/YYYY').format('YYYY-MM-DD')
        }
        else if(isSet(dateDebut)) {
            dateDebut = moment(dateDebut, 'DD/MM/YYYY').format('YYYY-MM-DD')
            dateFin = moment().format('YYYY-MM-DD')
        }
        else if(isSet(dateFin)) {
            dateDebut = moment().format('YYYY-MM-DD')
            dateFin = moment(dateFin, 'DD/MM/YYYY').format('YYYY-MM-DD')
        }
        else {
            dateDebut = moment().format('YYYY-MM-DD')
            dateFin = moment().format('YYYY-MM-DD')
        }

        smsSent = await getListeSMS('outgoing', moment(`${dateDebut} 00:00:00`).toISOString(true), moment(`${dateFin} 23:59:59`).toISOString(true))

        if(smsSent === null || smsSent.length === 0) infoObject = clientInformationObject(undefined, 'La liste des SMS envoyés est vide.')
    }
    catch(error) {
        infoObject = clientInformationObject(error)
        smsSent = undefined
    }

    res.send({
        infoObject,
        smsSent
    })
})
// récupère les sms reçus
.get('/sms/received', async (req, res) => {
    let infoObject = undefined
    let smsReceived = undefined

    let dateDebut = req.query.dateDebut
    let dateFin = req.query.dateFin

    try {
        if(isSet(dateDebut) && isSet(dateFin)) {
            dateDebut = moment(dateDebut, 'DD/MM/YYYY').format('YYYY-MM-DD')
            dateFin = moment(dateFin, 'DD/MM/YYYY').format('YYYY-MM-DD')
        }
        else if(isSet(dateDebut)) {
            dateDebut = moment(dateDebut, 'DD/MM/YYYY').format('YYYY-MM-DD')
            dateFin = moment().format('YYYY-MM-DD')
        }
        else if(isSet(dateFin)) {
            dateDebut = moment().format('YYYY-MM-DD')
            dateFin = moment(dateFin, 'DD/MM/YYYY').format('YYYY-MM-DD')
        }
        else {
            dateDebut = moment().format('YYYY-MM-DD')
            dateFin = moment().format('YYYY-MM-DD')
        }

        smsReceived = await getListeSMS('incoming', moment(`${dateDebut} 00:00:00`).toISOString(true), moment(`${dateFin} 23:59:59`).toISOString(true))

        if(smsReceived === null || smsReceived.length === 0) infoObject = clientInformationObject(undefined, 'La liste des SMS reçus est vide.')
    }
    catch(error) {
        infoObject = clientInformationObject(error)
        smsReceived = undefined
    }

    res.send({
        infoObject,
        smsReceived
    })
})
// supprime un sms
.delete('/sms/delete/:action/:id', async (req, res) => {
    const action = req.params.action
    const id = req.params.id
    
    let infoObject = undefined

    try {
        if(!["incoming", "outgoing"].includes(action)) throw `${action} : action inconnue.`

        const service_sms = await getServiceSMS()

        if(service_sms === null || service_sms.length === 0) throw 'Aucun service sms disponible.'

        await (new Promise((resolve, reject) => {
            ovh.request('DELETE', `/sms/${service_sms}/${action}/${id}`, (err, errorStatus) => {
                if(err) reject(`Erreur ovh lors de la suppression du sms ${action}/${id} : ${err} - ${errorStatus}`)
                
                resolve()
            })
        }))

        infoObject = clientInformationObject(undefined, "Le sms a bien été supprimé.")
    }
    catch(error) {
        infoObject = clientInformationObject(error)
    }

    res.send({
        infoObject
    })
})
.get('/rapportActivite', (req, res) => {
    const yesterday = moment().subtract(1, 'day')
    const dateDebut = dateFin = yesterday.format('DD/MM/YYYY')

    res.render('manager/manager_rapportActivite', { extractStyles: true, title: 'Rapport d\'activité | FUEGO', description:'Rapport d\'activité', session: req.session.client, options_top_bar: 'telemarketing', dateDebut, dateFin });
})
.get('/rapportActivite/create', async (req, res) => {
    let dateDebut = req.query.dateDebut
    let dateFin = req.query.dateFin

    try {
        if(!isSet(dateDebut)) throw "Une date de début doit être sélectionnée."
        if(!isSet(dateFin)) throw "une date de Fin doit être sélectionnée."

        dateDebut = `${moment(dateDebut, 'DD/MM/YYYY').format('YYYY-MM-DD')} 00:00:00`
        dateFin = `${moment(dateFin, 'DD/MM/YYYY').format('YYYY-MM-DD')} 23:59:59`

        const data = {}

        let nbParEtat = await models.RDV.findAll({
            attributes : [
                [sequelize.col('Etat.nom'), 'etat'],
                [sequelize.fn('COUNT', sequelize.col('RDV.id')), 'nb']
            ],
            include : [
                { 
                    model : models.Etat,
                    attributes : []
                }
            ],
            where : {
                statut : 1,
                date : {
                    [Op.between] : [dateDebut, dateFin]
                }
            },
            group : 'RDV.idEtat',
            order : [[sequelize.col('nb'), 'DESC']]
        })

        let total = 0

        // on cherche à récupérer le détail des rdvs que s'il y en a
        if(nbParEtat === null || nbParEtat.length === 0) {
            nbParEtat = [{
                etat : "TOTAL",
                nb : total
            }]

            data.listeRdvs = []
        }
        else {
            // parcours les états pour s'il y en a un à null le passer à "SANS RAPPORT"
            // et compte du nombre total            
            nbParEtat = nbParEtat.map(item => {
                const etat = JSON.parse(JSON.stringify(item))

                if(etat.etat === null) etat.etat = "SANS RAPPORT"

                total += etat.nb

                return etat
            })

            nbParEtat.push({
                etat : "TOTAL",
                nb : total
            })

            // récupération du détails des rdvs par état
            let listeRdvs = await models.RDV.findAll({
                attributes : [
                    [sequelize.col('RDV.date'), 'date'],
                    [sequelize.fn('CONCAT', sequelize.col('Client.prenom'), " ", sequelize.col('Client.nom')), 'client'],
                    [sequelize.fn('CONCAT', sequelize.col('User.prenom'), " ", sequelize.col('User.nom')), 'vendeur'],
                    [sequelize.col('Client.cp'), 'cp'],
                    [sequelize.col('Client.ville'), 'ville'],
                    [sequelize.col('Historique.commentaire'), 'commentaire'],
                    [sequelize.col('Client.source'), 'source'],
                    [sequelize.col('Etat.nom'), 'etat'],
                ],
                include : [
                    { 
                        model : models.Client,
                        attributes : []
                    },
                    { 
                        model : models.User,
                        attributes : []
                    },
                    { 
                        model : models.Historique,
                        attributes : []
                    },
                    { 
                        model : models.Etat,
                        attributes : []
                    },
                ],
                where : {
                    statut : 1,
                    date : {
                        [Op.between] : [dateDebut, dateFin]
                    }
                },
                // group : 'RDV.idEtat',
                order : [
                    [sequelize.col('etat'), 'ASC'],
                    [sequelize.col('date'), 'ASC']
                ]
            })

            listeRdvs = listeRdvs.map(item => {
                const rdv = JSON.parse(JSON.stringify(item))

                if(rdv.commentaire === null) rdv.commentaire = ''
                if(rdv.source === null) rdv.source = ''
                if(rdv.etat === null) rdv.etat = 'SANS RAPPORT'
                if(rdv.vendeur === null) rdv.vendeur = ''

                const date = moment(rdv.date, 'DD/MM/YYYY HH:mm').format('DD/MM/YYYY')
                const heure = moment(rdv.date, 'DD/MM/YYYY HH:mm').format('HH:mm')

                rdv.date = date
                rdv.heure = heure

                return rdv
            })
            
            data.listeRdvs = listeRdvs            
        }

        data.nbParEtat = nbParEtat
        data.dateDebut = moment(dateDebut).format('DD/MM/YYYY')
        data.dateFin = moment(dateFin).format('DD/MM/YYYY')

        req.session.dataRapportActivite = data

        res.redirect(`/pdf/rapportActivite_${moment(data.dateDebut, 'DD/MM/YYYY').format('DD-MM-YYYY')}_${moment(data.dateFin, 'DD/MM/YYYY').format('DD-MM-YYYY')}.pdf`)
    }
    catch(error) {
        const infoObject = clientInformationObject(error)
        res.send(infoObject.error)
    }
})

function getNumber(tel1,tel2,tel3){
    if(tel1 == null || !isSet(tel1)){
        tel1 = "0300000000"
    }
    if(tel2 == null || !isSet(tel2)){
        tel2 = "0300000000"
    }
    if(tel3 == null || !isSet(tel3)){
        tel3 = "0300000000"
    }

    let regex = /^((\+)330|0)[6](\d{2}){4}$/g
    if(formatPhone(tel1).match(regex) != null){
        return tel1
    }
    if(formatPhone(tel2).match(regex) != null){
        return tel2
    }
    if(formatPhone(tel3).match(regex) != null){
        return tel3
    }
    return false
}

function formatPhone(phoneNumber){

    if(phoneNumber != null && typeof phoneNumber != 'undefined' && phoneNumber != ' '){
        phoneNumber = cleanit(phoneNumber);
	    phoneNumber = phoneNumber.split(' ').join('')
        phoneNumber = phoneNumber.split('.').join('')

        if(phoneNumber.length != 10){

            phoneNumber = '0'+phoneNumber;

            if(phoneNumber.length != 10){
                return undefined
            }else{
                return phoneNumber
            }
        }else{
            return phoneNumber
        }
    }

}

function cleanit(input) {
    input.toString().trim().split('/\s*\([^)]*\)/').join('').split('/[^a-zA-Z0-9]/s').join('')
	return input.toString().toLowerCase()
}

module.exports = router;

Array.prototype.insert = function ( index, item ) {
    this.splice( index, 0, item );
};

async function addCount(telepro){

    // let where

    // if(typeof user.Directive != 'undefined' && user.Directive != null && user.Directive.campagnes != null && user.Directive.campagnes.split(',').length >= 1 && user.Directive.campagnes.split(',')[0] != ''){
    //     where = await models.Campagne.findAll({
    //         where : {
    //             id: {
    //                 [Op.in] : user.Directive.campagnes.split(',')
    //             }
    //         }
    //     }).then(findedCampagnes => {
    //         let deps = []
    //         let where
    //         findedCampagnes.forEach((element) => {
    //             deps.push(element.deps.split(','))
    //         })

    //         deps = _.uniq(_.flatten(deps))

    //         if(user.Directive.deps.split(',').length >= 1 && user.Directive.deps.split(',')[0] != ''){
    //             where = {
    //                 dep : {
    //                     [Op.in] : user.Directive.deps.split(',')
    //                 },
    //                 currentCampagne :{
    //                     [Op.in]: user.Directive.campagnes.split(',')
    //                 },
    //             }
    //         }else {
    //             where = {
    //                 dep : {
    //                     [Op.in] : deps
    //                 },
    //                 currentCampagne :{
    //                     [Op.in]: user.Directive.campagnes.split(',')
    //                 },
    //             }
    //         }
    //         return where
    //     })
    // }else{
    //     if(typeof user.Directive != 'undefined' && user.Directive != null){
    //         if(user.Directive.deps.split(',').length > 1){
    //             where = {
    //                 dep : {
    //                     [Op.in] : user.Directive.deps.split(',')
    //                 },
    //                 source : {
    //                     [Op.substring] : user.Directive.type_de_fichier
    //                 },
    //                 type : {
    //                     [Op.substring] : user.Directive.sous_type
    //                 },
    //                 currentAction :{
    //                     [Op.is]: null
    //                 },
    //             }
    //         }else if(user.Directive.deps.split(',').length == 0) {
    //             where = {
    //                 source : {
    //                     [Op.substring] : user.Directive.type_de_fichier
    //                 },
    //                 type : {
    //                     [Op.substring] : user.Directive.sous_type
    //                 },
    //                 currentAction :{
    //                     [Op.is]: null
    //                 },
    //             }
    //         }else{
    //             where = {
    //                 dep : user.Directive.deps.split(','),
    //                 source : {
    //                     [Op.substring] : user.Directive.type_de_fichier
    //                 },
    //                 type : {
    //                     [Op.substring] : user.Directive.sous_type
    //                 },
    //                 currentAction :{
    //                     [Op.is]: null
    //                 },
    //             }
    //         }
    //         }else{
    //             where = {}
    //         }
    // }

    // result = await models.Client.count({
    //     where : where
    // }).then((count) => {
    //     return count
    // }).catch(er => {
    //     console.log(er)
    // })

    // return result

    let count = 0
    let depsAvailable = []
    let where = {}

    if(telepro.Directive && telepro.Directive.deps && telepro.Directive.deps !== '') {
        depsAvailable = telepro.Directive.deps.split(',')
    }
    else if(telepro.Structures){   
        for(const structure of telepro.Structures) {
            if(structure.deps !== null && structure.deps !== '') {
                const deps = structure.deps.split(',')
                for(const dep of deps) {
                    if(!depsAvailable.includes(dep)) depsAvailable.push(dep)
                }
            }
        }
    }



    return count
}