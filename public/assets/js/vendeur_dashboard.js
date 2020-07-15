let geoCodeur;
let map;
let tracer;

let oRedIcone, oGreenIcone, oPurpleIcone, oYellowIcone, oValideIcone;

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
            type: 'horizontalBar',
            data: {
                labels: data[0],
                datasets: [{
                    label: "VENTE",
                    backgroundColor: 'rgb(243, 143, 104)',
                    borderColor: 'rgb(243, 143, 104)',
                    data: data[1],
                }]
            },
            options: {
                scales: {
                    xAxes: [{
                        ticks: {
                            beginAtZero: true,
                            precision:0
                        }
                }]
                }
            }

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

        $('.un').click((event) => {
            $.ajax({
                url: '/manager/compte-rendu',
                method: 'POST',
                data: {
                    id: $(event.currentTarget).attr('id')
                }
                }).done((data) => {
                    $('#modal_liste_RDV').html('');
                    let modal = new EJS({ url: '/public/views/partials/modals/modal_compte_rendu'}).render(data)
                    $('#modal_liste_RDV').append(modal).ready(() => {
                        $('#modal_liste_RDV').modal({
                            fadeDuration: 100
                        }).ready(() => {
                            setSelectChange()

                            $('.save').click((event) => {
                                // let compteRendu = {
                                //     statut: $("input[name=statut]:checked").val(),
                                //     idEtat: $("select[name=idEtat]").children("option").filter(":selected").val() == "" ? null : $("select[name=idEtat]").children("option").filter(":selected").val(),
                                //     idRdv: $("input[name=idRdv]").val(),
                                //     idVendeur: $("select[name=idVendeur]").children("option").filter(":selected").val() == "" ? null : $("select[name=idVendeur]").children("option").filter(":selected").val(),
                                //     date: $("input[name=date]").val(),
                                //     commentaire: $("input[name=commentaire]").val()
                                // }
                                let compteRendu = {
                                    statut: $("input[name=statut]:checked").val(),
                                    idEtat: $("select[name=idEtat]").children("option").filter(":selected").val() == "" ? null : $("select[name=idEtat]").children("option").filter(":selected").val(),
                                    idRdv: $("input[name=idRdv]").val(),
                                    idVendeur: $("select[name=idVendeur]").children("option").filter(":selected").val() == "" ? null : $("select[name=idVendeur]").children("option").filter(":selected").val(),
                                    date: $("input[name=date]").val(),
                                    commentaire: $("input[name=commentaire]").val(),
                                    commentaireNew: $("input[name=commentairerepo]").val(),
                                    datenew: $("input[name=daterepo]").val(),
                                    rnew: $("input[name=r]").val(),
                                }
            
                                $.ajax({
                                    url: '/manager/update/compte-rendu',
                                    method: 'POST',
                                    data: compteRendu
                                    }).done((data) => {
                                        window.location.assign('/commerciaux/tableau-de-bord')
                                })
                                $.modal.close()
                            })
                            $('.datetimepicker').datetimepicker({
                                language: 'fr-FR',
                                allowTimes: [
                                    '9:00', '9:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'
                                ]
                            });
                        })
                    })
                    let info = new EJS({ url: '/public/views/partials/traitementclient/info_client'}).render({findedClient: data.findedRdv.Client})
                    $('.ctn_infos_client').append(info)
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
                window.open('/../'+data,"_blank", null);
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
                window.open('/../'+data,"_blank", null);
                $('.loadingbackground').hide()
            })
        })
    
});

function setSelectChange(){
    $('.resultatrdv').click((element) => {
        if($('.resultatrdv option:selected').val() == 12 || $('.resultatrdv option:selected').val() == 13 || $('.resultatrdv option:selected').val() == 2){
            $('.date_repo').show()
        }else{
            $('.date_repo').hide()
        }
    })
}

function initMap() {

    geoCodeur = new google.maps.Geocoder();


    oRedIcone = new google.maps.MarkerImage(
        'http://maps.google.com/mapfiles/marker.png',
        new google.maps.Size(20, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(20, 34),
        new google.maps.Point(0, 0)
    );
    // création de l'icone dans limite
    oGreenIcone = new google.maps.MarkerImage(
        'http://maps.google.com/mapfiles/marker_green.png',
        new google.maps.Size(20, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34)
    );
    
    oPurpleIcone = new google.maps.MarkerImage(
        'http://maps.google.com/mapfiles/marker_purple.png',
        new google.maps.Size(20, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34)
    );
    
    oYellowIcone = new google.maps.MarkerImage(
        'http://maps.google.com/mapfiles/marker_yellow.png',
        new google.maps.Size(20, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34)
    );
    
    oValideIcone = new google.maps.MarkerImage(
        'http://maps.google.com/mapfiles/marker_grey.png',
        new google.maps.Size(20, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34)
    );
    
    let paris = {lat: 48.866667, lng: 2.333333};
    map = new google.maps.Map(document.getElementById("map_rdv"), {
        center: paris,
        zoom: 8,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });

    geoCodeur.geocode({'address': $('#adresse_commercial').val()}, function (results, status) {
        if (status == 'OK') {

            let cercle = new google.maps.Circle({
                'center': results[0].geometry.location,
                'map': map,
                'radius': 100000,
                'fillColor': '#FFF',
                'fillOpacity': .5,
                'strokeWeight': 1,
                'strokeColor': '#888',
                'clickable': false,
                'editable': false,
                'strokeOpacity': 1.0
            });
            map.setCenter(results[0].geometry.location)
        }
    });

    tracer = new Tracer(map);
}

function boucleRdv () {
    setTimeout(function () {
        let heure = desc[i].value.substr(-5, 2)

        let icone

        if (heure < 14) {
            icone = oGreenIcone
        } else if (heure < 17) {
            icone = oYellowIcone
        } else {
            icone = oRedIcone
        }

        codeAddress(address[i].value, desc[i].value, icone);
        i++;
        if (i < address.length) {
            boucleRdv();
        }
    }, 400)
}

function codeAddress(adresse, content, icone) {
    geoCodeur.geocode({'address': adresse}, function (results, status) {
        if (status == 'OK') {
            tracer.addWaypoint(results[0].geometry.location, adresse, icone);
            if(i == 1 && ($('#adresse_commercial').val() == '' || $('#adresse_commercial').val() == ' ')){
                console.log('ok')
                map.setCenter(results[0].geometry.location)
            }
        }
    });
}