let geoCodeur;
let map;
let tracer;

let oRedIcone, oGreenIcone, oPurpleIcone, oYellowIcone, oValideIcone;

let i = 0;
let address = document.getElementsByClassName('address');
let desc = document.getElementsByClassName('desc');

async function getInfosGraphe() {
    try {
        const url = '/commerciaux/graphe'
        const option = {
            method : 'POST',
            headers : new Headers({
                "Content-type" : "application/json"
            })
        } 

        const response = await fetch(url, option)
        if(!response.ok) throw "Une erreur s'est produite, veuillez vérifier votre connexion internet ou recommencer plus tard."

        const { infos, infosGraphe } = await response.json()

        if(infos && infos.error) throw infos.error

        if(infosGraphe) {
            let ctx = $("#graphe")
            let chart = new Chart(ctx, {
                type: 'horizontalBar',
                data: {
                    labels: infosGraphe[0],
                    datasets: [{
                        label: "VENTES",
                        backgroundColor: 'rgb(243, 143, 104)',
                        borderColor: 'rgb(243, 143, 104)',
                        data: infosGraphe[1],
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

            })
        }
    }
    catch(e) {
        console.error(e)
        alert("Impossible de charger le graphe des ventes.")
    }
}

function setErrorMessage(message) {
    const div = document.getElementById('div_info')
    const p = div.getElementsByTagName('p')[0]

    p.classList.add('error_message')
    p.innerText = message
    div.style.display = 'block'
}

function setInformationMessage(message) {
    const div = document.getElementById('div_info')
    const p = div.getElementsByTagName('p')[0]

    p.classList.add('info_message')
    p.innerText = message
    div.style.display = 'block'
}

function removeErrorMessage() {
    const div = document.getElementById('div_info')
    const p = div.getElementsByTagName('p')[0]

    p.innerText = ''
    p.classList.remove('error_message')
    p.classList.remove('info_message')
    div.style.display = 'none'
}

$(document).ready(() => {
    getInfosGraphe()
    // $.ajax({
    //     url : "/commerciaux/graphe",
    //     method: "POST"
    // }).done(data => {
        
    //     let ctx = $("#graphe");
    //     let chart = new Chart(ctx, {
    //         type: 'horizontalBar',
    //         data: {
    //             labels: data[0],
    //             datasets: [{
    //                 label: "VENTE",
    //                 backgroundColor: 'rgb(243, 143, 104)',
    //                 borderColor: 'rgb(243, 143, 104)',
    //                 data: data[1],
    //             }]
    //         },
    //         options: {
    //             scales: {
    //                 xAxes: [{
    //                     ticks: {
    //                         beginAtZero: true,
    //                         precision:0
    //                     }
    //             }]
    //             }
    //         }

    //     });
    // });

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
                            $('.resultatrdv').click()

                            $('.save').click(async (event) => {
                                removeErrorMessage()

                                try {
                                    const compteRendu = {
                                        statut: $("input[name=statut]:checked").val(),
                                        idEtat: $("select[name=idEtat]").children("option").filter(":selected").val() == "" ? null : $("select[name=idEtat]").children("option").filter(":selected").val(),
                                        idRdv: $("input[name=idRdv]").val(),
                                        idVendeur: $("select[name=idVendeur]").children("option").filter(":selected").val() == "" ? null : $("select[name=idVendeur]").children("option").filter(":selected").val(),
                                        date: $("input[name=date]").val(),
                                        // commentaire: $("input[name=commentaire]").val(),
                                        commentaire: $("textarea[name=commentaireRDV]").val(),
                                        commentaireNew: $("input[name=commentairerepo]").val(),
                                        datenew: $("input[name=daterepo]").val(),
                                        rnew: $("input[name=r]").val(),
                                        sousstatut : $('.traitementactive').html() ? $('.traitementactive').html() : null,
                                        commentaireHC : $('input[name=commentaireHC]').val(),
                                        dateRappel : (document.querySelector("input[name=statut]:checked").getAttribute('id') === 'checkarepo') ? ($("input[name=daterappel]").val() !== '' ? $("input[name=daterappel]").val() : undefined) : undefined,
                                        commentaireRappel : (document.querySelector("input[name=statut]:checked").getAttribute('id') === 'checkarepo') ? ($("input[name=commentaire_rappel]").val() !== '' ? $("input[name=commentaire_rappel]").val() : undefined) : undefined,
                                        montantVente : $('input[name=montantVente]').val()
                                    }

                                    const url = '/manager/update/compte-rendu'
                                    const option = {
                                        method : 'POST',
                                        headers : new Headers({
                                            "Content-type" : "application/json"
                                        }),
                                        body : JSON.stringify(compteRendu)
                                    } 

                                    const response = await fetch(url, option)
                                    if(!response.ok) throw generalError

                                    const data = await response.json()
                                    if(data.infoObject) {
                                        if(data.infoObject.error) throw data.infoObject.error
                                        if(data.infoObject.message) setInformationMessage(data.infoObject.message)
                                    }

                                    $.modal.close()
                                    window.location.assign('/commerciaux/tableau-de-bord')
                                }
                                catch(e) {
                                    setErrorMessage(e)
                                }
                            })
                            $('.datetimepicker').datetimepicker({
                                language: 'fr-FR',
                                format:'d/m/Y H:i',
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

        if($('.resultatrdv option:selected').val() == 14) {
            showHC('compteRendu_HC')            
        }
        else if(document.getElementById('div_HC').parentNode.getAttribute('id') === 'compteRendu_HC') {
            hideHC()            
        }

        // VENTE
        if($('.resultatrdv option:selected').val() == 1) {
            $('#div_Vente').show()
        }
        else {
            $('#div_Vente').hide()
        }
    })
}

function switchSousStatut({ target }) {
    if(target.classList.contains('traitementactive')) {
        target.classList.remove('traitementactive')
    }
    else {
        const liste_actifs = document.querySelectorAll('.traitementactive')
        if(liste_actifs.length > 0) {
            for(const btn of liste_actifs) {
                btn.classList.remove('traitementactive')
            }
        }

        target.classList.add('traitementactive')
    }
}

function showHC(id) {
    $(`#${id}`).append($('#div_HC'))
    $('#div_HC').show()

    const liste_btn_traitement = document.getElementsByClassName('btn_traitement')
    if(liste_btn_traitement.length > 0) {
        for(const btn of liste_btn_traitement) {
            btn.onclick = switchSousStatut
        }
    }
}

function hideHC() {
    $('#div_HC').hide()
    $('.btn_traitement').removeClass('traitementactive');
    document.querySelector('#div_HC input[name=commentaireHC]').value = ''
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
                map.setCenter(results[0].geometry.location)
            }
        }
    });
}