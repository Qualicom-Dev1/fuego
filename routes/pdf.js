const express = require('express')
const router = express.Router()
const models = require("../models/index")
const fs = require('fs')
const moment = require('moment')
const sequelize = require('sequelize')
const Op = sequelize.Op
const request = require('request')

router.post('/fiche-client' , (req, res, next) => {

    models.RDV.findOne({
        include: {
            model: models.Client
        },
        where: {
            id: req.body.id
        }
    }).then(findedRdv => {

        let url = req.protocol+'://'+req.headers.host+'/pdf/client/'+req.body.id

        let path = './pdf/'+findedRdv.Client.nom+'_'+findedRdv.Client.cp+'.pdf'

        let options = {
            method: 'POST',
            encoding: "binary",
            url: 'https://api.html2pdf.app/v1/generate?url='+url+'&apiKey=44b277789ad2f1beedece4aa6325fe00bdcf9f5acad07f41e52cd1c7107f3176',
            headers: {
                "Content-type": "applcation/pdf"
            }
        };
        
        request(options, (error, response, body) => {
          if (error) console.log(error);
          try {
            fs.writeFileSync(path, body, 'binary')
            res.send(findedRdv.Client.nom+'_'+findedRdv.Client.cp+'.pdf')
          } catch (err) {
            console.log('Error in writing file')
            console.log(err)
          }

        });
    }).catch(err => {
        console.log(err)
    })
});

router.post('/agency' , (req, res, next) => {

        let urlagency
        let pathagency

       if(typeof req.body['ids[]'] == 'string'){
        urlagency = req.protocol+'://'+req.headers.host+'/pdf/agency/'+req.body['ids[]']+'/'+req.body.name
        pathagency = './pdf/agency_du_'+req.body.name+'.pdf'
       }else{
        urlagency = req.protocol+'://'+req.headers.host+'/pdf/agency/'+req.body['ids[]'].join('-')+'/'+req.body.name
        pathagency = './pdf/agency_du_'+req.body.name+'.pdf'
       }


       let options = {
            method: 'POST',
            encoding: "binary",
            url: 'https://api.html2pdf.app/v1/generate?url='+urlagency+'&apiKey=44b277789ad2f1beedece4aa6325fe00bdcf9f5acad07f41e52cd1c7107f3176',
            headers: {
                "Content-type": "applcation/pdf"
            }
        };
    
        request(options, (error, response, body) => {
        if (error) console.log(error);
        try {
            fs.writeFileSync(pathagency, body, 'binary')
            res.send('agency_du_'+req.body.name+'.pdf')
        } catch (err) {
            console.log('Error in writing file')
            console.log(err)
        }
    });
});

router.get('/client/:Id' , (req, res) => {
    models.RDV.findOne({
        include: {
            model: models.Client
        },
        where: {
            id: req.params.Id
        }
    }).then(findedRdv => {
        res.render('../pdf/fiche_intervention_HHS', {layout: false, rdv: findedRdv});
    }).catch(err => {
        console.log(err)
    })
});

router.get('/agency/:id/:date' , (req, res) => {
    models.RDV.findAll({
        include: [
            {model: models.Client},
            {model: models.User},
            {model: models.Etat},
        ],
        where: {
            id: {
                [Op.in]: req.params.id.split('-')
            },
            statut: 1,
            idVendeur: {
                [Op.not] : null
            }
        },
        order: [['idVendeur', 'asc']],
    }).then(findedRdv => {
        res.render('../pdf/agency', {layout: false, rdvs: findedRdv, date: req.params.date, moment: moment});
    }).catch(err => {
        console.log(err)
    })
});

module.exports = router;