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