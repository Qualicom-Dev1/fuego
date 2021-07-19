const express = require('express');
const router = express.Router();
const models = global.db
const sequelize = require("sequelize")
const bcrypt = require('bcrypt')
const Op = sequelize.Op
const clientInformationObject = require('../../utils/errorHandler')
const isSet = require('../../utils/isSet')

const _ = require('lodash');

router.get('/' ,(req, res, next) => {
    res.render('parametres/equipes_commerciaux', { extractStyles: true, title: 'Paramètres commerciaux | FUEGO', session: req.session.client, options_top_bar: 'parametres'});
});

// const years = [2016, 2017, 2017, 2016, 2018, 2019]
    // const distinctYears = [...new Set(years)]
    // log = [2016, 2017, 2019, 2018]
router.get('/localisation_commerciaux' , async (req, res, next) => {
    // récupère les personnes sous les ordres de l'utilisateur en cours  
    let idDependence = []
    req.session.client.Usersdependences.forEach((element => {
        idDependence.push(element.idUserInf)    
    }))
    // ajoute l'id de l'utilisateur au tableau pour qu'il puisse obtenir ses informations également
    idDependence.push(req.session.client.id)

    const commerciaux = await models.sequelize.query(`
        SELECT mylist.idUser, mylist.nom, mylist.prenom, GROUP_CONCAT(DISTINCT mylist.depsStructure SEPARATOR '') AS depStructures, GROUP_CONCAT(DISTINCT mylist.depsCommercial) AS depsCommercial
        FROM
            (SELECT commerciauxQualicom.idUser, commerciauxQualicom.nom, commerciauxQualicom.prenom, commerciauxQualicom.idStructure, commerciauxQualicom.depsStructure, directives.deps AS depsCommercial
            FROM
                (SELECT commerciaux.id as idUser, commerciaux.nom, commerciaux.prenom, usersQualicom.idStructure, usersQualicom.depsStructure
                FROM
                (SELECT Users.id, Users.nom, Users.prenom FROM Users
                    inner join roles on Users.idRole = roles.id
                    WHERE roles.typeDuRole = "Commercial") AS commerciaux,
                (SELECT structures.id AS idStructure, idUser, deps AS depsStructure FROM structures
                    INNER JOIN structuresdependences on structures.id = structuresdependences.idStructure) AS usersQualicom
                WHERE commerciaux.id = usersQualicom.idUser) AS commerciauxQualicom
            LEFT JOIN directives ON commerciauxQualicom.idUser = directives.idUser  
            ORDER BY commerciauxQualicom.idUser ASC) AS mylist
        WHERE idUser IN (${idDependence})
        GROUP BY mylist.idUser
    `, { 
        // replacements : {
        //     dependances : idDependence
        // },
        type: sequelize.QueryTypes.SELECT 
    })
    // .then(commerciaux => {
    //     commerciaux.forEach(commercial => {
    //         // supprime les doublons de départements pour les départements des structures
    //         commercial.depStructures = [...new Set(commercial.depStructures.split(','))].toString()
    //     })
    //     res.send({ commerciaux })
    // })
    // .catch(e => {
    //     console.error(e)
    // })
    // 
    commerciaux.forEach(commercial => {
        // supprime les doublons de départements pour les départements des structures
        commercial.depStructures = [...new Set(commercial.depStructures.split(','))].toString()
    })
    res.render('parametres/localisation_commerciaux', { extractStyles: true, title: 'Localisation commerciaux | FUEGO', session: req.session.client, options_top_bar: 'parametres', commerciaux });
});

router.get('/sources' ,(req, res, next) => {
    models.Source.findAll({})
    .then((findedSources) => {
        models.TypeLigne.findAll({})
        .then((findedTypes) => {
            res.render('parametres/sources', { extractStyles: true, title: 'Paramètres sources et types | FUEGO', session: req.session.client, options_top_bar: 'parametres', findedSources: findedSources, findedTypes:findedTypes});            
        })
    })
});

router.post('/sources/ajouter' ,(req, res, next) => {
    if(req.body.type == 'source'){
        models.Source.create(req.body).then(() => res.send('ok'))
    }else{
        models.TypeLigne.create(req.body).then(() => res.send('ok'))
    }
});

router.get('/telemarketing' ,(req, res, next) => {
    models.User.findAll({
        include: [  
            {model: models.Role, where: {typeDuRole : 'TMK'}, include: models.Privilege},
            {model: models.Structure}
        ],
        order: [
            ['nom', 'asc']
        ]
    }).then(findedUsers => {
        res.render('parametres/equipes_telemarketing', { extractStyles: true, title: 'Télémarketing | FUEGO', session: req.session.client, options_top_bar: 'parametres', findedUsers: findedUsers});
    })
});

router.post('/telemarketing/get-dependence' ,(req, res, next) => {
    models.User.findOne({
        include: {model: models.Usersdependence},
        where: {
            id: req.body.id
        }
    })
    .then((findedDependences) => {
        res.send({findedDependences: findedDependences});
    }).catch(err => {
        console.log(err)
    })
});

router.post('/telemarketing/set-dependence' ,(req, res, next) => {
    let roles_privileges = []
    req.body.privileges.forEach((element) => {
        roles_privileges.push({idUserSup: req.body.role, idUserInf: element})
    })
    models.Usersdependence.destroy({
        where: {
            idUserSup : req.body.role
        }
    })
    .then(() => {
        models.Usersdependence.bulkCreate(roles_privileges)
        .then((findedDependences) => {
            res.send('ok')
        }).catch(err => {
            console.log(err)    
        })
    }).catch(err => {
        console.log(err)    
    })
});

router.get('/attributions' ,(req, res, next) => {
    models.Structure.findAll({
        include: [
            {model: models.Type, where: { nom: 'Plateau' }}
        ]
    }).then(findedStructures => {
        models.User.findAll({
            include: [  
                {model: models.Role, where: {typeDuRole : 'Commercial'}, include: models.Privilege},
                {model: models.Structure}
            ],
            order: [
                ['nom', 'asc']
            ]
        }).then(findedUsers => {
            res.render('parametres/attributions', { extractStyles: true, title: 'Attributions | FUEGO', session: req.session.client, options_top_bar: 'parametres', findedStructures: findedStructures, findedUsers: findedUsers}); 
        }).catch((err) => {
            console.log(err)
        })  
    }).catch((err) => {
        console.log(err)
    })  
});

router.post('/attributions/get-dependence' ,(req, res, next) => {
    models.Structure.findOne({
        include: {model: models.Structuresdependence},
        where: {
            id: req.body.id
        }
    })
    .then((findedDependences) => {
        res.send({findedDependences: findedDependences});
    }).catch(err => {
        console.log(err)
    })
});

router.post('/attributions/set-dependence' ,(req, res, next) => {
    let roles_privileges = []
    req.body.privileges.forEach((element) => {
        roles_privileges.push({idStructure: req.body.role, idUser: element})
    })
    models.Structuresdependence.destroy({
        where: {
            idStructure : req.body.role
        }
    })
    .then(() => {
        models.Structuresdependence.bulkCreate(roles_privileges)
        .then((findedDependences) => {
            res.send('ok')
        }).catch(err => {
            console.log(err)    
        })
    }).catch(err => {
        console.log(err)    
    })
});

