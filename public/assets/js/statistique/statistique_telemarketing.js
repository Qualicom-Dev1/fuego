$( document ).ready(function() {
    refrechTab(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toString("yyyy-MM-dd"), new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toString("yyyy-MM-dd"))

    $('.datepicker').change(() => {
        newDate()
    })

})

function refrechTab(datedebut, datefin){

    $.ajax({
        url: '/statistiques/telemarketing/get-tab-telemarketing',
        method: 'POST',
        data: {
            datedebut: datedebut,
            datefin: datefin
        }
    }).done((data) => {

        let resultat = []
        let i = 0

        data.findedStatsRDV.forEach((element, index) => {
            if(typeof resultat[element.nomm] == 'undefined'){
                resultat[element.nomm] = []
                if(typeof resultat[element.nomm][element.nom] == 'undefined'){
                    resultat[element.nomm][element.nom] = []
                    resultat[element.nomm][element.nom]['total'] = 0 
                    if(element.etat === null){ 
                        resultat[element.nomm][element.nom]['total'] += element.count  
                    }else{
                        resultat[element.nomm][element.nom][element.etat] = []
                        resultat[element.nomm][element.nom][element.etat] = element.count
                        resultat[element.nomm][element.nom]['total'] += element.count
                    }
                }else{
                    if(element.etat === null){ 
                        resultat[element.nomm][element.nom]['total'] += element.count  
                    }else{
                        resultat[element.nomm][element.nom][element.etat] = []
                        resultat[element.nomm][element.nom][element.etat] = element.count
                        resultat[element.nomm][element.nom]['total'] += element.count
                    }
                }
            }else{
                if(typeof resultat[element.nomm][element.nom] == 'undefined'){
                    resultat[element.nomm][element.nom] = []
                    resultat[element.nomm][element.nom]['total'] = 0 
                    if(element.etat === null){ 
                        resultat[element.nomm][element.nom]['total'] += element.count  
                    }else{
                        resultat[element.nomm][element.nom][element.etat] = []
                        resultat[element.nomm][element.nom][element.etat] = element.count
                        resultat[element.nomm][element.nom]['total'] += element.count
                    }
                }else{
                    if(element.etat === null){ 
                        resultat[element.nomm][element.nom]['total'] += element.count  
                    }else{
                        resultat[element.nomm][element.nom][element.etat] = []
                        resultat[element.nomm][element.nom][element.etat] = element.count
                        resultat[element.nomm][element.nom]['total'] += element.count
                    }
                }
            }
        })

        let dataTab = []
        console.log(resultat)
        for(let element in resultat) {
            console.log(resultat[element])
            console.log(typeof resultat[element]['APPEL'] != 'undefined' ? resultat[element]['APPEL'].total : '0')
            console.log(typeof resultat[element]['RDV'] != 'undefined' ? resultat[element]['RDV'].total : '0')
            console.log(resultat[element])
            dataTab.push({
                nom: element,
                numcomp: typeof resultat[element]['APPEL'] != 'undefined' ? resultat[element]['APPEL'].total : '0',
                rdv: typeof resultat[element]['RDV'] != 'undefined' ? resultat[element]['RDV'].total : '0',
                dem: (typeof resultat[element]['DEM SUIVI'] != 'undefined' ? resultat[element]['DEM SUIVI'].total : 0) + (typeof resultat[element]['DEM R.A.F.'] != 'undefined' ? resultat[element]['DEM R.A.F.'].total : 0),
                vente: typeof resultat[element]['VENTE'] != 'undefined' ? resultat[element]['VENTE'].total : '0',
                lignerdv: ((typeof resultat[element]['APPEL'] != 'undefined' ? resultat[element]['APPEL'].total : '0') / (typeof resultat[element]['RDV'] != 'undefined' ? resultat[element]['RDV'].total : '0')).toFixed(2),
                rdvdem: ((typeof resultat[element]['RDV'] != 'undefined' ? resultat[element]['RDV'].total : '0') / ((typeof resultat[element]['DEM SUIVI'] != 'undefined' ? resultat[element]['DEM SUIVI'].total : 0) + (typeof resultat[element]['DEM R.A.F.'] != 'undefined' ? resultat[element]['DEM R.A.F.'].total : 0))).toFixed(2),
                rdvvente: ((typeof resultat[element]['RDV'] != 'undefined' ? resultat[element]['RDV'].total : '0') / (typeof resultat[element]['VENTE'] != 'undefined' ? resultat[element]['VENTE'].total : '0')).toFixed(2)
            })
        }

        dataTab = JSON.parse(JSON.stringify(dataTab).replace(/Infinity/g, '-').replace(/NaN/g, '-'))

        console.log(dataTab)

        let lignerdv = function(values, data, calcParams){

            let totalligne = 0;
            let totalrdv = 0;

            data.forEach((value) => {

                totalligne += parseInt(value.numcomp);
                totalrdv += parseInt(value.rdv);

            });

            return (totalligne / totalrdv).toFixed(2) == 'Infinity' ? '-' : (totalligne / totalrdv).toFixed(2);
        };

        let rrdvdem = function(values, data, calcParams){

            let totalrdv = 0;
            let totaldem = 0;

            data.forEach((value) => {

                totalrdv += parseInt(value.rdv);
                totaldem += parseInt(value.dem);

            });

            return (totalrdv / totaldem).toFixed(2) == 'Infinity' ? '-' : (totalrdv / totaldem).toFixed(2);
        };

        let rdvvente = function(values, data, calcParams){

            let totalrdv = 0;
            let totalvente = 0;

            data.forEach((value) => {

                totalrdv += parseInt(value.rdv);
                totalvente += parseInt(value.vente);

            });

            return (totalrdv / totalvente).toFixed(2) == 'Infinity' ? '-' : (totalrdv / totalvente).toFixed(2);
        };

        let total = function(values, data, calcParams){

            return "Total";
        };

        let table = new Tabulator("#table", {
            data: dataTab,
            layout: "fitColumns",
            responsiveLayout: "hide",
            history: true,
            movableColumns: true,
            resizableRows: true,
            initialSort:[
                {column:"vente", dir:"asc"},
            ],
            columns: [
                {title: "Nom", field: "nom"},
                {title: "Numero", field: "numcomp", sorter:"number", bottomCalc:"sum"},
                {title: "RDV", field: "rdv", sorter:"number", bottomCalc:"sum"},
                {title: "DEM", field: "dem", sorter:"number", bottomCalc:"sum"},
                {title: "VENTE", field: "vente", sorter:"number", bottomCalc:"sum"},
                {title: "Ratio LIGNE/RDV", field: "lignerdv", sorter:"number", bottomCalc:lignerdv},
                {title: "Ratio RDV/DEM", field: "rdvdem", sorter:"number", bottomCalc:rrdvdem},
                {title: "Ratio RDV/VENTE", field: "rdvvente", sorter:"number", bottomCalc:rdvvente, bottomCalcParams:{
                    precision:2,
                }},
                {title: "Afficher", field: "afficher", formatter:"html", download:false,
                    cellClick:function(e, cell) {
                        cell.getRow().delete();
                    }},
            ]
        });
    })

}

function newDate(){
    let date= {}
    $('.datepicker').each((index, element) => {
        if(element.value != ''){
            date[element.name] = element.value
        }
    });
    if("datedebut" in date){
        if(!("datefin" in date)){
            date['datefin'] = date['datedebut']
        }
        refrechTab(date.datedebut.split('/').reverse().join('-'), date.datefin.split('/').reverse().join('-'))
    }else{
        console.log('Vous devez absolument choisir une date de debut')
    }
}
