let table
let liste

$( document).ready(() => {

    document.getElementById('importlead').addEventListener('change', handleFile, false);
    $('.testimport').click((event) => {
        event.preventDefault()
        $.ajax({
            url: '/leads/import/test',
            method: 'POST',
            data : liste
        }).done((data) => {
            console.log(data)
        })
    })

})

function handleFile(e) {
    let files = e.target.files, f = files[0];
    let reader = new FileReader();
    reader.onload = function(e) {
        data = new Uint8Array(e.target.result);
        let workbook = XLSX.read(data, {type: 'array'});
        liste = XLSX.utils.sheet_to_json(workbook.Sheets['Sheet1'], {raw: true, defval:null})

        let head = liste[0]
        let headtab = []

        for (let [key, value] of Object.entries(head)) {
            console.log(`${key}: ${value}`);
            headtab.push({
                title:key,
                field:key,
                editor:false,
                headerSort:true,
            });
        }

        table = new Tabulator("#example-table", {
            data:liste,           //load row data from array
            pagination:"local",       //paginate the data
            paginationSize:25,         //allow 7 rows per page of data
            resizableRows:true,       //allow row order to be changed
            columns: headtab
        });
    };
    reader.readAsArrayBuffer(f);
  }