router.get('/secteurs_structures' ,(req, res, next) => {
    models.Structure.findAll({
        include: [
            {model : models.Type, where: {
                nom: 'Plateau'
            }}
        ]
    }).then(findedStructures => {
        res.render('parametres/secteurs_structures', { extractStyles: true, title: 'attributions | FUEGO', session: req.session.client, options_top_bar: 'parametres', findedStructures : findedStructures});
    }).catch(err => {
        console.log(err)
    })
});

router.post('/update/secteurs_structures' ,(req, res, next) => {
    models.Structure.findOne({
        where: {
            id: req.body.idStructure
        }
    }).then(findedStructure => {
        findedStructure.update(req.body).then((
            res.send('ok')
        )).catch(err => {
            console.log(err)
        })
    }).catch(err => {
        console.log(err)
    })
});

router.get('/utilisateurs' ,(req, res, next) => {
    models.User.findAll({
        include: [
            {model: models.Role, include: models.Privilege},
            {model: models.Structure},
            {model: models.Usersdependence}
        ],
        order: [['nom', 'asc']]
    }).then((findedUsers) => {
        res.render('parametres/utilisateurs', { extractStyles: true, title: 'Utilisateurs | FUEGO', session: req.session.client, options_top_bar: 'parametres', findedUsers : findedUsers, _:_});
    })
});

router.get('/privileges' ,(req, res, next) => {
    models.Privilege.findAll()
    .then((findedPrivileges) => {
        models.sequelize.query('SELECT Roles.id, Roles.nom, count(Users.id) as count FROM Roles LEFT JOIN Users ON Roles.id=Users.idRole GROUP BY Roles.id, Roles.nom ORDER BY Roles.nom', { type: models.sequelize.QueryTypes.SELECT })
        .then((findedRoles) => {
            models.User.findAll()
            .then((findedUsers) => {
                res.render('parametres/roles_privileges', { extractStyles: true, title: 'Rôles - Privilèges | FUEGO', session: req.session.client, options_top_bar: 'parametres', findedPrivileges : findedPrivileges, findedRoles : findedRoles, findedUsers: findedUsers});
            }).catch(err => {
                console.log(err)    
            })
        }).catch(err => {
            console.log(err)    
        })
    }).catch((err) => {
        console.log(err)
    })
});

router.post('/privileges/get-privileges-role' ,(req, res, next) => {
    models.Privilege.findAll({
        include: {model: models.Role},
        where: {
            '$Roles.id$': req.body.id
        }
    })
    .then((findedPrivileges) => {
        res.send({findedPrivileges: findedPrivileges});
    }).catch(err => {
        console.log(err)
    })
});

router.post('/privileges/set-privileges-role' ,(req, res, next) => {
    let roles_privileges = []
    req.body.privileges.forEach((element) => {
        roles_privileges.push({idRole: req.body.role, idPrivilege: element})
    })
    models.roleprivilege.destroy({
        where: {
            idRole : req.body.role
        }
    })
    .then(() => {
        models.roleprivilege.bulkCreate(roles_privileges)
        .then((rolesPrivileges) => {
            res.send('ok')
        }).catch(err => {
            console.log(err)    
        })
    }).catch(err => {
        console.log(err)    
    })
});

router.get('/commerciaux' , async (req, res) => {
    let infos = undefined
    let vendeurs = undefined
    let agences = undefined

    try {
        const [reqVendeurs, reqAgences] = await Promise.all([
            models.User.findAll({
                include: [  
                    {model: models.Role, where: {typeDuRole : 'Commercial'}, include: models.Privilege},
                    {model: models.Structure}
                ],
                order: [
                    ['nom', 'asc']
                ]
            }),
            models.Structure.findAll({
                include : {
                    model : models.Type,
                    where : {
                        nom : 'Agence'
                    }
                }
            })
        ])
        if(reqVendeurs === null) throw "Une erreur est survenue lors de la récupération de la liste des commerciaux."
        if(reqAgences === null && req.session.client.Role === 'Admin') throw "Une erreur est survenue lors de la récupération de la liste d'agences."

        vendeurs = reqVendeurs
        agences = reqAgences

        if(vendeurs.length === 0 && agences.length === 0 && req.session.client.Role === 'Admin') {
            agences = undefined
            vendeurs = undefined
            infos = clientInformationObject(undefined, "Aucune agence ni vendeur disponible.")
        }
        else if(agences.length === 0 && req.session.client.Role === 'Admin') {
            agences = undefined
            infos = clientInformationObject(undefined, "Aucune agence disponible.")
        }
        else if(vendeurs.length === 0) {
            vendeurs = undefined
            infos = clientInformationObject(undefined, "Aucun vendeur disponible.")
        }        
    }
    catch(error) {
        vendeurs = undefined
        agences = undefined
        infos = clientInformationObject(error)
    }

    res.render('parametres/equipes_commerciaux', { extractStyles: true, title: 'Paramètres commerciaux | FUEGO', description:'Paramètres de création des équipes de commerciaux', session: req.session.client, options_top_bar: 'parametres', infos, vendeurs, agences });

    // models.User.findAll({
    //     include: [  
    //         {model: models.Role, where: {typeDuRole : 'Commercial'}, include: models.Privilege},
    //         {model: models.Structure}
    //     ],
    //     order: [
    //         ['nom', 'asc']
    //     ]
    // }).then(findedUsers => {
    //     console.log(JSON.stringify(req.session.client))
    //     res.render('parametres/equipes_commerciaux', { extractStyles: true, title: 'Paramètres commerciaux | FUEGO', description:'Paramètres de création des équipes de commerciaux', session: req.session.client, options_top_bar: 'parametres', findedUsers: findedUsers});
    // }).catch((err) => {
    //     console.log(err)
    // })    
});

router.post('/commerciaux/get-dependence' ,(req, res, next) => {
    models.User.findOne({
        include: {model: models.Usersdependence},
        where: {
            id: req.body.id
        }
    })
    .then((findedDependences) => {
        res.send({findedDependences: findedDependences});
    }).catch(err => {
        console.log(err)
    })
});

router.post('/commerciaux/set-dependence' ,(req, res, next) => {
    let roles_privileges = []

    // si undefined le commercial n'a personne sous lui
    if(req.body.privileges !== undefined) {
        req.body.privileges.forEach((element) => {
            roles_privileges.push({idUserSup: req.body.role, idUserInf: element})
        })
    }

    models.Usersdependence.destroy({
        where: {
            idUserSup : req.body.role
        }
    })
    .then(() => {
        models.Usersdependence.bulkCreate(roles_privileges)
        .then((findedDependences) => {
            res.send('ok')
        }).catch(err => {
            console.log(err)    
        })
    }).catch(err => {
        console.log(err)    
    })
});

