$( document ).ready(function() {
    document.getElementById('btnValidate').onclick = validate

    validate()
})

async function validate() {
    $('.loadingbackground').show()
    const div_error = document.getElementById('error_message')
    div_error.style.display = 'none'
    div_error.innerText = ''

    try {
        const dateDebut = document.getElementById('dateDebut').value
        const dateFin = document.getElementById('dateFin').value

        if(dateDebut === '' || dateFin === '') throw "Les dates de début et de fin doivent être sélectionnées."

        const url = '/statistiques/commerciaux/get-tab-commerciaux'
        const option = {
            method : 'POST',
            headers : new Headers({
                "Content-type" : "application/json"
            }),
            body : JSON.stringify({ dateDebut, dateFin })
        }

        const response = await fetch(url, option)
        if(!response.ok) throw generalError

        const data = await response.json()

        if(data.infos && data.infos.error) throw data.infos.error        
        
        for(const elt of data.tableau) elt.afficher = 'Cacher'

        createTableau(data.tableau)
    }
    catch(e) {
        div_error.style.display = 'block'
        div_error.innerText = e
    }
    finally {
        $('.loadingbackground').hide()
    }
}

function createTableau(tableau) {
    // fonctions de calcul des colonnes
    const ratio_RDV_Dem = function(values, data, calcParams){
        let totalrdv = 0;
        let totaldem = 0;

        data.forEach((value) => {
            totalrdv += value.RDV;
            totaldem += value.DEM;
        });

        return (totalrdv / totaldem).toFixed(2);
    };

    const ratio_Dem_Vente = function(values, data, calcParams){
        let totalvente = 0;
        let totaldem = 0;

        data.forEach((value) => {
            totalvente += value.VENTE;
            totaldem += value.DEM;
        });

        return (totaldem / totalvente).toFixed(2);
    };

    const total = function(values, data, calcParams){
        return "Total";
    };

    // création du tableau
    const table = new Tabulator("#table", {
        data: tableau,
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
            {title: "Ratio RDV/DEM", field: "RDV/DEM", sorter:"number", bottomCalc:ratio_RDV_Dem},
            {title: "Ratio DEM/VENTE", field: "DEM/VENTE", sorter:"number", bottomCalc:ratio_Dem_Vente, bottomCalcParams:{
                precision:2,
            }},
            {title: "Afficher", field: "afficher", formatter:"html", download:false,
                cellClick:function(e, cell) {
                    cell.getRow().delete();
                }},
        ]
    });
}