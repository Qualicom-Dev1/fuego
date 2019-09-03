const express = require('express');
const router = express.Router();
const request = require('request');
const models = require("../models/index");

router.get('/:Id' ,(req, res, next) => {
    
    let currentres = res;

    if(req.params.Id < 138787){

    request('http://ezqual.fr/clientstofuego.php?id='+req.params.Id, { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        body = JSON.parse(JSON.stringify(body).replace(/\:null/gi, "\:\"\"")); 

        if(typeof body.rdv[0] == 'undefined'){
            body.fioul = body.x_qualif_fioul == 'TRUE' ? 1 : 0;
            body.gaz = body.x_qualif_gaz == 'TRUE' ? 1 : 0,
            body.elec = body.x_qualif_elec == 'TRUE' ? 1 : 0,
            body.bois = body.x_qualif_bois == 'TRUE' ? 1 : 0,
            body.pac = body.x_qualif_pac == 'TRUE' ? 1 : 0,
            body.autre = body.x_qualif_autre == 'TRUE' ? 1 : 0,
            body.panneaux = body.x_qualif_panneaux == 'TRUE' ? 1 : 0,
            body.commentaire = ''
        }else{
            body.fioul = body.x_qualif_fioul == 'TRUE' || body.rdv[0].installation == 'Fioul' || body.rdv[0].installation2 == 'Fioul' || body.rdv[0].installation3 == 'Fioul' ? 1 : 0,
            body.gaz = body.x_qualif_gaz == 'TRUE' || body.rdv[0].installation == 'Gaz' || body.rdv[0].installation2 == 'Gaz' || body.rdv[0].installation3 == 'Gaz' ? 1 : 0,
            body.elec = body.x_qualif_elec == 'TRUE' || body.rdv[0].installation == 'Elec' || body.rdv[0].installation2 == 'Elec' || body.rdv[0].installation3 == 'Elec' ? 1 : 0,
            body.bois = body.x_qualif_bois == 'TRUE' || body.rdv[0].installation == 'Bois' || body.rdv[0].installation2 == 'Bois' || body.rdv[0].installation3 == 'Bois' ? 1 : 0,
            body.pac = body.x_qualif_pac == 'TRUE' || body.rdv[0].installation == 'Pac' || body.rdv[0].installation2 == 'Pac' || body.rdv[0].installation3 == 'Pac'? 1 : 0,
            body.autre = body.x_qualif_autre == 'TRUE' || body.rdv[0].installation == 'Autre' || body.rdv[0].installation2 == 'Autre' || body.rdv[0].installation3 == 'Autre'? 1 : 0,
            body.panneaux = body.x_qualif_panneaux == 'TRUE' || body.rdv[0].installation == 'Solaire' || body.rdv[0].installation2 == 'Solaire' || body.rdv[0].installation3 == 'Solaire'? 1 : 0,
            body.commentaire = body.rdv[0].presclient
        }

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
            age1: parseInt(body.age),
            pro2: body.situapro2.toUpperCase(),
            pdetail2: body.situapro2_pres.toUpperCase(),
            age2: parseInt(body.age),
            fioul: body.fioul,
            gaz: body.gaz,
            elec: body.elec,
            bois: body.bois,
            pac: body.pac,
            autre: body.autre,
            fchauffage: body.montant_facture,
            surface: body.sup,
            panneaux: body.panneaux,
            annee: body.pv == '' ? null : body.pv,
            be: body.bilan == 'TRUE' ? 1 : 0,
            commentaire: body.commentaire,
            source: body.source,
            type: body.x_type_campagne,
        }).then((result) => {
            if(body.appels.length != 0 ){
                body.appels.forEach((element) => {
                    models.Historique.create({
                        idAction: 2,
                        idClient: result.id,
                        idUser: tabStatClick[element.telepro], 
                        createdAt: element.dateclick
                    });
                });
                    if(body.statut != 'RDV' &&  body.statut != 'A TRAITER'){
                        models.Historique.create({
                            idAction: tabStatut[body.statut],
                            idClient: result.id,
                            idUser: tabStatClick[body.idtelepro], 
                            createdAt: body.datetraitement
                        });
                    }
                    if(body.statut == 'RDV'){
                        if(body.rdv.length != 0 ){
                            body.rdv.forEach( (element) => {
                                models.Historique.create({
                                    idAction: 1,
                                    dateevent: element.daterdv,
                                    commentaire: element.cr.obsvente,  
                                    idClient: result.id,
                                    idUser: tabUser[element.telepro], 
                                    createdAt: element.daterdv
                                }).then((result2) => {
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
                            let id = parseInt(req.params.Id) + 1; 
                            console.log('test');
                            console.log(req.params.Id);
                            console.log('test');
                            currentres.redirect('/api/'+id);
                        }
                    }else{
                        let id = parseInt(req.params.Id) + 1; 
                        console.log('test');
                        console.log(req.params.Id);
                        console.log('test');
                        currentres.redirect('/api/'+id); 
                    }
            }else{
                let id = parseInt(req.params.Id) + 1; 
                console.log('test');
                console.log(req.params.Id);
                console.log('test');
                currentres.redirect('/api/'+id);
            }
        });
    });
    }
});                

                        
module.exports = router;

function formatPhone(phoneNumber){

    if(phoneNumber != null && typeof phoneNumber != 'undefined' && phoneNumber != ' '){
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
    console.log(input)
    input.toString().trim().split('/\s*\([^)]*\)/').join('').split('/[^a-zA-Z0-9]/s').join('')
	return input.toString().toLowerCase()
}

let tabStatut = {
    'REFUS': '16',
    'LISTE NOIRE': '3',
    'ERREUR COORDONNEES': '4',
    'HORS CRITERE': '5',
    'RTVE STE': '6',
    'ERREUR PANNEAUX': '7',
    'RAPPEL': '8',
    'N° NON ATTRIBUE': '9',
    'HS': '10',
    'NRP': '11',
    'STE TJRS ACTIVE': '12',
    'AUTRE': '13',
    'LITIGE': '14',
    'LISTE ROUGE': '15'
}

let tabUser = {
    'catherine': '2',
    'sebastien': '16',
    'johan': '1',
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
    'catherine@qualicom-conseil.fr': '2',
    'sebastien@qualicom-conseil.fr': '16',
    'johan@qualicom-conseil.fr': '1',
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