router.get('/secteurs' ,(req, res, next) => {
    
    models.Secteur.findAll({
        include: {model : models.DepSecteur}
    }).then((findedSecteurs) => {
        res.render('parametres/zones_deps', { extractStyles: true, title: 'Secteurs| FUEGO', session: req.session.client, options_top_bar: 'parametres', findedSecteurs: findedSecteurs});
    })
});

router.post('/secteurs/update' ,(req, res, next) => {
    
    models.Secteur.findOne({
        where: {id : req.body.idSecteur }
    }).then((findedSecteur) => {
        findedSecteur.update(req.body)
        models.DepSecteur.destroy({
            where: {idSecteur : req.body.idSecteur }
        }).then((findedDep) => {
            req.body['deps[]'].forEach((element) => {
                models.DepSecteur.create({idSecteur: req.body.idSecteur, dep: element})
            })
        })
    })
});


router.post('/utilisateurs/get-client' ,(req, res, next) => {
    
    models.User.findOne({
        where: {
            id: req.body.id
        },
        include: [  
            {model: models.Role, include: models.Privilege},
            {model: models.Structure},
            {model: models.Usersdependence}
        ],
    }).then(findedUser => {
        models.Structure.findAll({
            include: [  
                {model: models.Type},
            ],
        }).then(findedStructures => {
            models.Role.findAll()
            .then(findedRoles => {
                let user
                if(!findedUser){
                    findedUser2 = models.User.build()
                    findedUser2.id = ""
                    findedUser2.nom = ""
                    findedUser2.prenom = ""
                    findedUser2.mail = ""
                    findedUser2.adresse = ""
                    findedUser2.dep = ""
                    findedUser2.birthday = ""
                    findedUser2.tel1 = ""
                    findedUser2.tel2 = ""
                    findedUser2.telcall = ""
                    findedUser2.billing = ""
                    findedUser2.objectif = ""
                    findedUser2.idRole = ""
                    findedUser2.Structures = []
                    findedUser2.dataValues.Structures = []
                    user = findedUser2
                }else{
                    user = findedUser
                }
                res.send({findedUser: user, findedStructures: findedStructures, findedRoles: findedRoles});
            })
        })
    })

});

router.post('/utilisateurs/set-client' ,(req, res, next) => {
    if(typeof req.body.id == 'undefined'){
        bcrypt.hash(req.body.password, 10, (err, hash) => {
        req.body.password = hash
        models.User.create(req.body).then(user2 => {
            models.UserStructure.destroy({
                where: {
                    idUser : user2.id
                }
            }).then((structure) => {
                req.body.UserStructures.forEach((element, index) => {
                    req.body.UserStructures[index].idUser = user2.id
                })
                models.UserStructure.bulkCreate(req.body.UserStructures)
                .then((structure) => {
                    models.User.findOne({
                        where: {
                            id: user2.id
                        },
                        include: [  
                            {model: models.Role, include: models.Privilege},
                            {model: models.Structure},
                            {model: models.Usersdependence}
                        ],
                    }).then(findedUser2 => {  
                        res.send({user: findedUser2})
                    })
                }).catch(err => {
                    console.log(err)    
                })
            }).catch(err => {
                console.log(err)    
            })
        })
    })
    }else{
        models.User.findOne({
            where: {
                id: req.body.id
            }
        }).then(findedUser => {
            findedUser.update(req.body).then(user2 => {
            models.UserStructure.destroy({
                where: {
                    idUser : user2.id
                }
            }).then((structure) => {
                models.UserStructure.bulkCreate(req.body.UserStructures)
                .then((structure) => {
                    models.User.findOne({
                        where: {
                            id: req.body.id
                        },
                        include: [  
                            {model: models.Role, include: models.Privilege},
                            {model: models.Structure},
                            {model: models.Usersdependence}
                        ],
                    }).then(findedUser2 => {  
                        res.send({user: findedUser2})
                    })
                }).catch(err => {
                    console.log(err)    
                })
            }).catch(err => {
                console.log(err)    
            })
            })
        })
    }
});

router.get('/password', async (req, res) => {
    const password = {
        text : '',
        hash : ''
    }

    const errorObject = {
        error : false,
        error_message : ''
    }

    try {
        password.text = Array(6)
            .fill("012345678901234567890123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz")
            .map(function(x) { 
                return x[Math.floor(Math.random() * x.length)] 
            })
            .join('')
        password.hash = await bcrypt.hash(password.text, 10)
    }
    catch(error) {
        console.error(error)
        errorObject.error = true
        errorObject.error_message = error
    }

    res.render('parametres/password', { extractStyles: true, title: 'MDP| FUEGO', session: req.session.client, options_top_bar: 'parametres', password, errorObject});
})



/****** gestion des zones géographiques et agences *******/
// vérifie que le département existe
function isCorrectDep(dep) {
    if(!isSet(dep)) return false

    const listeDeps = []
    for(let i = 1; i < 99; i++) {
        if(i < 10) {
            listeDeps.push(`0${i}`)
        }
        else {
            listeDeps.push(`${i}`)
        }
    }

    return listeDeps.includes(dep)
}

function depsStringToArray(deps) {
    // on récupère que les nombre séparés par des virgules
    deps = deps.replace(/[^0-9,]/g, '')

    // on vérifie que le dernier caractère soit bien un nombre et non pas une virgule ou autre
    if(deps[deps.length - 1] === ',') deps = deps.substr(0, deps.length - 1)

    return deps.split(',')
}

