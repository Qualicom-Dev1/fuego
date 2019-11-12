const express = require('express')
const router = express.Router()
const puppeteer = require('puppeteer')
const models = require("../models/index")
const fs = require('fs')
const moment = require('moment')
const sequelize = require('sequelize')
const Op = sequelize.Op

async function printPDF(url, path, orientation) {
    const browser = await puppeteer.launch({ headless: true});
    const page = await browser.newPage();

    await page.goto(url, {waitUntil: 'networkidle2'});

    const pdf = await page.pdf({path: path, format: 'A4', landscape: orientation });
   
    await browser.close();
    return pdf
}

router.post('/fiche-client' , (req, res, next) => {

    let url = 'http://localhost:8080/pdf/client/'+req.body.id

    models.RDV.findOne({
        include: {
            model: models.Client
        },
        where: {
            id: req.body.id
        }
    }).then(findedRdv => {
        printPDF(url, './pdf/'+findedRdv.Client.nom+'_'+findedRdv.Client.cp+'.pdf', false).then(pdf => {
            res.send(findedRdv.Client.nom+'_'+findedRdv.Client.cp+'.pdf');
        });
    }).catch(err => {
        console.log(err)
    })

});

router.post('/agency' , (req, res, next) => {

    /*if (!fs.existsSync('./pdf/'+req.body.name)){
        fs.mkdirSync('./pdf/'+req.body.name)
    }*/

        let urlagency
        let pathagency

       if(typeof req.body['ids[]'] == 'string'){
        urlagency = 'http://localhost:8080/pdf/agency/'+req.body['ids[]']+'/'+req.body.name
        pathagency = './pdf/agency_du_'+req.body.name+'.pdf'
       }else{
        urlagency = 'http://localhost:8080/pdf/agency/'+req.body['ids[]'].join('-')+'/'+req.body.name
        pathagency = './pdf/agency_du_'+req.body.name+'.pdf'
       }

    //let ctr = 0

    printPDF(urlagency, pathagency, true).then((data) => {
        /*req.body['ids[]'].forEach((element, index, array) => {
            models.RDV.findOne({
                include: {
                    model: models.Client
                },
                where: {
                    id: element
                }
            }).then(findedRdv => {
                let url = 'http://localhost:8080/pdf/client/'+element
                let path = './pdf/'+req.body.name+'/'+findedRdv.Client.nom+'_'+findedRdv.Client.cp+'.pdf'
                printPDF(url, path, false).then((data) => {
                    ctr++
                    if (ctr === array.length) {
                        AllDone()
                        
                    }
                })
            }).catch(err => {
                console.log(err)
            })
        })*/
        res.send(pathagency)
    })
    
    function AllDone(){
        res.send('OK')
    }
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