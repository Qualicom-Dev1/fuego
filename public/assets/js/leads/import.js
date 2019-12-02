let table
let data
let columns = []
let colDefs = []
let newHead = {}

$( document).ready(() => {

    document.getElementById('importlead').addEventListener('change', handleFile, false);

    $('.testimport').click((event) => {
        event.preventDefault()
        let data = table.getData()
        data = data.filter(value => Object.keys(value).length !== 0)

        colDefs = table.getColumns(true)

        columns.forEach( (e, key) => {
            if(e == ""){
                colDefs[key].delete();
                data.forEach( (value, key2) => {
                    delete data[key2][colDefs[key].getField()];
                })
            }else{
                newHead[colDefs[key].getDefinition().field] = e
                colDefs[key].getDefinition().field = e
            }
        })
        columns = $.grep(columns, function(val){
            if( val == '' || val == NaN || val == undefined || val == null ){
                return false;
            }
            return true;
        });

        data.forEach((element, index) => {
            data[index] = renameKeys(newHead,element)
        })
        let occurence = Math.trunc(data.length / 100)

        console.log(data) 
        console.log(occurence) 
        console.log(data.length) 

        if(occurence != 0){
            importJS(0, 100, data)
        }else{
            importJS(0, data.length % 100, data)
        }
    })

})

function handleFile(e) {
    let liste
    let files = e.target.files, f = files[0];
    let reader = new FileReader();
    reader.onload = function(e) {
        fichier = new Uint8Array(e.target.result);
        let workbook = XLSX.read(fichier, {type: 'array'});
        liste = XLSX.utils.sheet_to_json(workbook.Sheets['Sheet1'], {raw: true, defval:null})

        let head = liste[0]
        let headtab = []

        for (let [key, value] of Object.entries(head)) {
            headtab.push({
                title:key,
                field:key,
                editor:false,
                headerSort:false,
                columns:[
                    {
                        title: creatSelect(key),
                        field:key,
                        headerSort:false
                    },
                ],
            });
        }

        table = new Tabulator("#example-table", {
            data:liste,
            pagination:"local",
            paginationSize:25,
            resizableRows:true,
            columns: headtab,
            tableBuilt:() => {
                $.each($(".column_bdd option:selected"), (index, element) => {
                    columns.push($(element).val())
                })
                $(".column_bdd").change((index, element) => {
                    columns = []
                    $.each($(".column_bdd option:selected"), (index, element) => {
                        columns.push($(element).val())
                    })
                });

            }
        });
    };
    reader.readAsArrayBuffer(f);
  }

function creatSelect(label){

    let select = '<select class="browser-default column_bdd">';
     select += '<option value="" selected >Non importé</option>';
    for (var prop in tabBDD) {
        if(tabBDD[prop] == label){
            select = select.replace('selected', '');
            select += '<option value="'+prop+'" selected>'+ prop +'</option>';
        }else{
            select += '<option value="'+prop+'">'+ prop +'</option>';
        }
    }

    select += '</select>';



    return select;

}

let tabBDD = {

    'id_hitech': 'id',
    'source': 'x_lead_source',
    'type': 'x_type_campagne',
    'agent_recherche': 'x_agent_rech',
    'createdAt': 'x_lignes_lead',
    'nom': 'x_nom_p1',
    'prenom': 'x_prenom_p1',
    'tel1' : 'phone',
    'tel2' : 'mobile',
    'tel3' : 'x_other_phone',
    'adresse' : 'street',
    'cp' : 'zip',
    'ville' : 'city',
    'dep' : 'x_dpt',
    'mail' : 'email_from',
    'commentaire' : 'x_comment_geomarketing',
    'statut' : '',
    'age1' : '',
    'age2' : '',
    'relation' : '',
    'pro1' : '',
    'pro2' : '',
    'pdetail1' : '',
    'pdetail2' : '',
    'fioul' : 'x_qualif_fioul',
    'gaz' : 'x_qualif_gaz',
    'elec' : 'x_qualif_elec',
    'autre' : 'x_qualif_autre',
    'pv' : 'x_qualif_solut_pv_annee'
}

function importJS (start, end, data){

    $('#progress').css('width', (end/data.length*100)+'%');
    console.log(start, '-' , end);

    if(end === data.length) {

        let liste = data.slice(start, end)

        $.ajax({
            url: '/leads/import/import',
            method: 'POST',
            data : {
                liste : JSON.stringify(liste)
            }
        }).done( (res) => {
            console.log(res)
        })

    }else{

        let liste = data.slice(start, end)
        console.log(liste)
        $.ajax({
            url: '/leads/import/import',
            method: 'POST',
            data : {
                liste : JSON.stringify(liste)
            }
        }).done( (res) => {
            console.log(res)
            start += 100
            if(end+100 > data.length){
                end += data.length % 100;
            }else {
                end += 100
            }
            importJS(start, end, data);
        })
    }
}

renameKeys = (keysMap, obj) => {
    return Object
        .keys(obj)
        .reduce((acc, key) => {
            const renamedObject = {
                [keysMap[key] || key]: obj[key]
            }
            return {
                ...acc,
                ...renamedObject
            }
        }, {})
}