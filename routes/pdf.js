const express = require('express')
const router = express.Router()
const models = require("../models/index")
const fs = require('fs')
const moment = require('moment')
const sequelize = require('sequelize')
const Op = sequelize.Op
const request = require('request')
const ejs = require('ejs')
const htmlToPDF = require('html-pdf')
const sourcePDFDirectory = __dirname + '/../public/pdf'
const destinationPDFDirectory = __dirname + '/../pdf'


const getFicheInterventionHTML = async (idRDV) => {
    const rdv = await models.RDV.findOne({
        include: [
            { model: models.Client },
            { 
                model : models.User,
                include : { 
                    model: models.Structure 
                } 
            }
        ],
        where: {
            id: idRDV
        }
    })

    let htmlOutput = undefined
    ejs.renderFile(`${sourcePDFDirectory}/fiche_intervention_${rdv.User.Structures[0].nom}.ejs`, { layout : false, rdv }, (err, html) => {
        if(err) {
            html = "<h1>pdf incorrect</h1>"
            console.error(err)
        }
        
        htmlOutput = html
    })

    return {
        rdv,
        html : htmlOutput
    }
}

const getAgencyHTML = async () => {

}


router.post('/fiche-client' , async (req, res, next) => {
    const { rdv, html } = await getFicheInterventionHTML(req.body.id)

    const pdf = `${rdv.Client.nom}_${rdv.Client.cp}.pdf`

    htmlToPDF.create(html, { 
        height : "1123px",
        width : "794px"
    }).toFile(`${destinationPDFDirectory}/${pdf}`, (err, { filename = undefined }) => {
        if(err) console.error(err)
        res.send(pdf)
    })
});

router.post('/agency' , (req, res, next) => {

        let urlagency
        let pathagency

        req.body.name = req.body.name.split('-').join('_')

       if(typeof req.body.ids == 'string'){
        urlagency = 'http://fuego.ovh/pdf/agency/'+req.body.ids+'/'+req.body.name
        pathagency = './pdf/agency_du_'+req.body.name+'.pdf'
       }else{
        urlagency = 'http://fuego.ovh/pdf/agency/'+req.body.ids.join('-')+'/'+req.body.name
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
        models.User.findOne({
            include: {
                model: models.Structure
            },
            where: {
                id: findedRdv.idVendeur
            }
        }).then(findedUsers => {
            res.render('../pdf/fiche_intervention_'+findedUsers.Structures[0].nom, {layout: false, rdv: findedRdv});
        }).catch(err => {
            console.log(err)
        })
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