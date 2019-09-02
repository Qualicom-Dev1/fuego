const express = require('express');
const router = express.Router();
const request = require('request');
const models = require("../models/index");

router.get('/:Id' ,(req, res, next) => {
    request('http://ezqual.fr/clientstofuego.php?id='+req.params.Id, { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        body = JSON.parse(JSON.stringify(body).replace(/\:null/gi, "\:\"\"")); 
        models.Client.create({
            nom: body.nom.toUpperCase(),
            prenom: body.prenom.toUpperCase(),
            tel1: formatPhone(body.tel1),
            tel2: formatPhone(body.tel2),
            tel3: formatPhone(body.tel3),
            adresse: body.adresse.toUpperCase(),
            cp: body.cp,
            ville: body.ville.toUpperCase(),
            relation: body.situafam.toUpperCase(),
            pro1: body.situapro.toUpperCase(),
            pdetail1: body.situapro_pres.toUpperCase(),
            age1: body.age,
            pro2: body.situapro2.toUpperCase(),
            pdetail2: body.situapro2_pres.toUpperCase(),
            age2: body.age,
            fioul: body.x_qualif_fioul == 'TRUE' || body.rdv[0].installation == 'Fioul' || body.rdv[0].installation2 == 'Fioul' || body.rdv[0].installation3 == 'Fioul' ? 1 : 0,
            gaz: body.x_qualif_gaz == 'TRUE' || body.rdv[0].installation == 'Gaz' || body.rdv[0].installation2 == 'Gaz' || body.rdv[0].installation3 == 'Gaz' ? 1 : 0,
            elec: body.x_qualif_elec == 'TRUE' || body.rdv[0].installation == 'Elec' || body.rdv[0].installation2 == 'Elec' || body.rdv[0].installation3 == 'Elec' ? 1 : 0,
            bois: body.x_qualif_bois == 'TRUE' || body.rdv[0].installation == 'Bois' || body.rdv[0].installation2 == 'Bois' || body.rdv[0].installation3 == 'Bois' ? 1 : 0,
            pac: body.x_qualif_pac == 'TRUE' || body.rdv[0].installation == 'Pac' || body.rdv[0].installation2 == 'Pac' || body.rdv[0].installation3 == 'Pac'? 1 : 0,
            autre: body.x_qualif_autre == 'TRUE' || body.rdv[0].installation == 'Autre' || body.rdv[0].installation2 == 'Autre' || body.rdv[0].installation3 == 'Autre'? 1 : 0,
            fchauffage: body.montant_facture,
            surface: body.sup,
            panneaux: body.x_qualif_panneaux == 'TRUE' || body.rdv[0].installation == 'Solaire' || body.rdv[0].installation2 == 'Solaire' || body.rdv[0].installation3 == 'Solaire'? 1 : 0,
            annee: body.pv == '' ? null : body.pv,
            be: body.bilan == 'TRUE' ? 1 : 0,
            commentaire: body.rdv[0].presclient,
            source: body.source,
            type: body.x_type_campagne,
         })
         .then((result) => {
            body.rdv.forEach( (element) => {
                models.Historique.create({
                    idAction: 1,
                    dateevent: element.daterdv,
                    commentaire: element.cr.obsvente,  
                    idClient: result.id,
                    idUser: tabUser[element.telepro], 
                    createdAt: element.daterdv
                }).then( (result2) => {
                    models.RDV.create({
                        idClient: result.id,
                        idHisto: result2.id,
                        idEtat: typeof tabEtat[element.etat] != 'undefined' ? tabEtat[element.etat] : '15',
                        commentaire: element.cr.obsvente, 
                        date: element.daterdv
                    }).then((result3) => {
                        result2.update({idRdv: result3.id})
                    });
                });
             });
            body.appels.forEach((element) => {
                models.Historique.create({
                    idAction: 2,
                    idClient: result.id,
                    idUser: tabStatClick[element.telepro], 
                    createdAt: element.dateclick
                });
            });
         });
      });    
});


module.exports = router;

function formatPhone(phoneNumber){

    if(phoneNumber != null && typeof phoneNumber != 'undefined'){
        phoneNumber = cleanit(phoneNumber);
	    phoneNumber = phoneNumber.split(' ').join('')
        phoneNumber = phoneNumber.split('.').join('')

        if(phoneNumber.length != 10){

            phoneNumber = '0'+phoneNumber;

            if(phoneNumber.length != 10){
                return undefined
            }else{
                return phoneNumber
            }
        }else{
            return phoneNumber
        }
    }

}

function cleanit(input) {
    input.trim().split('/\s*\([^)]*\)/').join('').split('/[^a-zA-Z0-9]/s').join('')
	return input.toLowerCase()
}

let tabUser = {
    'catherine': '1',
    'sebastien': '2',
    'johan': '3',
    'super': '4',
    'Angeline': '5',
    'Wissame': '6',
    'Stephanie': '7',
    'Nassim': '8',
    'Anais': '9',
    'damien': '10',
    'Marietherese': '11',
    'Sybille': '12',
    'Lucas': '13',
    'Oceane': '14',
    'Alexane': '15'
}
let tabStatClick = {
    'catherine@qualicom-conseil.fr': '1',
    'sebastien@qualicom-conseil.fr': '2',
    'johan@qualicom-conseil.fr': '3',
    'super@qualicom-conseil.fr': '4',
    'angeline@qualicom-conseil.fr': '5',
    'wissame@qualicom-conseil.fr': '6',
    'stephanie@qualicom-conseil.fr': '7',
    'nassim@qualicom-conseil.fr': '8',
    'anais@qualicom-conseil.fr': '9',
    'damien@qualicom-conseil.fr': '10',
    'marietherese@qualicom-conseil.fr': '11',
    'sybille@qualicom-conseil.fr': '12',
    'lucas@qualicom-conseil.fr': '13',
    'oceane@qualicom-conseil.fr': '14',
    'alexane@qualicom-conseil.fr': '15'
}
let tabEtat = {
    'ABS': '7',
    'ANNULE': '6',
    'ANNULE AU REPORT': '6',
    'Confirmé': '5',
    'DECOUVERTE': '8',
    'DEEM': '3',
    'DEM': '3',
    'En cours': '4',
    'HC': '14',
    'PAS eTe': '10',
    'REFUS': '11',
    'REFUS DEM': '11',
    'REPOSITIONNE': '2',
    'repo_client': '13',
    'repo_com': '12',
    'Valide(ABS)': '7',
    'Valide(ANNULE)': '6',
    'Valide(DECOUVERTE)': '8',
    'Valide(DEM R.A.F.)': '3',
    'Valide(DEM SUIVI)': '2',
    'Valide(DEVIS)': '9',
    'Valide(PAS ETE)': '10',
    'Valide(REFUS DEM)': '11',
    'Valide(VENTE ADD)': '1'
}