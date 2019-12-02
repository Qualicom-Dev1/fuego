const express = require('express');
const router = express.Router();
const request = require('request');
const models = require("../models/index");
const moment = require('moment');

router.get('/:Id' ,(req, res, next) => {
    
    let currentres = res;

    //res.render('api', { extractStyles: true, title: 'Menu', id: req.params.Id});
    res.status(200)

    
    request('http://ezqual.fr/clientstofuego.php?id='+req.params.Id, { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        body = JSON.parse(JSON.stringify(body).replace(/\:null/gi, "\:\"\""));
        
        if(body != 'ok'){

        if(typeof body.rdv == 'undefined' || (Object.entries(body.rdv).length === 0)){
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

        models.Client.findOne({
            where: {
                id_hitech: body.id_hitech
            }
        }).then((findedClient) => {
    
        if(!findedClient){
            models.Client.create({
            id_hitech: body.id_hitech,
            nom: typeof body.nom != 'undefined' ? body.nom.toUpperCase() : null,
            prenom: typeof body.prenom != 'undefined' ? body.prenom.toUpperCase() : null,
            tel1: typeof body.tel1 != 'undefined' ? formatPhone(body.tel1) : null,
            tel2: typeof body.tel2 != 'undefined' ? formatPhone(body.tel2) : null,
            tel3: typeof body.tel3 != 'undefined' ? formatPhone(body.tel3) : null,
            adresse: typeof body.adresse != 'undefined' ? body.adresse.toUpperCase() : null,
            cp: typeof body.cp != 'undefined' ? body.cp : null,
            dep: typeof body.cp != 'undefined' ? body.cp.toString().substr(0,2) : null,
            ville: typeof body.ville != 'undefined' ? body.ville.toUpperCase() : null,
            relation: typeof body.situafam != 'undefined' ? body.situafam.toUpperCase() : null,
            pro1: typeof body.situapro != 'undefined' ? body.situapro.toUpperCase() : null,
            pdetail1: typeof body.situapro_pres != 'undefined' ? body.situapro_pres.toUpperCase() : null,
            age1: typeof body.age != 'undefined' ? parseInt(body.age) : null,
            pro2: typeof body.situapro2 != 'undefined' ? body.situapro2.toUpperCase() : null,
            pdetail2: typeof body.situapro2_pres != 'undefined' ? body.situapro2_pres.toUpperCase() : null,
            age2: typeof body.age != 'undefined' ? parseInt(body.age) : null,
            fioul: typeof body.fioul != 'undefined' ? body.fioul : null,
            gaz: typeof body.gaz != 'undefined' ? body.gaz : null,
            elec: typeof body.elec != 'undefined' ? body.elec : null,
            bois: typeof body.bois != 'undefined' ? body.bois : null,
            pac: typeof body.pac != 'undefined' ? body.pac : null,
            autre: typeof body.autre != 'undefined' ? body.autre : null,
            fchauffage: typeof body.montant_facture != 'undefined' ? body.montant_facture : null,
            surface: typeof body.sup != 'undefined' ? body.sup : null,
            panneaux: typeof body.panneaux != 'undefined' ? body.panneaux : null,
            annee: typeof body.pv != 'undefined' ? body.pv == '' ? null : body.pv : null,
            be: typeof body.bilan != 'undefined' ? body.bilan == 'TRUE' ? 1 : 0 : null,
            commentaire: typeof body.commentaire != 'undefined' ? body.commentaire : null,
            source: typeof body.source != 'undefined' ? body.source : null,
            type: typeof body.x_type_campagne != 'undefined' ? body.x_type_campagne : null,
            }).then((result) => {
            if(body.appels.length != 0 ){
                body.appels.forEach((element) => {
                    models.Historique.create({
                        idAction: 2,
                        idClient: result.id,
                        idUser: tabStatClick[element.telepro], 
                        createdAt: moment(element.dateclick)
                    }).catch(function (e) {
                        console.log('error', e);
                    });;
                });
                    if(body.statut != 'RDV' &&  body.statut != 'A TRAITER'){
                        models.Historique.create({
                            idAction: tabStatut[body.statut],
                            idClient: result.id,
                            idUser: tabStatClick[body.idtelepro], 
                            createdAt: moment(body.datetraitement)
                        }).then((historique) => {
                            result.update({currentAction: historique.idAction, currentUser: historique.idUser})
                        }).catch(function (e) {
                            console.log('error', e);
                        });;
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
                                    result.update({currentAction: result2.idAction, currentUser: result2.idUser})
                                    models.RDV.create({
                                        idClient: result.id,
                                        idHisto: result2.id,
                                        source: 'TMK',
                                        idEtat: typeof tabEtat[element.etat] != 'undefined' ? tabEtat[element.etat] : '15',
                                        commentaire: element.cr.obsvente, 
                                        date: element.daterdv
                                    }).then((result3) => {
                                        result2.update({idRdv: result3.id}).catch(function (e) {
                                            console.log('error', e);
                                        });
                                    }).catch(function (e) {
                                        console.log('error', e);
                                    });
                                }).catch(function (e) {
                                    console.log('error', e);
                                });
                            });
                        }
                        console.log('test');
                    }else{
                        console.log('test');
                    }
            }else{
                console.log('test');
            }
            }).catch(function (e) {
            console.log('error', e);
            });
        }else{
            findedClient.update({
                id_hitech: body.id_hitech,
                nom: typeof body.nom != 'undefined' ? body.nom.toUpperCase() : null,
                prenom: typeof body.prenom != 'undefined' ? body.prenom.toUpperCase() : null,
                tel1: typeof body.tel1 != 'undefined' ? formatPhone(body.tel1) : null,
                tel2: typeof body.tel2 != 'undefined' ? formatPhone(body.tel2) : null,
                tel3: typeof body.tel3 != 'undefined' ? formatPhone(body.tel3) : null,
                adresse: typeof body.adresse != 'undefined' ? body.adresse.toUpperCase() : null,
                cp: typeof body.cp != 'undefined' ? body.cp : null,
                dep: typeof body.cp != 'undefined' ? body.cp.toString().substr(0,2) : null,
                ville: typeof body.ville != 'undefined' ? body.ville.toUpperCase() : null,
                relation: typeof body.situafam != 'undefined' ? body.situafam.toUpperCase() : null,
                pro1: typeof body.situapro != 'undefined' ? body.situapro.toUpperCase() : null,
                pdetail1: typeof body.situapro_pres != 'undefined' ? body.situapro_pres.toUpperCase() : null,
                age1: typeof body.age != 'undefined' ? parseInt(body.age) : null,
                pro2: typeof body.situapro2 != 'undefined' ? body.situapro2.toUpperCase() : null,
                pdetail2: typeof body.situapro2_pres != 'undefined' ? body.situapro2_pres.toUpperCase() : null,
                age2: typeof body.age != 'undefined' ? parseInt(body.age) : null,
                fioul: typeof body.fioul != 'undefined' ? body.fioul : null,
                gaz: typeof body.gaz != 'undefined' ? body.gaz : null,
                elec: typeof body.elec != 'undefined' ? body.elec : null,
                bois: typeof body.bois != 'undefined' ? body.bois : null,
                pac: typeof body.pac != 'undefined' ? body.pac : null,
                autre: typeof body.autre != 'undefined' ? body.autre : null,
                fchauffage: typeof body.montant_facture != 'undefined' ? body.montant_facture : null,
                surface: typeof body.sup != 'undefined' ? body.sup : null,
                panneaux: typeof body.panneaux != 'undefined' ? body.panneaux : null,
                annee: typeof body.pv != 'undefined' ? body.pv == '' ? null : body.pv : null,
                be: typeof body.bilan != 'undefined' ? body.bilan == 'TRUE' ? 1 : 0 : null,
                commentaire: typeof body.commentaire != 'undefined' ? body.commentaire : null,
                source: typeof body.source != 'undefined' ? body.source : null,
                type: typeof body.x_type_campagne != 'undefined' ? body.x_type_campagne : null,
                }).then((result) => {
                if(body.appels.length != 0 ){
                    body.appels.forEach((element) => {
                        models.Historique.create({
                            idAction: 2,
                            idClient: result.id,
                            idUser: tabStatClick[element.telepro], 
                            createdAt: moment(element.dateclick)
                        }).catch(function (e) {
                            console.log('error', e);
                        });;
                    });
                        if(body.statut != 'RDV' &&  body.statut != 'A TRAITER'){
                            models.Historique.create({
                                idAction: tabStatut[body.statut],
                                idClient: result.id,
                                idUser: tabStatClick[body.idtelepro], 
                                createdAt: moment(body.datetraitement)
                            }).then((historique) => {
                                result.update({currentAction: historique.idAction, currentUser: historique.idUser})
                            }).catch(function (e) {
                                console.log('error', e);
                            });;
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
                                        result.update({currentAction: result2.idAction, currentUser: result2.idUser})
                                        models.RDV.create({
                                            idClient: result.id,
                                            idHisto: result2.id,
                                            source: 'TMK',
                                            idEtat: typeof tabEtat[element.etat] != 'undefined' ? tabEtat[element.etat] : '15',
                                            commentaire: element.cr.obsvente, 
                                            date: element.daterdv
                                        }).then((result3) => {
                                            result2.update({idRdv: result3.id}).catch(function (e) {
                                                console.log('error', e);
                                            });
                                        }).catch(function (e) {
                                            console.log('error', e);
                                        });
                                    }).catch(function (e) {
                                        console.log('error', e);
                                    });
                                });
                            }
                            console.log('test');
                        }else{
                            console.log('test');
                        }
                }else{
                    console.log('test');
                }
                }).catch(function (e) {
                console.log('error', e);
                });
        }

        });
    }else{
        console.log('test');
    }
    });
});                

