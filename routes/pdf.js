const express = require('express')
const router = express.Router()
const puppeteer = require('puppeteer')
const models = require("../models/index")
let filename = "test.pdf"

async function printPDF(url) {
    const browser = await puppeteer.launch({ headless: true});
    const page = await browser.newPage();

    await page.goto(url, {waitUntil: 'networkidle2'});

    const pdf = await page.pdf({path: './pdf/'+filename, format: 'A4'});
   
    await browser.close();
    return pdf
}

router.post('/fiche-client' , (req, res, next) => {

    let url = 'http://localhost:8080/pdf/client/'+req.body.id

    printPDF(url).then(pdf => {
        res.send(filename);
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
        filename = findedRdv.Client.nom+'_'+findedRdv.Client.cp+'.pdf'
        res.render('../pdf/fiche_intervention_HHS', {layout: false, rdv: findedRdv});
    }).catch(err => {
        console.log(err)
    })
});

module.exports = router;