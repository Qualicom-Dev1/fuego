const express = require('express');
const router = express.Router();
const models = global.db;
const moment = require('moment');
const sequelize = require('sequelize')
const Op = sequelize.Op;
const dotenv = require('dotenv')
const clientInformationObject = require('../utils/errorHandler');
const isSet = require('../utils/isSet');
dotenv.config();

router
// affiche l'écran pour la salle télépros
.get('/', async (req, res) => {    
    res.render('affichageSalle/affichageSalle', { extractStyles: true, title: 'Activité télémarketing | FUEGO', description:'Affichage salle télémarketing',  session: req.session.client });
})
// renvoie le dernier message d'information ou de motivation
.get('/infoTexte', async (req, res) => {
    let infoObject = undefined
    let messages = []

    try {
        if(req.session.client.Structures) {
            const idsStructures = req.session.client.Structures.map(structure => structure.id)

            for(const idStructure of idsStructures) {
                const message = await models.Message.findOne({
                    include : {
                        model : models.Structure,
                        attributes : ['nom'],
                        where : {
                            idType : 1
                        }
                    },
                    where : {
                        idStructure
                    },
                    order : [['id', 'desc']],
                    limit : 1
                })

                if(message !== null) {
                    messages.push(message)
                }
            }
        }

        if(messages === null || messages.length === 0) {
            message = undefined
            infoObject = clientInformationObject(undefined, "Aucun message de disponible.")
        }
    }
    catch(error) {
        infoObject = clientInformationObject(error)
        messages = undefined
    }

    res.send({
        infoObject,
        messages
    })
})
// ajoute un message d'information ou de motivation
.post('/infoTexte', async (req, res) => {
    const idStructure = Number(req.body.idStructure)
    let messageSent = req.body.message

    let infoObject = undefined
    let message = undefined

    try {
        if(isNaN(idStructure)) throw "L'identifiant de la structure est incorrect."
        if(!isSet(messageSent)) throw "Le message doit être renseigné."

        const structure = await models.Structure.findOne({
            where : {
                id : idStructure,
                idType : 1
            }
        })

        if(structure === null) throw "La structure est introuvable."

        messageSent = messageSent.trim()

        message = await models.Message.create({
            idStructure,
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
    let tabObjectifs = undefined

    try {
        let whereIdVendeur = {
            id : {
                [Op.not] : null
            }
        }

        // récupération des idVendeur uniquement pour ceux affilié aux strucutures de l'utilisateur
        if(req.session.client.Structures) {
            const idsStrucutres = req.session.client.Structures.map(structure => structure.id)

            const structuresDependances = await models.Structuresdependence.findAll({
                attributes: ['idUser'],
                where : {
                    idStructure : {
                        [Op.in] : idsStrucutres
                    }
                }
            })

            if(structuresDependances !== null && structuresDependances.length > 0) {
                const idsVendeurs = structuresDependances.map(dependance => dependance.idUser)

                if(idsVendeurs !== null && idsVendeurs.length > 0) {
                    whereIdVendeur = {
                        id : {
                            [Op.in] : idsVendeurs
                        }
                    }
                }
            }
        }

        // récupération des vendeurs et de leur objectif
        const vendeurs = await models.User.findAll({
            attributes : [
                'id', 'prenom', 'nom', 'objectif'
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
            ],
            where : whereIdVendeur,
            order : [['nom', 'ASC']]
        })
        if(vendeurs === null || vendeurs.length === 0) throw "Aucun vendeur présent en base de données."

        // transformation en tableau associatif
        tabObjectifs = []

        for(const vendeur of vendeurs) {
            // si l'objectif n'est pas défini, on lui donne celui par défaut
            if(!isSet(vendeur.objectif)) {
                vendeur.objectif = 2
            }

            tabObjectifs[vendeur.id] = {
                prenom : vendeur.prenom,
                nom : vendeur.nom,
                objectif : vendeur.objectif
            }
        }

        // l'objectif est pour le lendemain soit aujourd'hui +1 en semaine ou jusqu'à +3 le vendredi
        let demain = moment().add(1, 'day').format('YYYY-MM-DD')
        // vendredi
        if(moment().get('day') === 5) demain = moment().add(3, 'day').format('YYYY-MM-DD')
        // samedi
        else if(moment().get('day') === 6) demain = moment().add(2, 'day').format('YYYY-MM-DD')

        const start = `${demain} 00:00:00`
        const end = `${demain} 23:59:59`

        const [events, rdvs] = await Promise.all([
            // récupération des événements du lendemain
            models.Event.findAll({
                attributes : [
                    'idCommercial', 'allDay'
                ],
                where : {
                    start : {
                        [Op.between] : [start, end]
                    }
                },
                order : [['idCommercial', 'ASC']]
            }),
            // récupération du nombre de rdvs du lendemain / vendeur
            models.RDV.findAll({
                attributes : [
                    'idVendeur',
                    [sequelize.fn('COUNT', sequelize.col('RDV.id')), 'nbRdvs']
                ],
                where : {
                    date : {
                        [Op.between] : [start, end]
                    },
                    [Op.or] : [
                        { idEtat : 0 },
                        { idEtat : null }
                    ]
                },
                group : 'idVendeur',
                order : [['idVendeur', 'ASC']]
            })
        ])
        if(events === null) throw "Une erreur est survenue lors de la récupération des absences."
        if(rdvs === null) throw "Une erreur est survenue lors de la récupération des rdvs."

        // parcours des événement pour les retirer des objectifs
        if(events.length > 0) {            
            // 1 événement allDay false = -1
            // 1 événement allDay true = 0
            for(const event of events) {
                if(tabObjectifs[event.idCommercial]) {
                    if(event.allDay) tabObjectifs[event.idCommercial].objectif = 0
                    else tabObjectifs[event.idCommercial].objectif -= 1
                }
            }
        }

        // parcours des rdvs pour les retirer des objectifs
        if(rdvs.length > 0) {
            for(let rdv of rdvs) {
                rdv = JSON.parse(JSON.stringify(rdv))
                if(tabObjectifs[rdv.idVendeur]) {
                    tabObjectifs[rdv.idVendeur].objectif -= rdv.nbRdvs
                }
            }          
        }

        tabObjectifs = tabObjectifs.filter(vendeur => vendeur !== null)
        
        for(const vendeur of tabObjectifs) {
            if(vendeur.objectif < 0) vendeur.objectif = 0
        }

        // tri du tableau par rapport au nom
        tabObjectifs = tabObjectifs.sort((a,b) => a.nom > b.nom ? 1 : (a.nom < b.nom ? -1 : 0))
    }
    catch(error) {
        infoObject = clientInformationObject(error)
        tabObjectifs = undefined
    }

    res.send({
        infoObject,
        tabObjectifs
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

        let whereIdTelepro = {
            id : {
                [Op.not] : null
            }
        }

        // récupère les IDs des télépros de la même structure
        if(req.session.client.Structures) {
            const idsStrucutres = req.session.client.Structures.map(structure => structure.id)

            const usersStructures = await models.UserStructure.findAll({
                attributes: [[sequelize.fn('DISTINCT', sequelize.col('UserStructure.idUser')), 'idUser']],
                where : {
                    idStructure : {
                        [Op.in] : idsStrucutres
                    }
                }
            })

            if(usersStructures !== null && usersStructures.length > 0) {
                const idsTelepros = usersStructures.map(appartenance => appartenance.idUser)

                if(idsTelepros !== null && idsTelepros.length > 0) {
                    whereIdTelepro = {
                        id : {
                            [Op.in] : idsTelepros
                        }
                    }
                }
            }
        }

        listeTelepros = await models.Historique.findAll({
            attributes : [
                'idUser',
                [sequelize.fn('COUNT', sequelize.col('Historique.id')), 'nbRdvs']
            ],
            include : [
                // uniquement les télépros
                {
                    model : models.User,
                    attributes : ['nom', 'prenom'],
                    include : [
                        {
                            model : models.Role,
                            attributes : [],
                            where : {
                                nom : 'Telepro'
                            }
                        }
                    ],
                    where : whereIdTelepro
                },
                // uniquement les RDVs qui n'ont pas de compte rendu, donc pas compter un rdv et son repos si le même jour par exemple
                {
                    model : models.RDV,
                    attributes : [],
                    where : {
                        [Op.or] : [
                            { idEtat : 0 },
                            { idEtat : null }
                        ]
                    }
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
        let whereIdVendeur = {
            id : {
                [Op.not] : null
            }
        }

        // récupération des idVendeur uniquement pour ceux affilié aux strucutures de l'utilisateur
        if(req.session.client.Structures) {
            const idsStrucutres = req.session.client.Structures.map(structure => structure.id)

            const structuresDependances = await models.Structuresdependence.findAll({
                attributes: ['idUser'],
                where : {
                    idStructure : {
                        [Op.in] : idsStrucutres
                    }
                }
            })

            if(structuresDependances !== null && structuresDependances.length > 0) {
                const idsVendeurs = structuresDependances.map(dependance => dependance.idUser)

                if(idsVendeurs !== null && idsVendeurs.length > 0) {
                    whereIdVendeur = {
                        id : {
                            [Op.in] : idsVendeurs
                        }
                    }
                }
            }
        }

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
            ],
            where : whereIdVendeur
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

        // l'objectif est pour le lendemain soit aujourd'hui +1 en semaine ou jusqu'à +3 le vendredi
        let demain = moment().add(1, 'day').format('YYYY-MM-DD')
        // vendredi
        if(moment().get('day') === 5) demain = moment().add(3, 'day').format('YYYY-MM-DD')
        // samedi
        else if(moment().get('day') === 6) demain = moment().add(2, 'day').format('YYYY-MM-DD')

        const start = `${demain} 00:00:00`
        const end = `${demain} 23:59:59`

        const [events, rdvs] = await Promise.all([
            // récupération des événements du lendemain
            models.Event.findAll({
                attributes : [
                    'idCommercial', 'allDay'
                ],
                where : {
                    start : {
                        [Op.between] : [start, end]
                    }
                },
                order : [['idCommercial', 'ASC']]
            }),
            // récupération du nombre de rdvs du lendemain / vendeur
            models.RDV.findAll({
                attributes : [
                    'idVendeur',
                    [sequelize.fn('COUNT', sequelize.col('RDV.id')), 'nbRdvs']
                ],
                where : {
                    date : {
                        [Op.between] : [start, end]
                    },
                    [Op.or] : [
                        { idEtat : 0 },
                        { idEtat : null }
                    ]
                },
                group : 'idVendeur',
                order : [['idVendeur', 'ASC']]
            })
        ])
        if(events === null) throw "Une erreur est survenue lors de la récupération des absences."
        if(rdvs === null) throw "Une erreur est survenue lors de la récupération des rdvs."

         // parcours des événement pour les retirer des objectifs
        if(events.length > 0) {           
            // 1 événement allDay false = -1
            // 1 événement allDay true = 0
            for(const event of events) {
                if(tabObjectifs[event.idCommercial]) {
                    if(event.allDay) tabObjectifs[event.idCommercial] = 0
                    else tabObjectifs[event.idCommercial] -= 1
                }
            }
        }

        // parcours des rdvs pour les retirer des objectifs
        if(rdvs.length > 0) {
            for(let rdv of rdvs) {
                rdv = JSON.parse(JSON.stringify(rdv))
                if(tabObjectifs[rdv.idVendeur]) {
                    tabObjectifs[rdv.idVendeur] -= rdv.nbRdvs
                }
            }          
        }
        
        objectif = tabObjectifs.reduce((accumulator, currentValue) => {
            if(isSet(currentValue) && currentValue >= 0) {
                return accumulator + currentValue
            }
            else {
                return accumulator
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
    let infoObject = undefined
    let structures = undefined

    try {
        if(!req.session.client.Structures) throw "Vous n'êtes relié à aucune structure."

        structures = req.session.client.Structures.filter(structure => {
            // on vérifie que ce soit un plateau TMK
            if(structure.idType === 1) {
                return {
                    id : structure.id,
                    nom : structure.nom
                }
            }
        })

        if(structures === null || structures.length === 0) throw "Aucune structure correspondante."
    }
    catch(error) {
        infoObject = clientInformationObject(error)
        structures = undefined
    }

    res.render('affichageSalle/manageAffichage', { extractStyles: true, title: 'Gestion écran | FUEGO', description:'Gestion affichage salle télémarketing', options_top_bar: 'telemarketing', session: req.session.client, infoObject, structures });
})

module.exports = router