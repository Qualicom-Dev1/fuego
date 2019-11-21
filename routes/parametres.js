const express = require('express');
const router = express.Router();
const models = require("../models/index")
const sequelize = require("sequelize")
const bcrypt = require('bcrypt')
const Op = sequelize.Op

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
router.get('/' ,(req, res, next) => {
    res.render('parametres/equipes_commerciaux', { extractStyles: true, title: 'Paramètres commerciaux | FUEGO', session: req.session.client, options_top_bar: 'parametres'});
});

router.get('/telemarketing' ,(req, res, next) => {
    res.render('parametres/equipes_telemarketing', { extractStyles: true, title: 'Télémarketing | FUEGO', session: req.session.client, options_top_bar: 'parametres'});
});

router.get('/attributions' ,(req, res, next) => {
    res.render('parametres/attributions', { extractStyles: true, title: 'attributions | FUEGO', session: req.session.client, options_top_bar: 'parametres'});
});

router.get('/secteurs_structures' ,(req, res, next) => {
    res.render('parametres/secteurs_structures', { extractStyles: true, title: 'attributions | FUEGO', session: req.session.client, options_top_bar: 'parametres'});
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
        include: {model: models.Role}
    }).then((findedUsers) => {
        res.render('parametres/utilisateurs', { extractStyles: true, title: 'Utilisateurs | FUEGO', session: req.session.client, options_top_bar: 'parametres', findedUsers : findedUsers});
    })
});

router.get('/privileges' ,(req, res, next) => {
    models.Privilege.findAll()
    .then((findedPrivileges) => {
        models.sequelize.query('SELECT Roles.id, Roles.nom, count(Users.id) as count FROM Roles LEFT JOIN Users ON Roles.id=Users.idRole GROUP BY Roles.id, Roles.nom', { type: models.sequelize.QueryTypes.SELECT })
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
    req.body['privileges[]'].forEach((element) => {
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
    req.body['privileges[]'].forEach((element) => {
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
                res.send({findedUser: findedUser, findedStructures: findedStructures, findedRoles: findedRoles});
            })
        })
    })

});

router.post('/utilisateurs/set-client' ,(req, res, next) => {
    console.log(req.body)
    models.User.findOne({
        where: {
            id: req.body.id
        }
    }).then(findedUser => {
        if(findedUser) findedUser.update(req.body).then(user2 => {
        models.UserStructure.findOne({
            where: {
                idUser : user2.id
            }
        }).then((structure) => {
            structure.update({idUser: req.body.id, idStructure: req.body.idStructure})
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
                }).then(findedUser => {  
                    res.send({user: findedUser})
                })
            }).catch(err => {
                console.log(err)    
            })
        }).catch(err => {
            console.log(err)    
        })
        })
    })

});

module.exports = router;