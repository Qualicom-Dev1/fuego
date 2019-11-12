let geoCodeur;
let map;
let tracer;

let i = 0;
let address = document.getElementsByClassName('address');
let desc = document.getElementsByClassName('desc');

$(document).ready(() => {

    $.ajax({
        url : "/commerciaux/graphe",
        method: "POST"
    }).done(data => {
        
        let ctx = $("#graphe");
        let chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data[0],
                datasets: [{
                    label: "VENTE",
                    backgroundColor: 'rgb(243, 143, 104)',
                    borderColor: 'rgb(243, 143, 104)',
                    data: data[1],
                }]
            },
            options: {}
        });
    });

    boucleRdv()

    $('.loadingbackground').hide()
    
    $('.trois').click((event) => {
            $('.loadingbackground').show()
            $.ajax({
                url: '/pdf/fiche-client',
                method: 'POST',
                data: {
                    id: $(event.currentTarget).attr('id')
                }
            }).done((data) => {
                window.open('/../pdf/'+data,"_blank", null);
                $('.loadingbackground').hide()
            })
        })
    
        $('.agency_day').click((event) => {
            $('.loadingbackground').show()
            let ids = []
            $('.ctn_rdvs_auj .ctn_rdv_auj').each((index , element) => {
                ids.push(element.id)
            })
            $.ajax({
                url: '/pdf/agency',
                data: {
                    ids: ids,
                    name: $($('.ctn_rdvs_auj .ctn_rdv_auj h6')[0]).html().split(' ')[0].split('/').join('-')
                },
                method: 'POST'
            }).done((data) => {
                window.open('../'+data,"_blank", null);
                $('.loadingbackground').hide()
            })
        })
        
        $('.agency_tomorow').click((event) => {
            $('.loadingbackground').show()
            let ids = []
            $('.ctn_rdvs_lend .ctn_rdv_auj').each((index , element) => {
                ids.push(element.id)
            })
            $.ajax({
                url: '/pdf/agency',
                data: {
                    ids: ids,
                    name: $($('.ctn_rdvs_lend .ctn_rdv_auj h6')[0]).html().split(' ')[0].split('/').join('-')
                },
                method: 'POST'
            }).done((data) => {
                window.open('../'+data,"_blank", null);
                $('.loadingbackground').hide()
            })
        })
    
});

function initMap() {

    geoCodeur = new google.maps.Geocoder();

    let paris = {lat: 48.866667, lng: 2.333333};
    map = new google.maps.Map(document.getElementById("map_rdv"), {
        center: paris,
        zoom: 8,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });

    tracer = new Tracer(map);
}

function boucleRdv () {
    setTimeout(function () {
        codeAddress(address[i].value, desc[i].value);
        console.log(desc[i].value);
        i++;
        if (i < address.length) {
            boucleRdv();
        }
    }, 400)
}

function codeAddress(adresse, content) {
    geoCodeur.geocode({'address': adresse}, function (results, status) {
        if (status == 'OK') {
            tracer.addWaypoint(results[0].geometry.location, adresse);
            if(i == 1){
                map.setCenter(results[0].geometry.location)
            }
        }
    });
}