router
// page accueil de la gestion des zones et agences
.get('/gestion-zones', async (req, res) => {
    let infoObject = undefined
    let zones = undefined

    try {
        zones = await models.Zone.findAll({
            order : [['id', 'ASC']]
        })

        if(zones === null || zones.length === 0) {
            zones = undefined
            infoObject = clientInformationObject(undefined, "Aucune zone disponible.")
        }
    }
    catch(error) {
        zones = undefined
        infoObject = clientInformationObject(error)
    }

    res.render('parametres/gestion_zones', { extractStyles: true, title: 'Paramètres zones | FUEGO', session: req.session.client, options_top_bar: 'parametres', infoObject, zones});
})
// récupère une zone
.get('/gestion-zones/:idZone', async (req, res) => {
    let infoObject = undefined
    let zone = undefined

    const idZone = Number(req.params.idZone)

    try {
        if(isNaN(idZone)) throw "L'identifiant de la zone est incorrect."

        zone = await models.Zone.findOne({
            where : {
                id : idZone
            }
        })

        if(zone === null) throw "La zone à modifier est introuvable."

        // récupération des tous les départements utilisés dans les autres zones
        const depsZones = await models.Zone.findAll({
            attributes : ['deps'],
            where : {
                id : {
                    [Op.not] : idZone
                }
            }
        })

        // filtre pour récupérer de manière unique les départements
        let depsUsed = []

        if(depsZones !== null && depsZones.length > 0) {
            // récupération de tous les département séparément
            depsUsed = depsZones.map(zone => zone.deps).toString().split(',')
            // traitement pour garder les départements de manière unique
            depsUsed = depsUsed.reduce((accumulator, currentValue) => {
                if(!accumulator.includes(currentValue)) {
                    accumulator.push(currentValue)
                }

                return accumulator
            }, [])
        }

        // récupération des tous les départements utilisés de la zone
        const depsZone = await models.SousZone.findAll({
            attributes : ['deps'],
            where : {
                idZone
            }
        })

        // filtre pour récupérer de manière unique les départements
        let depsUsedZone = []

        if(depsZone !== null && depsZone.length > 0) {
            // récupération de tous les département séparément
            depsUsedZone = depsZone.map(zone => zone.deps).toString().split(',')
            // traitement pour garder les départements de manière unique
            depsUsedZone = depsUsedZone.reduce((accumulator, currentValue) => {
                if(!accumulator.includes(currentValue)) {
                    accumulator.push(currentValue)
                }

                return accumulator
            }, [])
        }

        zone = {
            id : zone.id,
            nom : zone.nom,
            deps : zone.deps,
            affichage_titre : zone.affichage_titre,
            depsUsed,
            depsUsedZone
        }
    }
    catch(error) {
        zone = undefined
        infoObject = clientInformationObject(error)
    }

    res.send({
        infoObject,
        zone
    })
})
// récupère l'ensemble des départements utilisés
.get('/gestion-zones/get/depsUsed', async (req, res) => {
    let infoObject = undefined
    let depsUsed = undefined

    try {
        // récupération des tous les départements par zone
        const depsZones = await models.Zone.findAll({
            attributes : ['deps'],
        })

        // filtre pour récupérer de manière unique les départements
        depsUsed = []

        if(depsZones !== null && depsZones.length > 0) {
            // récupération de tous les département séparément
            depsUsed = depsZones.map(zone => zone.deps).toString().split(',')
            // traitement pour garder les départements de manière unique
            depsUsed = depsUsed.reduce((accumulator, currentValue) => {
                if(!accumulator.includes(currentValue)) {
                    accumulator.push(currentValue)
                }

                return accumulator
            }, [])
        }
    }
    catch(error) {
        depsUsed = undefined
        infoObject = clientInformationObject(error)
    }

    res.send({
        infoObject,
        depsUsed
    })
})
// crée une nouvelle zone
.post('/gestion-zones', async (req, res) => {
    let zone = undefined
    let infoObject = undefined

    let nom = req.body.nom
    let deps = req.body.deps
    let affichage_titre = !!req.body.affichage_titre

    try {
        if(!isSet(nom)) throw "Un nom de zone doit être défini."
        if(!isSet(deps)) throw "Les départements couverts par la zone doivent être sélectionnés."

        nom = nom.trim()
        deps = deps.trim()

        // on récupère les départements séparément
        const arrayDeps = depsStringToArray(deps)

        // on vérifie que les départements sont corrects
        for(const dep of arrayDeps) {
            if(!isCorrectDep(dep)) throw "La liste de départements est incorrecte."
        }

        deps = arrayDeps.toString()

        zone = await models.Zone.create({
            nom,
            deps,
            affichage_titre
        })

        if(zone === null) throw "Une erreur est survenue lors de la création de la zone, veuillez recommencer plus tard."

        infoObject = clientInformationObject(undefined, "La zone a bien été créée.")
    }
    catch(error) {
        zone = undefined
        infoObject = clientInformationObject(error)
    }

    res.send({
        infoObject,
        zone
    })
})
// modifie une zone
.patch('/gestion-zones/:idZone', async (req, res) => {
    let zone = undefined
    let infoObject = undefined

    let idZone = Number(req.params.idZone)
    let nom = req.body.nom
    let deps = req.body.deps
    let affichage_titre = !!req.body.affichage_titre

    try {
        if(isNaN(idZone)) throw "L'identifiant de la zone est incorrect."

        zone = await models.Zone.findOne({
            where : {
                id : idZone
            }
        })

        if(zone === null) throw "La zone à modifier est introuvable."

        if(!isSet(nom)) throw "Un nom de zone doit être défini."
        if(!isSet(deps)) throw "Les départements couverts par la zone doivent être sélectionnés."

        nom = nom.trim()
        deps = deps.trim()

        // on récupère les départements séparément
        const arrayDeps = depsStringToArray(deps)

        // on vérifie que les départements sont corrects
        for(const dep of arrayDeps) {
            if(!isCorrectDep(dep)) throw "La liste de départements est incorrecte."
        }

        deps = arrayDeps.toString()

        zone.nom = nom
        zone.deps = deps
        zone.affichage_titre = affichage_titre
        await zone.save()

        infoObject = clientInformationObject(undefined, "La zone a bien été mise à jour.")
    }
    catch(error) {
        zone = undefined
        infoObject = clientInformationObject(error)
    }

    res.send({
        infoObject,
        zone
    })
})
// supprime une zone
.delete('/gestion-zones/:idZone', async (req, res) => {
    let infoObject = undefined

    let idZone = Number(req.params.idZone)

    try {
        if(isNaN(idZone)) throw "L'identifiant de la zone est incorrect."

        const zone = await models.Zone.findOne({
            where : {
                id : idZone
            }
        })

        if(zone === null) throw "La zone à supprimer est introuvable."

        // supprime la zone et ses dépendances
        const listeSousZones = await models.SousZone.findAll({
            attributes : ['id'],
            where : {
                idZone
            }
        })
        const listeIdSousZones = listeSousZones.map(sousZone => sousZone.id)
        if(listeIdSousZones.length === 0) listeIdSousZones.push('')

        const listeAgences = await models.Agence.findAll({
            attributes : ['id'],
            where : {
                idSousZone : {
                    [Op.in] : listeIdSousZones
                }
            }
        })
        const listeIdAgences = listeAgences.map(agence => agence.id)
        if(listeIdAgences.length === 0) listeIdAgences.push('')

        await Promise.all([
            models.AppartenanceAgence.destroy({
                where : {
                    idAgence : {
                        [Op.in] : listeIdAgences
                    }
                }
            }),
            models.Agence.destroy({
                where : {
                    id : {
                        [Op.in] : listeIdAgences
                    }
                }
            }),
            models.SousZone.destroy({
                where : {
                    id : {
                        [Op.in] : listeIdSousZones
                    }
                }
            }),
            models.Zone.destroy({
                where : {
                    id : idZone
                }
            })
        ])

        infoObject = clientInformationObject(undefined, "La zone a bien été supprimée.")
    }
    catch(error) {
        infoObject = clientInformationObject(error)
    }

    res.send({
        infoObject
    })
})
// récupère les sous-zones d'une zonne donnée
.get('/gestion-zones/:idZone/sous-zones', async (req, res) => {
    let listeSousZones = undefined
    let infoObject = undefined

    const idZone = Number(req.params.idZone)

    try {
        if(isNaN(idZone)) throw "L'identifiant de la zone est incorrect."

        const zone = await models.Zone.findOne({
            where : {
                id : idZone
            }
        })

        if(zone === null) throw "La zone est introuvable."

        listeSousZones = await models.SousZone.findAll({
            where : {
                idZone
            },
            order : [['id', 'ASC']]
        })

        if(listeSousZones === null || listeSousZones.length === 0) {
            infoObject = clientInformationObject(undefined, "Aucune sous-zone disponible.")
            listeSousZones = undefined
        }
    }
    catch(error) {
        listeSousZones = undefined
        infoObject = clientInformationObject(error)
    }

    res.send({
        infoObject,
        listeSousZones
    })
}) 
// récupère une sous-zone
.get('/gestion-zones/:idZone/sous-zones/:idSousZone', async (req, res) => {
    let infoObject = undefined
    let sousZone = undefined

    const idZone = Number(req.params.idZone)
    const idSousZone = Number(req.params.idSousZone)

    try {
        if(isNaN(idZone)) throw "L'identifiant de la zone est incorrect."

        const zone = await models.Zone.findOne({
            where : {
                id : idZone
            }
        })

        if(zone === null) throw "La zone est introuvable."

        if(isNaN(idSousZone)) throw "L'identifiant de la sous-zone est incorrect."

        sousZone = await models.SousZone.findOne({
            where : {
                id : idSousZone
            }
        })

        if(sousZone === null) throw "La sous-zone est introuvable."
        if(sousZone.idZone !== idZone) throw "La sous-zone ne correspond pas à la zone sélectionnée."

        // récupération des tous les départements utilisés de la sous-zone
        const depsZones = await models.SousZone.findAll({
            attributes : ['deps'],
            where : {
                id : {
                    [Op.not] : idSousZone
                },
                idZone
            }
        })

        // filtre pour récupérer de manière unique les départements
        let depsUsed = []

        if(depsZones !== null && depsZones.length > 0) {
            // récupération de tous les département séparément
            depsUsed = depsZones.map(zone => zone.deps).toString().split(',')
            // traitement pour garder les départements de manière unique
            depsUsed = depsUsed.reduce((accumulator, currentValue) => {
                if(!accumulator.includes(currentValue)) {
                    accumulator.push(currentValue)
                }

                return accumulator
            }, [])
        }

        // récupération des tous les départements utilisés de la zone
        const depsSousZone = await models.Agence.findAll({
            attributes : ['deps'],
            where : {
                idSousZone
            }
        })

        // filtre pour récupérer de manière unique les départements
        let depsUsedSousZone = []

        if(depsSousZone !== null && depsSousZone.length > 0) {
            // récupération de tous les département séparément
            depsUsedSousZone = depsSousZone.map(zone => zone.deps).toString().split(',')
            // traitement pour garder les départements de manière unique
            depsUsedSousZone = depsUsedSousZone.reduce((accumulator, currentValue) => {
                if(!accumulator.includes(currentValue)) {
                    accumulator.push(currentValue)
                }

                return accumulator
            }, [])
        }
        
        sousZone = {
            id : sousZone.id,
            nom : sousZone.nom,
            deps : sousZone.deps,
            affichage_titre : sousZone.affichage_titre,
            depsUsed,
            depsSup : zone.deps,
            depsUsedSousZone
        }
    }
    catch(error) {
        sousZone = undefined
        infoObject = clientInformationObject(error)
    }

    res.send({
        infoObject,
        sousZone
    })
}) 
// crée une sous-zone
.post('/gestion-zones/:idZone/sous-zones', async (req, res) => {
    let infoObject = undefined
    let sousZone = undefined

    const idZone = Number(req.params.idZone)
    let nom = req.body.nom
    let deps = req.body.deps
    let affichage_titre = !!req.body.affichage_titre

    try {
        if(isNaN(idZone)) throw "L'identifiant de la zone est incorrect."

        const zone = await models.Zone.findOne({
            where : {
                id : idZone
            }
        })

        if(zone === null) throw "La zone est introuvable."

        if(!isSet(nom)) throw "Un nom de sous-zone doit être défini."
        if(!isSet(deps)) throw "Les départements couverts par la sous-zone doivent être sélectionnés."

        nom = nom.trim()
        deps = deps.trim()

        // on récupère les départements séparément
        const arrayDepsSousZone = depsStringToArray(deps)

        // on vérifie que les départements sont corrects
        for(const dep of arrayDepsSousZone) {
            if(!isCorrectDep(dep)) throw "La liste de départements est incorrecte."
        }

        // on récupère les départements de la zone séparément
        const arrayDepsZone = depsStringToArray(zone.deps)

        // on vérifie que les départements de la sous-zone sont présents dans ceux de la zone
        if(arrayDepsSousZone.length > arrayDepsZone.length || !arrayDepsSousZone.every(dep => arrayDepsZone.includes(dep))) throw "Les départements de la sous-zone doivent appartenir à la liste de départements de la zone."

        deps = arrayDepsSousZone.toString()

        sousZone = await models.SousZone.create({
            idZone,
            nom,
            deps,
            affichage_titre
        })

        if(sousZone === null) throw "Une erreur est survenue lors de la création de la sous-zone, veuillez recommencer plus tard."

        infoObject = clientInformationObject(undefined, "La sous-zone a bien été créée.")
    }
    catch(error) {
        sousZone = undefined
        infoObject = clientInformationObject(error)
    }

    res.send({
        infoObject,
        sousZone
    })
}) 
// modifie une sous-zone
.patch('/gestion-zones/:idZone/sous-zones/:idSousZone', async (req, res) => {
    let infoObject = undefined
    let sousZone = undefined

    const idZone = Number(req.params.idZone)
    const idSousZone = Number(req.params.idSousZone)
    let nom = req.body.nom
    let deps = req.body.deps
    let affichage_titre = !!req.body.affichage_titre

    try {
        if(isNaN(idZone)) throw "L'identifiant de la zone est incorrect."

        const zone = await models.Zone.findOne({
            where : {
                id : idZone
            }
        })

        if(zone === null) throw "La zone est introuvable."

        if(isNaN(idSousZone)) throw "L'identifiant de la sous-zone est incorrect."

        sousZone = await models.SousZone.findOne({
            where : {
                id : idSousZone
            }
        })

        if(sousZone === null) throw "La sous-zone est introuvable."
        if(sousZone.idZone !== idZone) throw "La sous-zone ne correspond pas à la zone sélectionnée."

        if(!isSet(nom)) throw "Un nom de sous-zone doit être défini."
        if(!isSet(deps)) throw "Les départements couverts par la sous-zone doivent être sélectionnés."

        nom = nom.trim()
        deps = deps.trim()

        // on récupère les départements séparément
        const arrayDepsSousZone = depsStringToArray(deps)

        // on vérifie que les départements sont corrects
        for(const dep of arrayDepsSousZone) {
            if(!isCorrectDep(dep)) throw "La liste de départements est incorrecte."
        }

        // on récupère les départements de la zone séparément
        const arrayDepsZone = depsStringToArray(zone.deps)

        // on vérifie que les départements de la sous-zone sont présents dans ceux de la zone
        if(arrayDepsSousZone.length > arrayDepsZone.length || !arrayDepsSousZone.every(dep => arrayDepsZone.includes(dep))) throw "Les départements de la sous-zone doivent appartenir à la liste de départements de la zone."

        deps = arrayDepsSousZone.toString()

        sousZone.nom = nom
        sousZone.deps = deps
        sousZone.affichage_titre = affichage_titre
        await sousZone.save()

        infoObject = clientInformationObject(undefined, "La sous-zone a bien été mise à jour.")
    }
    catch(error) {
        sousZone = undefined
        infoObject = clientInformationObject(error)
    }

    res.send({
        infoObject,
        sousZone
    })
}) 
// supprime une sous-zone
.delete('/gestion-zones/:idZone/sous-zones/:idSousZone', async (req, res) => {
    let infoObject = undefined

    const idZone = Number(req.params.idZone)
    const idSousZone = Number(req.params.idSousZone)

    try {
        if(isNaN(idZone)) throw "L'identifiant de la zone est incorrect."

        const zone = await models.Zone.findOne({
            where : {
                id : idZone
            }
        })

        if(zone === null) throw "La zone est introuvable."

        if(isNaN(idSousZone)) throw "L'identifiant de la sous-zone est incorrect."

        const sousZone = await models.SousZone.findOne({
            where : {
                id : idSousZone
            }
        })

        if(sousZone === null) throw "La sous-zone est introuvable."
        if(sousZone.idZone !== idZone) throw "La sous-zone ne correspond pas à la zone sélectionnée."

        // supprime la sous-zone et ses dépendances
        const listeAgences = await models.sequelize.query(`SELECT id FROM Agences WHERE idSousZone = ${idSousZone}`, { type : models.sequelize.QueryTypes.SELECT })
        const listeIdAgences = listeAgences.map(agence => agence.id)
        if(listeIdAgences.length === 0) listeIdAgences.push('')

        await Promise.all([
            models.AppartenanceAgence.destroy({
                where : {
                    idAgence : {
                        [Op.in] : listeIdAgences
                    }
                }
            }),
            models.Agence.destroy({
                where : {
                    id : {
                        [Op.in] : listeIdAgences
                    }
                }
            }),
            sousZone.destroy()
        ])

        infoObject = clientInformationObject(undefined, "La sous-zone a bien été supprimée.")
    }
    catch(error) {
        infoObject = clientInformationObject(error)
    }

    res.send({
        infoObject
    })
}) 
// récupères les agences d'une sous-zone donnée
.get('/gestion-zones/sous-zones/:idSousZone/agences', async (req, res) => {
    let infoObject = undefined
    let listeAgences = undefined

    const idSousZone = Number(req.params.idSousZone)

    try {
        if(isNaN(idSousZone)) throw "L'identifiant de la sous-zone est incorrect."

        const sousZone = await models.SousZone.findOne({
            where : {
                id : idSousZone
            }
        })

        if(sousZone === null) throw "La sous-zone est introuvable."

        listeAgences = await models.Agence.findAll({
            where : {
                idSousZone
            },
            order : [['id', 'ASC']]
        })

        if(listeAgences === null || listeAgences.length === 0) {
            listeAgences = undefined
            infoObject = clientInformationObject(undefined, "Aucune agence disponible.")
        }
    }
    catch(error) {
        listeAgences = undefined
        infoObject = clientInformationObject(error)
    }

    res.send({
        infoObject,
        listeAgences
    })
})
// récupère une agence
.get('/gestion-zones/sous-zones/:idSousZone/agences/:idAgence', async (req, res) => {
    let infoObject = undefined
    let agence = undefined

    const idSousZone = Number(req.params.idSousZone)
    const idAgence = Number(req.params.idAgence)

    try {
        if(isNaN(idSousZone)) throw "L'identifiant de la sous-zone est incorrect."

        const sousZone = await models.SousZone.findOne({
            where : {
                id : idSousZone
            }
        })

        if(sousZone === null) throw "La sous-zone est introuvable."

        if(isNaN(idAgence)) throw "L'identifiant de l'agence est incorrect."

        agence = await models.Agence.findOne({
            where : {
                id : idAgence
            }
        })

        if(agence === null) throw "L'agence est introuvable"
        if(agence.idSousZone !== idSousZone) throw "L'agence ne correspond pas à la sous-zone sélectionnée."
    
        // récupération de tous les départements utilisés de la sous-zone
        const depsZones = await models.Agence.findAll({
            attributes : ['deps'],
            where : {
                id : {
                    [Op.not] : idAgence
                },
                idSousZone
            }
        })

        // filtre pour récupérer de manière unique les départements
        let depsUsed = []

        if(depsZones !== null && depsZones.length > 0) {
            // récupération de tous les département séparément
            depsUsed = depsZones.map(zone => zone.deps).toString().split(',')
            // traitement pour garder les départements de manière unique
            depsUsed = depsUsed.reduce((accumulator, currentValue) => {
                if(!accumulator.includes(currentValue)) {
                    accumulator.push(currentValue)
                }

                return accumulator
            }, [])
        }

        agence = {
            id : agence.id,
            nom : agence.nom,
            deps : agence.deps,
            affichage_titre : agence.affichage_titre,
            depsUsed,
            depsSup : sousZone.deps
        }
    }
    catch(error) {
        agence = undefined
        infoObject = clientInformationObject(error)
    }

    res.send({
        infoObject,
        agence
    })
})
// crée une agence
.post('/gestion-zones/sous-zones/:idSousZone/agences', async (req, res) => {
    let infoObject = undefined
    let agence = undefined

    const idSousZone = Number(req.params.idSousZone)
    let nom = req.body.nom
    let deps = req.body.deps
    let affichage_titre = !!req.body.affichage_titre

    try {
        if(isNaN(idSousZone)) throw "L'identifiant de la sous-zone est incorrect."

        const sousZone = await models.SousZone.findOne({
            where : {
                id : idSousZone
            }
        })

        if(sousZone === null) throw "La sous-zone est introuvable."

        if(!isSet(nom)) throw "Un nom d'agence doit être défini."
        if(!isSet(deps)) throw "Les départements couverts par l'agence doivent être sélectionnés."

        nom = nom.trim()
        deps = deps.trim()

        // on récupère les départements séparément
        const arrayDepsAgence = depsStringToArray(deps)

        // on vérifie que les départements sont corrects
        for(const dep of arrayDepsAgence) {
            if(!isCorrectDep(dep)) throw "La liste de départements est incorrecte."
        }

        // on récupère les départements de la sous-zone séparément
        const arrayDepsSousZone = depsStringToArray(sousZone.deps)

        // on vérifie que les départements de la sous-zone sont présents dans ceux de la zone
        if(arrayDepsAgence.length > arrayDepsSousZone.length || !arrayDepsAgence.every(dep => arrayDepsSousZone.includes(dep))) throw "Les départements de l'agence doivent appartenir à la liste de départements de la sous-zone."

        deps = arrayDepsAgence.toString()

        agence = await models.Agence.create({
            idSousZone,
            nom,
            deps,
            affichage_titre
        })

        if(agence === null) throw "Une erreur est survenue lors de la création de l'agence, veuillez recommencer plus tard."

        infoObject = clientInformationObject(undefined, "L'agence a bien été créée.")
    }
    catch(error) {
        agence = undefined
        infoObject = clientInformationObject(error)
    }

    res.send({
        infoObject,
        agence
    })
})
// modifie une agence
.patch('/gestion-zones/sous-zones/:idSousZone/agences/:idAgence', async (req, res) => {
    let infoObject = undefined
    let agence = undefined

    const idSousZone = Number(req.params.idSousZone)
    const idAgence = Number(req.params.idAgence)
    let nom = req.body.nom
    let deps = req.body.deps
    let affichage_titre = !!req.body.affichage_titre

    try {
        if(isNaN(idSousZone)) throw "L'identifiant de la sous-zone est incorrect."

        const sousZone = await models.SousZone.findOne({
            where : {
                id : idSousZone
            }
        })

        if(sousZone === null) throw "La sous-zone est introuvable."

        if(isNaN(idAgence)) throw "L'identifiant de l'agence est incorrect."

        agence = await models.Agence.findOne({
            where : {
                id : idAgence
            }
        })

        if(agence === null) throw "L'agence est introuvable"
        if(agence.idSousZone !== idSousZone) throw "L'agence ne correspond pas à la sous-zone sélectionnée."
    
        if(!isSet(nom)) throw "Un nom d'agence doit être défini."
        if(!isSet(deps)) throw "Les départements couverts par l'agence doivent être sélectionnés."

        nom = nom.trim()
        deps = deps.trim()

        // on récupère les départements séparément
        const arrayDepsAgence = depsStringToArray(deps)

        // on vérifie que les départements sont corrects
        for(const dep of arrayDepsAgence) {
            if(!isCorrectDep(dep)) throw "La liste de départements est incorrecte."
        }

        // on récupère les départements de la sous-zone séparément
        const arrayDepsSousZone = depsStringToArray(sousZone.deps)

        // on vérifie que les départements de la sous-zone sont présents dans ceux de la zone
        if(arrayDepsAgence.length > arrayDepsSousZone.length || !arrayDepsAgence.every(dep => arrayDepsSousZone.includes(dep))) throw "Les départements de l'agence doivent appartenir à la liste de départements de la sous-zone."

        deps = arrayDepsAgence.toString()

        agence.nom = nom
        agence.deps = deps
        agence.affichage_titre = affichage_titre
        await agence.save()

        infoObject = clientInformationObject(undefined, "L'agence a bien été mise à jour.")
    }
    catch(error) {
        agence = undefined
        infoObject = clientInformationObject(error)
    }

    res.send({
        infoObject,
        agence
    })
})
// supprime une agence
.delete('/gestion-zones/sous-zones/:idSousZone/agences/:idAgence', async (req, res) => {
    let infoObject = undefined

    const idSousZone = Number(req.params.idSousZone)
    const idAgence = Number(req.params.idAgence)

    try {
        if(isNaN(idSousZone)) throw "L'identifiant de la sous-zone est incorrect."

        const sousZone = await models.SousZone.findOne({
            where : {
                id : idSousZone
            }
        })

        if(sousZone === null) throw "La sous-zone est introuvable."

        if(isNaN(idAgence)) throw "L'identifiant de l'agence est incorrect."

        const agence = await models.Agence.findOne({
            where : {
                id : idAgence
            }
        })

        if(agence === null) throw "L'agence est introuvable"
        if(agence.idSousZone !== idSousZone) throw "L'agence ne correspond pas à la sous-zone sélectionnée."

        // supprime l'agence et ses dépendances
        await Promise.all([
            models.AppartenanceAgence.destroy({
                where : {
                    idAgence
                }
            }),
            agence.destroy()
        ])

        infoObject = clientInformationObject(undefined, "L'agence a bien été supprimée.")
    }
    catch(error) {
        infoObject = clientInformationObject(error)
    }

    res.send({
        infoObject
    })
})
// récupère les vendeurs non rattachés à une agence
.get('/gestion-zones/get/vendeurs', async (req, res) => {
    let infoObject = undefined
    let listeVendeurs = undefined

    try {
        let listeIdVendeursIndisponibles = await models.AppartenanceAgence.findAll({})

        if(listeIdVendeursIndisponibles === null || listeIdVendeursIndisponibles.length === 0) {
            listeIdVendeursIndisponibles = []
        }

        // récupère uniquement la liste des id vendeurs
        listeIdVendeursIndisponibles = listeIdVendeursIndisponibles.map(appartenanceAgence => appartenanceAgence.idVendeur)

        listeVendeurs = await models.User.findAll({
            where : {
                id : {
                    [Op.notIn] : listeIdVendeursIndisponibles
                }
            },
            include : [
                { model: models.Role, where: { typeDuRole : 'Commercial' } }
            ],
            order : [
                ['nom', 'ASC'],
                ['prenom', 'ASC']
            ]
        })

        if(listeVendeurs === null || listeVendeurs.length === 0) {
            infoObject = clientInformationObject(undefined, "Tous les vendeurs sont déjà affectés.")
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
// récupère les vendeurs appartenants à cette agence
.get('/gestion-zones/sous-zones/agences/:idAgence/vendeurs', async (req, res) => {
    let infoObject = undefined
    let listeVendeurs = undefined

    const idAgence = Number(req.params.idAgence)

    try {
        if(isNaN(idAgence)) throw "L'identifiant de l'agence est incorrect."

        const agence = await models.Agence.findOne({
            where : {
                id : idAgence
            }
        })

        if(agence === null) throw "L'agence est introuvable"

        listeVendeurs = await models.AppartenanceAgence.findAll({
            where : {
                idAgence
            },
            include : [
                { model : models.User }
            ],
            order : [['id', 'ASC']]
        })

        if(listeVendeurs === null || listeVendeurs.length === 0) {
            listeVendeurs = undefined
            infoObject = clientInformationObject(undefined, "Aucun vendeur disponible.")
        }
        else {
            listeVendeurs = listeVendeurs.map(appartenence => {
                return {
                    id : appartenence.User.id,
                    nom : appartenence.User.nom,
                    prenom : appartenence.User.prenom,
                    dep : appartenence.User.dep,
                    deps : appartenence.deps
                }
            })
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
// ajoute un vendeur à cette agence
.post('/gestion-zones/sous-zones/agences/:idAgence/vendeurs', async (req, res) => {
    let infoObject = undefined

    const idAgence = Number(req.params.idAgence)
    const idVendeur = Number(req.body.idVendeur)
    let deps = req.body.deps
    let depPrincipal = req.body.depPrincipal

    try {
        if(isNaN(idAgence)) throw "L'identifiant de l'agence est incorrect."

        const agence = await models.Agence.findOne({
            where : {
                id : idAgence
            }
        })

        if(agence === null) throw "L'agence est introuvable"

        if(isNaN(idVendeur)) throw "L'identifiant du vendeur est incorrect."

        const vendeur = await models.User.findOne({
            where : {
                id : idVendeur
            },
            include : [
                { model: models.Role, where: { typeDuRole : 'Commercial' } }
            ]
        })

        if(vendeur === null) throw "Le vendeur sélectionné est introuvable."

        if(!isSet(deps)) throw "Les départements couverts par l'agence doivent être sélectionnés."

        depPrincipal = depPrincipal.trim()
        deps = deps.trim()

        // on récupère les départements séparément
        const arrayDepPrincipalvendeur = depsStringToArray(depPrincipal)
        const arrayDepsVendeur = depsStringToArray(deps)

        // on vérifie qu'il n'y a bien qu'un département principal
        if(arrayDepPrincipalvendeur.length < 1) throw "Un département principal doit être choisi opour le vendeur."
        if(arrayDepPrincipalvendeur.length > 1) throw "Un seul département principal doit être choisi opour le vendeur."

        // on vérifie que les départements sont corrects
        if(!isCorrectDep(arrayDepPrincipalvendeur[0])) throw "Le département principal est incorrect."
        for(const dep of arrayDepsVendeur) {
            if(!isCorrectDep(dep)) throw "La liste de départements est incorrecte."
        }

        // on récupère les départements de l'agence séparément
        const arrayDepsAgence = depsStringToArray(agence.deps)

        // on vérifie que les départements du vendeur sont présents dans ceux de l'agence
        if(arrayDepsVendeur.length > arrayDepsAgence.length || !arrayDepsVendeur.every(dep => arrayDepsAgence.includes(dep))) throw "Les départements du vendeur doivent appartenir à la liste de départements de l'agence."
        // on vérifie que le département principal est présent dans ceux du vendeur
        if(!arrayDepsVendeur.includes(arrayDepPrincipalvendeur[0])) throw "Le département principal du vendeur doit appartenir à la liste des départements de celui-ci."

        depPrincipal = arrayDepPrincipalvendeur.toString()
        deps = arrayDepsVendeur.toString()

        await models.AppartenanceAgence.destroy({
            where : {
                idVendeur
            }
        })

        vendeur.dep = depPrincipal
        await vendeur.save()

        await models.AppartenanceAgence.create({
            idVendeur,
            idAgence,
            deps
        })

        infoObject = clientInformationObject(undefined, "Le vendeur a bien été ajouté à l'agence.")
    }
    catch(error) {
        infoObject = clientInformationObject(error)
    }

    res.send({
        infoObject
    })
})
// modifie un vendeur de cette agence
.patch('/gestion-zones/sous-zones/agences/:idAgence/vendeurs/:idVendeur', async (req, res) => {
    let infoObject = undefined

    const idAgence = Number(req.params.idAgence)
    const idVendeur = Number(req.params.idVendeur)
    let depPrincipal = req.body.depPrincipal
    let deps = req.body.deps

    try {
        if(isNaN(idAgence)) throw "L'identifiant de l'agence est incorrect."

        const agence = await models.Agence.findOne({
            where : {
                id : idAgence
            }
        })

        if(agence === null) throw "L'agence est introuvable"

        if(isNaN(idVendeur)) throw "L'identifiant du vendeur est incorrect."

        const vendeur = await models.User.findOne({
            where : {
                id : idVendeur
            },
            include : [
                { model: models.Role, where: { typeDuRole : 'Commercial' } }
            ]
        })

        if(vendeur === null) throw "Le vendeur sélectionné est introuvable."

        if(!isSet(deps)) throw "Les départements couverts par l'agence doivent être sélectionnés."

        depPrincipal = depPrincipal.trim()
        deps = deps.trim()

        // on récupère les départements séparément
        const arrayDepPrincipalvendeur = depsStringToArray(depPrincipal)
        const arrayDepsVendeur = depsStringToArray(deps)

        // on vérifie qu'il n'y a bien qu'un département principal
        if(arrayDepPrincipalvendeur.length < 1) throw "Un département principal doit être choisi opour le vendeur."
        if(arrayDepPrincipalvendeur.length > 1) throw "Un seul département principal doit être choisi opour le vendeur."

        // on vérifie que les départements sont corrects
        if(!isCorrectDep(arrayDepPrincipalvendeur[0])) throw "Le département principal est incorrect."
        for(const dep of arrayDepsVendeur) {
            if(!isCorrectDep(dep)) throw "La liste de départements est incorrecte."
        }

        // on récupère les départements de l'agence séparément
        const arrayDepsAgence = depsStringToArray(agence.deps)

        // on vérifie que les départements du vendeur sont présents dans ceux de l'agence
        if(arrayDepsVendeur.length > arrayDepsAgence.length || !arrayDepsVendeur.every(dep => arrayDepsAgence.includes(dep))) throw "Les départements du vendeur doivent appartenir à la liste de départements de l'agence."
        // on vérifie que le département principal est présent dans ceux du vendeur
        if(!arrayDepsVendeur.includes(arrayDepPrincipalvendeur[0])) throw "Le département principal du vendeur doit appartenir à la liste des départements de celui-ci."

        depPrincipal = arrayDepPrincipalvendeur.toString()
        deps = arrayDepsVendeur.toString()

        const appartenanceAgence = await models.AppartenanceAgence.findOne({
            where : {
                idVendeur,
                idAgence
            }
        })

        if(appartenanceAgence === null) throw "Le vendeur ne fait pas partie de cette agence."

        vendeur.dep = depPrincipal
        await vendeur.save()

        appartenanceAgence.deps = deps
        await appartenanceAgence.save()

        infoObject = clientInformationObject(undefined, "Les départements du vendeur ont bien été mis à jour.")
    }
    catch(error) {
        infoObject = clientInformationObject(error)
    }

    res.send({
        infoObject
    })
})
// retire un vendeur de cette agence
.delete('/gestion-zones/sous-zones/agences/:idAgence/vendeurs/:idVendeur', async (req, res) => {
    let infoObject = undefined

    const idAgence = Number(req.params.idAgence)
    const idVendeur = Number(req.params.idVendeur)

    try {
        if(isNaN(idAgence)) throw "L'identifiant de l'agence est incorrect."

        const agence = await models.Agence.findOne({
            where : {
                id : idAgence
            }
        })

        if(agence === null) throw "L'agence est introuvable"

        if(isNaN(idVendeur)) throw "L'identifiant du vendeur est incorrect."

        const vendeur = await models.User.findOne({
            where : {
                id : idVendeur
            },
            include : [
                { model: models.Role, where: { typeDuRole : 'Commercial' } }
            ]
        })

        if(vendeur === null) throw "Le vendeur sélectionné est introuvable."

        const appartenanceAgence = await models.AppartenanceAgence.findOne({
            where : {
                idVendeur,
                idAgence
            }
        })

        if(appartenanceAgence === null) throw "Le vendeur ne fait pas partie de cette agence."

        await appartenanceAgence.destroy()

        infoObject = clientInformationObject(undefined, "Le vendeur a bien été retiré de l'agence.")
    }
    catch(error) {
        infoObject = clientInformationObject(error)
    }

    res.send({
        infoObject
    })
})

module.exports = router;