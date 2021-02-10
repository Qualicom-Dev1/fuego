const express = require('express')
const router = express.Router()
const models = global.db
const moment = require('moment')
const sequelize = require('sequelize')
const Op = sequelize.Op

router
.get('/' , (req, res) => {
    models.RDV.findAll({
        include: [
            {model : models.Client},
            {model : models.Historique, include: {
                model : models.User, include : [
                    {model : models.Structure}
                ]
            }},
            {model : models.User},
            {model : models.Etat},
            {model : models.Campagne}
        ],
        where: {
            date : {
                [Op.between] : [moment().startOf('month').format('YYYY-MM-DD'), moment().endOf('month').format('YYYY-MM-DD')]
            },
            idEtat: 1
        },
        order: [['date', 'asc']],
    }).then(findedRdvs => {
        if(findedRdvs){
            res.render('adv/ventes', { extractStyles: true, title: 'ADV | FUEGO', description :'Administration des ventes', findedRdvs: findedRdvs, session: req.session.client, options_top_bar: 'adv', date: moment().format('DD/MM/YYYY')});
        }else{
            req.flash('error_msg', 'Un problème est survenu, veuillez réessayer. Si le probleme persiste veuillez en informer votre superieur.');
            res.redirect('/menu');
        }
    }).catch(function (e) {
        req.flash('error', e);
    });
})

.post('/' , (req, res) => {
    models.RDV.findAll({
        include: [
            {model : models.Client},
            {model : models.Historique, include: {
                model : models.User, include : [
                    {model : models.Structure}
                ]
            }},
            {model : models.User},
            {model : models.Etat},
            {model : models.Campagne}
        ],
        where: {
            date : {
                [Op.between] : [moment(req.body.datedebut, 'DD/MM/YYYY').format('MM-DD-YYYY'), moment(moment(req.body.datefin, 'DD/MM/YYYY').format('MM-DD-YYYY')).add(1, 'days')]
            },
            idEtat: 1
        },
        order: [['date', 'asc']],
    }).then(findedRdvs => {
        if(findedRdvs){
            res.send(findedRdvs);
        }else{
            req.flash('error_msg', 'Un problème est survenu, veuillez réessayer. Si le probleme persiste veuillez en informer votre superieur.');
            res.redirect('/menu');
        }
    }).catch(function (e) {
        req.flash('error', e);
    });
});

module.exports = router;