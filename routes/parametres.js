const express = require('express');
const router = express.Router();
const models = require("../models/index")
const sequelize = require("sequelize")
const bcrypt = require('bcrypt')
const Op = sequelize.Op

router.get('/commerciaux' ,(req, res, next) => {
    res.render('parametres/equipes_commerciaux', { extractStyles: true, title: 'Paramètres commerciaux | FUEGO', description:'Paramètres de création des équipes de commerciaux', session: req.session.client, options_top_bar: 'parametres'});
});
router.get('/' ,(req, res, next) => {
    res.render('parametres/equipes_commerciaux', { extractStyles: true, title: 'Paramètres commerciaux | FUEGO', session: req.session.client, options_top_bar: 'parametres'});
});

router.get('/telemarketing' ,(req, res, next) => {
    res.render('parametres/equipes_telemarketing', { extractStyles: true, title: 'Télémarketing | FUEGO', session: req.session.client, options_top_bar: 'parametres'});
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
                    {model: models.Structure}
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
        res.render('parametres/utilisateurs', { extractStyles: true, title: 'Menu', session: req.session.client, options_top_bar: 'parametres', findedUsers : findedUsers});
    })
});

router.get('/privileges' ,(req, res, next) => {
    models.Privilege.findAll()
    .then((findedPrivileges) => {
        models.sequelize.query('SELECT Roles.id, Roles.nom, count(Users.id) as count FROM Roles LEFT JOIN Users ON Roles.id=Users.idRole GROUP BY Roles.id, Roles.nom', { type: models.sequelize.QueryTypes.SELECT })
        .then((findedRoles) => {
            models.User.findAll()
            .then((findedUsers) => {
                res.render('parametres/roles_privileges', { extractStyles: true, title: 'Menu', session: req.session.client, options_top_bar: 'parametres', findedPrivileges : findedPrivileges, findedRoles : findedRoles, findedUsers: findedUsers});
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

router.get('/secteurs' ,(req, res, next) => {
    
    models.Secteur.findAll({
        include: {model : models.DepSecteur}
    }).then((findedSecteurs) => {
        res.render('parametres/zones_deps', { extractStyles: true, title: 'Menu', session: req.session.client, options_top_bar: 'parametres', findedSecteurs: findedSecteurs});
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


module.exports = router;