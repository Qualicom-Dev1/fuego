const express = require('express');
const router = express.Router();
const models = require("../models/index")
const sequelize = require("sequelize")
const bcrypt = require('bcrypt')
const Op = sequelize.Op

const _ = require('lodash')

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
                (SELECT users.id, users.nom, users.prenom FROM users
                    inner join roles on users.idRole = roles.id
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
        console.log(findedDependences)
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
        console.log(findedDependences)
        res.send({findedDependences: findedDependences});
    }).catch(err => {
        console.log(err)
    })
});

router.post('/attributions/set-dependence' ,(req, res, next) => {
    let roles_privileges = []
    console.log(req.body)
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

router.get('/mon_compte' ,(req, res, next) => {
    res.render('parametres/mon_compte', { extractStyles: true, title: 'Mon compte | FUEGO', session: req.session.client, options_top_bar: 'parametres'});
});

router.post('/mon_compte/update' ,(req, res, next) => {
    models.User.findOne({
        where : {
            id: req.session.client.id
        }
    }).then(findedUser => {
        findedUser.update(req.body).then(() => {
            models.User.findOne({
                where: {
                    id: req.session.client.id
                }, 
                include: [  
                    {model: models.Role, include: models.Privilege},
                    {model: models.Structure},
                    {model: models.Usersdependence}
                ],
            }).then(findedUser2 => {
                req.session.client = findedUser2
                res.send('ok')
            }).catch(function (e) {
                req.flash('error', e);
            });
        }).catch(function (e) {
            req.flash('error', e);
        });
    })
});

router.post('/mon_compte/update/password' ,(req, res, next) => {

    bcrypt.hash(req.body.password, 10, function(err, hash) {
        models.User.findOne({
            where : {
                id: req.session.client.id
            }
        }).then(findedUser => {
            findedUser.update({password: hash})
            res.send('ok')
        })
    });

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
        console.log(findedPrivileges)
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
    console.log(roles_privileges)
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

router.get('/commerciaux' ,(req, res, next) => {
    models.User.findAll({
        include: [  
            {model: models.Role, where: {typeDuRole : 'Commercial'}, include: models.Privilege},
            {model: models.Structure}
        ],
        order: [
            ['nom', 'asc']
        ]
    }).then(findedUsers => {
        res.render('parametres/equipes_commerciaux', { extractStyles: true, title: 'Paramètres commerciaux | FUEGO', description:'Paramètres de création des équipes de commerciaux', session: req.session.client, options_top_bar: 'parametres', findedUsers: findedUsers});
    }).catch((err) => {
        console.log(err)
    })    
});

router.post('/commerciaux/get-dependence' ,(req, res, next) => {
    models.User.findOne({
        include: {model: models.Usersdependence},
        where: {
            id: req.body.id
        }
    })
    .then((findedDependences) => {
        console.log(findedDependences)
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
            console.log(req.body['deps[]'])
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

module.exports = router;