const express = require('express');
const router = express.Router();
const models = require("../models/index");
const moment = require('moment');
const sequelize = require('sequelize')
const Op = sequelize.Op;
const dotenv = require('dotenv')
const clientInformationObject = require('./utils/errorHandler');
const isSet = require('./utils/isSet');
const { info } = require('../logger/logger');
dotenv.config();

router
// affiche l'écran pour la salle télépros
.get('/', (req, res) => {
    res.render('affichageSalle/affichageSalle', { extractStyles: true, title: 'Activité télémarketing | FUEGO', description:'Affichage salle télémarketing',  session: req.session.client });
})
// renvoie le dernier message d'information ou de motivation
.get('/infoTexte', async (req, res) => {
    let infoObject = undefined
    let message = undefined

    try {
        message = await models.Message.findOne({
            order : [['id', 'desc']],
            limit : 1
        })

        if(message === null) {
            message = undefined
            infoObject(undefined, "Aucun message de disponible.")
        }
    }
    catch(error) {
        infoObject = clientInformationObject(error)
    }

    res.send({
        infoObject,
        message
    })
})
// ajoute un message d'information ou de motivation
.post('/infoTexte', async (req, res) => {
    let messageSent = req.body.message

    let infoObject = undefined
    let message = undefined

    try {
        if(!isSet(messageSent)) throw "Le message doit être renseigné."

        messageSent = messageSent.trim()

        message = await models.Message.create({
            texte : messageSent
        })

        if(message === null) throw "Une erreur est survenue lors de la création du message, veuillez recommencer plus tard."

        infoObject = clientInformationObject(undefined, 'Le message a bien été créé.')
    }
    catch(error) {
        infoObject = clientInformationObject(error)
        message = undefined
    }

    res.send({
        infoObject,
        message
    })
})
// renvoie la liste des vendeurs et leur nombre de rdv ce jour (ordre alphabétique)
.get('/rdv-vendeurs', async (req, res) => {
    let infoObject = undefined
    let listeVendeurs = undefined

    try {
        const today = moment().format('YYYY-MM-DD')
        const start = `${today} 00:00:00`
        const end = `${today} 23:59:59`

        listeVendeurs = await models.RDV.findAll({
            attributes : [
                'idVendeur',
                [sequelize.fn('COUNT', sequelize.col('RDV.id')), 'nbRdvs']
            ],
            include : [
                { 
                    model : models.User,
                    attributes : ['nom', 'prenom']
                }
            ],
            where : {
                date : {
                    [Op.between] : [start, end]
                },
                idVendeur : {
                    [Op.not] : null
                },
                statut : 1
            },
            group : 'idVendeur',
            order : [[models.User, 'nom', 'ASC']]
        })

        if(listeVendeurs === null || listeVendeurs.length === 0) {
            listeVendeurs = undefined
            infoObject = clientInformationObject(undefined, "Aucun rdv attribué ce jour.")
        }
    }
    catch(error) {
        listeVendeurs = undefined
        infoObject = clientInformationObject(error)
    }

    res.send({
        infoObject,
        listeVendeurs
    })
})
// renvoie la liste des télépros avec le nombre de rdv pris ce jour (ordre nb rdv décroissant)
.get('/rdv-telepros', async (req, res) => {
    let infoObject = undefined
    let listeTelepros = undefined

    try {
        const today = moment().format('YYYY-MM-DD')
        const start = `${today} 00:00:00`
        const end = `${today} 23:59:59`

        listeTelepros = await models.Historique.findAll({
            attributes : [
                'idUser',
                [sequelize.fn('COUNT', sequelize.col('Historique.id')), 'nbRdvs']
            ],
            include : [
                {
                    model : models.User,
                    attributes : ['nom', 'prenom'],
                    include : [
                        {
                            model : models.Role,
                            attributes : []
                        }
                    ]
                }
            ],
            where : {
                createdAt : {
                    [Op.between] : [start, end]
                },
                idAction : 1,
                idRdv : {
                    [Op.not] : null
                },
                idUser : {
                    [Op.not] : null
                },
                '$User->Role.typeDuRole$' : 'TMK'
            },
            group : 'idUser',
            order : [[sequelize.col('nbRdvs'), 'DESC'], [models.User, 'nom', 'ASC']]
        })

        if(listeTelepros === null || listeTelepros.length === 0) {
            infoObject = clientInformationObject(undefined, "Aucun rdv pris.")
        }
    }
    catch(error) {
        infoObject = clientInformationObject(error)
    }

    res.send({
        infoObject,
        listeTelepros
    })
})
// renvoie le nombre de ventes total sur le mois en cours
.get('/nbVentes', async (req, res) => {
    let infoObject = undefined
    let nbVentes = undefined

    try {
        const start = `${moment().startOf('month').format('YYYY-MM-DD')} 00:00:00`
        const end = `${moment().endOf('month').format('YYYY-MM-DD')} 23:59:59`

        const query = await models.sequelize.query(`
            SELECT COUNT(*) AS nbVentes FROM RDVs 
            WHERE date BETWEEN '${start}' AND '${end}'
            AND idEtat = 1
        `, {
            type : sequelize.QueryTypes.SELECT
        })

        if(query === null || query.length === 0) throw "Une erreur est survenue lors de la récupération du nombre de ventes du mois."

        nbVentes = query[0].nbVentes
    }
    catch(error) {
        infoObject = clientInformationObject(error)
    }

    res.send({
        infoObject,
        nbVentes
    })
})
// renvoie l'avancée de l'objectif de rdv du jour (x vendeurs * y disponibilités restantes)
.get('/objectif', async (req, res) => {
    let infoObject = undefined
    let objectif = undefined

    try {
        // récupération des IDs vendeurs et de leur objectif
        const vendeurs = await models.User.findAll({
            attributes : [
                'id', 'objectif'
            ],
            include : [
                {
                    model : models.Role,
                    attributes : [],
                    where : {
                        typeDuRole : 'Commercial',
                        nom : {
                            [Op.not] : 'Directeur Co'
                        }
                    }
                }
            ]
        })

        if(vendeurs === null || vendeurs.length === 0) throw "Aucun vendeur présent en base de données."

        // transformation en tableau associatif
        const tabObjectifs = []

        for(const vendeur of vendeurs) {
            // si l'objectif n'est pas défini, on lui donne celui par défaut
            if(!isSet(vendeur.objectif)) {
                vendeur.objectif = 2
            }

            tabObjectifs[vendeur.id] = vendeur.objectif
        }

        const today = moment().format('YYYY-MM-DD')
        const start = `${today} 00:00:00`
        const end = `${today} 23:59:59`

        // récupération des événements du jour
        const events = await models.Event.findAll({
            attributes : [
                'idCommercial', 'allDay'
            ],
            where : {
                start : {
                    [Op.between] : [start, end]
                }
            },
            order : [['idCommercial', 'ASC']]
        })

        if(events !== null && events.length > 0) {
            // parcours des événement pour les retirer des objectifs
            // 1 événement allDay false = -1
            // 1 événement allDay true = 0
            for(const event of events) {
                if(tabObjectifs[event.idCommercial]) {
                    if(event.allDay === 'true') tabObjectifs[event.idCommercial] = 0
                    else tabObjectifs[event.idCommercial] = tabObjectifs[event.idCommercial] - 1
                }
            }
        }

        // récupération du nombre de rdvs du jour / vendeur
        const rdvs = await models.RDV.findAll({
            attributes : [
                'IdVendeur',
                [sequelize.fn('COUNT', sequelize.col('RDV.id')), 'nbRdvs']
            ],
            where : {
                date : {
                    [Op.between] : [start, end]
                }
            },
            group : 'idVendeur',
            order : [['idVendeur', 'ASC']]
        })

        if(rdvs !== null && rdvs.length > 0) {
            for(const rdv of rdvs) {
                if(tabObjectifs[rdv.idVendeur]) tabObjectifs[rdv.idVendeur] -= rdv.nbRdvs
            }            
        }

        objectif = tabObjectifs.reduce((accumulator, currentValue) => {
            if(isSet(currentValue)) {
                return accumulator + currentValue
            }
        }, 0)
    }
    catch(error) {
        infoObject = clientInformationObject(error)
        objectif = undefined
    }

    res.send({
        infoObject,
        objectif
    })
})

.get('/manage', (req, res) => {
    res.render('affichageSalle/manageAffichage', { extractStyles: true, title: 'Gestion écran | FUEGO', description:'Gestion affichage salle télémarketing', options_top_bar: 'telemarketing', session: req.session.client });
})

module.exports = router