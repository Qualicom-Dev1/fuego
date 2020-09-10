$( document ).ready(function() {
    refrechTab(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toString("yyyy-MM-dd"), new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toString("yyyy-MM-dd"))

    $('.datepicker').change(() => {
        newDate()
    })

})

function refrechTab(datedebut, datefin){

    $.ajax({
        url: '/statistiques/commerciaux/get-tab-commerciaux',
        method: 'POST',
        data: {
            datedebut: datedebut,
            datefin: datefin
        }
    }).done((data) => {

        let rrdvdem = function(values, data, calcParams){

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
        };

        /*let finalData = []

        data.findedUsers.forEach((element, index) => {
            finalData[element.id] = _.map(element.Usersdependences, 'idUserInf')
        })

        let hierarchie = finalData[31]
        finalData.forEach((element, index) => {
            hierarchie[index]
        })*/


        /*let deleteIndex = []
        for(let i = 0 ; i < finalData.length; i++){
            let temps = finalData[i]
            delete finalData[i]
            finalData.forEach((element2, index2) => {
                if(ifContaint(element2, temps)){
                    finalData[index2] = _.concat(finalData[index2], [temps])
                    deleteIndex.push(i)
                }
            })
        }
        
        console.log(deleteIndex)
        console.log(finalData)

        deleteIndex.forEach((element) => {
            delete finalData[element]
        })*/
        
        //console.log(finalData)


        let table = new Tabulator("#table", {
            data: data.findedTableau,
            layout: "fitColumns",
            responsiveLayout: "hide",
            history: true,
            movableColumns: true,
            resizableRows: true,
            initialSort:[
                {column:"vente", dir:"asc"},
            ],
            columns: [
                {title: "Vendeur", field: "commercial", bottomCalc:total},
                {title: "RDV", field: "RDV", sorter:"number", bottomCalc:"sum"},
                {title: "dont Perso", field: "Perso", sorter:"number", bottomCalc:"sum"},
                {title: "DEM", field: "DEM", sorter:"number", bottomCalc:"sum"},
                {title: "VENTE", field: "VENTE", sorter:"number", bottomCalc:"sum"},
                {title: "Ratio RDV/DEM", field: "RDV/DEM", sorter:"number", bottomCalc:rrdvdem},
                {title: "Ratio DEM/VENTE", field: "DEM/VENTE", sorter:"number", bottomCalc:rdemvente, bottomCalcParams:{
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