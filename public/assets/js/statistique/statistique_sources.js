$( document ).ready(function() {
    refrechTab(new Date(new Date().getFullYear()-1, new Date().getMonth(), 1).toString("yyyy-MM-dd"), new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toString("yyyy-MM-dd"))

    $('.datepicker').change(() => {
        newDate()
    })

})

function refrechTab(datedebut, datefin){

    $.ajax({
        url: '/statistiques/sources/get-tab-sources',
        method: 'POST',
        data: {
            datedebut: datedebut,
            datefin: datefin
        }
    }).done((data) => {

        /*let rrdvdem = function(values, data, calcParams){

            let totalrdv = 0;
            let totaldem = 0;

            data.forEach((value) => {

                totalrdv += value.RDV;
                totaldem += value.DEM;

            });

            return (totalrdv / totaldem).toFixed(2);
        };

        let rdemvente = function(values, data, calcParams){

            let totalvente = 0;
            let totaldem = 0;

            data.forEach((value) => {

                totalvente += value.VENTE;
                totaldem += value.DEM;

            });

            return (totaldem / totalvente).toFixed(2);
        };

        let total = function(values, data, calcParams){

            return "Total";
        };*/

        console.log(data)

        let table = new Tabulator("#table", {
            data: data,
            layout: "fitColumns",
            responsiveLayout: "hide",
            history: true,
            dataTree:true,
            dataTreeStartExpanded:false,
            movableColumns: true,
            resizableRows: true,
            initialSort:[
                {column:"vente", dir:"asc"},
            ],
            columns: [                 //define the table columns
                {title: "Source", field: "source", align:"center", frozen:true, width:150},
                {title: "L. reçues", field: "lignerecus", align:"center", width:150},
                {title: "Lignes Traitées", field: "traiter", formatter: "textarea", align: "center", width:150},
                {title: "En attente Traitement", field: "vierge", formatter: "textarea", align: "center", width:150},
                {title: "Potentiel", field: "atraitement", formatter:"textarea", align:"center",width:150},
                {
                    title: "Traité",
                    align: "center",
                    columns: [
                        {title: "Erreur", field: "erreur", formatter: "textarea", align: "center", width:150},
                        {title: "NRP", field: "nrp", formatter: "textarea", align: "center", width:150},
                        {title: "INJOIGNABLE", field: "nrpnrp", formatter: "textarea", align: "center",width:150},
                        {title: "REFUS", field: "refus", formatter: "textarea", align: "center",width:150},
                        {title: "HC", field: "hc", formatter: "textarea", align: "center", width:150},
                        {title: "AUTRE", field: "autre", formatter: "textarea", align: "center", width:150},
                        {title: "RAF", field: "raf", formatter: "textarea", align: "center", width:150},
                        {title: "RDV", field: "rdv", formatter: "textarea", align: "center", width:150},
                    ],
                },
                {title: "RDV Brut", field: "rdvbrut", formatter:"textarea", align:"center", width:150},
                {title: "RDV Net", field: "rdvnet", formatter:"textarea", align:"center", width:150},
                {title: "DEM", field: "dem", formatter:"textarea", align:"center", width:150},
                {title: "VENTE", field: "vente", formatter:"textarea", align:"center", width:150},
                {title: "Prix", field: "prix", formatter:"textarea", align:"center", width:150},
                {title: "Afficher", field: "affiche", formatter:"html", download:false,
                    cellClick:function(e, cell) {
                        cell.getRow().delete();
                    }, width:150},
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

function ifContaint(container, containe){

    let containeLenght = containe.length
    let ite = 0

    containe.forEach(element => {
        if(_.includes(container, element)){
            ite++
        }
    })

    if(ite == containeLenght){
        return true
    }else{
        return false
    }

}