router.post('/ezqual' ,(req, res, next) => {

    res.status(200)

    let body = req.body


    body.fioul = body.x_qualif_fioul == 'TRUE' ? 1 : 0
    body.gaz = body.x_qualif_gaz == 'TRUE' ? 1 : 0
    body.elec = body.x_qualif_elec == 'TRUE' ? 1 : 0
    body.bois = body.x_qualif_bois == 'TRUE' ? 1 : 0
    body.pac = body.x_qualif_pac == 'TRUE' ? 1 : 0
    body.autre = body.x_qualif_autre == 'TRUE' ? 1 : 0
    body.panneaux = body.x_qualif_panneaux == 'TRUE' ? 1 : 0

    models.Client.findOne({
        where: {
            id_hitech: body.id_hitech
        }
    }).then((findedClient) => {

        if(!findedClient){

        models.Client.create({
            id_hitech: body.id_hitech,
            nom: typeof body.nom != 'undefined' && body.nom != 'NULL' ? body.nom.toUpperCase() : null,
            prenom: typeof body.prenom != 'undefined' && body.prenom != 'NULL' ? body.prenom.toUpperCase() : null,
            tel1: typeof body.tel1 != 'undefined' && body.tel1 != 'NULL' ? formatPhone(body.tel1) : null,
            tel2: typeof body.tel2 != 'undefined' && body.tel2 != 'NULL' ? formatPhone(body.tel2) : null,
            tel3: typeof body.tel3 != 'undefined' && body.tel3 != 'NULL' ? formatPhone(body.tel3) : null,
            adresse: typeof body.adresse != 'undefined' && body.adresse != 'NULL' ? body.adresse.toUpperCase() : null,
            cp: typeof body.cp != 'undefined' && body.cp != 'NULL' ? body.cp : null,
            dep: typeof body.cp != 'undefined' && body.cp != 'NULL' ? body.cp.toString().substr(0,2) : null,
            ville: typeof body.ville != 'undefined' && body.ville != 'NULL' ? body.ville.toUpperCase() : null,
            relation: typeof body.situafam != 'undefined' && body.situafam != 'NULL' ? body.situafam.toUpperCase() : null,
            pro1: typeof body.situapro != 'undefined' && body.situapro != 'NULL' ? body.situapro.toUpperCase() : null,
            pdetail1: typeof body.situapro_pres != 'undefined' && body.situapro_pres != 'NULL' ? body.situapro_pres.toUpperCase() : null,
            age1: typeof body.age != 'undefined' && body.age != 'NULL' ? parseInt(body.age) : null,
            pro2: typeof body.situapro2 != 'undefined' && body.situapro2 != 'NULL' ? body.situapro2.toUpperCase() : null,
            pdetail2: typeof body.situapro2_pres != 'undefined' && body.situapro2_pres != 'NULL' ? body.situapro2_pres.toUpperCase() : null,
            age2: typeof body.age != 'undefined' && body.age != 'NULL' ? parseInt(body.age) : null,
            fioul: typeof body.fioul != 'undefined' && body.fioul != 'NULL' ? body.fioul : null,
            gaz: typeof body.gaz != 'undefined' && body.gaz != 'NULL' ? body.gaz : null,
            elec: typeof body.elec != 'undefined' && body.elec != 'NULL' ? body.elec : null,
            bois: typeof body.bois != 'undefined' && body.bois != 'NULL' ? body.bois : null,
            pac: typeof body.pac != 'undefined' && body.pac != 'NULL' ? body.pac : null,
            autre: typeof body.autre != 'undefined' && body.autre != 'NULL' ? body.autre : null,
            fchauffage: typeof body.montant_facture != 'undefined' && body.montant_facture != 'NULL' ? body.montant_facture : null,
            panneaux: typeof body.panneaux != 'undefined' && body.panneaux != 'NULL' ? body.panneaux : null,
            be: typeof body.bilan != 'undefined' && body.bilan != 'NULL' ? body.bilan == 'TRUE' ? 1 : 0 : null,
            commentaire: typeof body.commentaire != 'undefined' && body.commentaire != 'NULL' ? body.commentaire : null,
            source: typeof body.source != 'undefined' && body.source != 'NULL' ? body.source : null,
            type: typeof body.x_type_campagne != 'undefined' && body.x_type_campagne != 'NULL' ? body.x_type_campagne : null,
        }).then((result) => {
            models.Historique.create({
                idAction: 1,
                idClient: result.id,
                dateevent: moment(body.daterdv),
                commentaire: body.commentaire,  
                idUser: tabStatClick[body.idtelepro], 
                createdAt: moment(body.datetraitement)
            }).then((historique) => {
                result.update({currentAction: historique.idAction, currentUser: historique.idUser})
                models.RDV.create({
                    idClient: result.id,
                    idHisto: historique.id,
                    commentaire: body.commentaire,
                    date: moment(body.daterdv)
                }).then((result3) => {
                    historique.update({idRdv: result3.id}).catch(function (e) {
                        console.log('error', e);
                    });
                });
            }).catch(function (e) {
                console.log('error', e);
            });
    }).catch(function (e) {
        console.log('error', e);
    });
    } else {
        findedClient.update({
            id_hitech: body.id_hitech,
            nom: typeof body.nom != 'undefined' && body.nom != 'NULL' ? body.nom.toUpperCase() : null,
            prenom: typeof body.prenom != 'undefined' && body.prenom != 'NULL' ? body.prenom.toUpperCase() : null,
            tel1: typeof body.tel1 != 'undefined' && body.tel1 != 'NULL' ? formatPhone(body.tel1) : null,
            tel2: typeof body.tel2 != 'undefined' && body.tel2 != 'NULL' ? formatPhone(body.tel2) : null,
            tel3: typeof body.tel3 != 'undefined' && body.tel3 != 'NULL' ? formatPhone(body.tel3) : null,
            adresse: typeof body.adresse != 'undefined' && body.adresse != 'NULL' ? body.adresse.toUpperCase() : null,
            cp: typeof body.cp != 'undefined' && body.cp != 'NULL' ? body.cp : null,
            dep: typeof body.cp != 'undefined' && body.cp != 'NULL' ? body.cp.toString().substr(0,2) : null,
            ville: typeof body.ville != 'undefined' && body.ville != 'NULL' ? body.ville.toUpperCase() : null,
            relation: typeof body.situafam != 'undefined' && body.situafam != 'NULL' ? body.situafam.toUpperCase() : null,
            pro1: typeof body.situapro != 'undefined' && body.situapro != 'NULL' ? body.situapro.toUpperCase() : null,
            pdetail1: typeof body.situapro_pres != 'undefined' && body.situapro_pres != 'NULL' ? body.situapro_pres.toUpperCase() : null,
            age1: typeof body.age != 'undefined' && body.age != 'NULL' ? parseInt(body.age) : null,
            pro2: typeof body.situapro2 != 'undefined' && body.situapro2 != 'NULL' ? body.situapro2.toUpperCase() : null,
            pdetail2: typeof body.situapro2_pres != 'undefined' && body.situapro2_pres != 'NULL' ? body.situapro2_pres.toUpperCase() : null,
            age2: typeof body.age != 'undefined' && body.age != 'NULL' ? parseInt(body.age) : null,
            fioul: typeof body.fioul != 'undefined' && body.fioul != 'NULL' ? body.fioul : null,
            gaz: typeof body.gaz != 'undefined' && body.gaz != 'NULL' ? body.gaz : null,
            elec: typeof body.elec != 'undefined' && body.elec != 'NULL' ? body.elec : null,
            bois: typeof body.bois != 'undefined' && body.bois != 'NULL' ? body.bois : null,
            pac: typeof body.pac != 'undefined' && body.pac != 'NULL' ? body.pac : null,
            autre: typeof body.autre != 'undefined' && body.autre != 'NULL' ? body.autre : null,
            fchauffage: typeof body.montant_facture != 'undefined' && body.montant_facture != 'NULL' ? body.montant_facture : null,
            panneaux: typeof body.panneaux != 'undefined' && body.panneaux != 'NULL' ? body.panneaux : null,
            be: typeof body.bilan != 'undefined' && body.bilan != 'NULL' ? body.bilan == 'TRUE' ? 1 : 0 : null,
            commentaire: typeof body.commentaire != 'undefined' && body.commentaire != 'NULL' ? body.commentaire : null,
            source: typeof body.source != 'undefined' && body.source != 'NULL' ? body.source : null,
            type: typeof body.x_type_campagne != 'undefined' && body.x_type_campagne != 'NULL' ? body.x_type_campagne : null,
        }).then((result) => {
            models.Historique.create({
                idAction: 1,
                idClient: result.id,
                dateevent: moment(body.daterdv),
                commentaire: body.commentaire,  
                idUser: tabStatClick[body.idtelepro], 
                createdAt: moment(body.datetraitement)
            }).then((historique) => {
                result.update({currentAction: historique.idAction, currentUser: historique.idUser})
                models.RDV.create({
                    idClient: result.id,
                    idHisto: historique.id,
                    commentaire: body.commentaire,
                    date: moment(body.daterdv)
                }).then((result3) => {
                    historique.update({idRdv: result3.id}).catch(function (e) {
                        console.log('error', e);
                    });
                });
            }).catch(function (e) {
                console.log('error', e);
            });
    }).catch(function (e) {
        console.log('error', e);
    });
    }
    res.send('ok200')
    })
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
    'LISTE ROUGE': '3'
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
    'Alexane': '15',
    'Enzo': '49'
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
    'alexane@qualicom-conseil.fr': '15',
    'enzo@qualicom-conseil.fr': '49'
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