$(document).ready(() => {
    
    displayNbRdvs();

    $('.loadingbackground').hide()

    $(".daterdv_edit").attr('disabled', true)

    setClick()
    
    $('#rechercher_listerdv').keyup(function (e) {
        recherche($(e.currentTarget).val());
    });

    $('.selectdate_rdv :input').change(() => { 
        actualiserRdv();
    });
});

function reload_js(src) {
    $('script[src="' + src + '"]').remove();
    $('<script>').attr('src', src).appendTo('head');
}

function recherche(entree) {
    maRegExp = new RegExp(entree, 'gi');
    divs = $('.ctn_rdv_auj');
    for (i = 0; i < divs.length; i++) {
        if (maRegExp.test($('#' + divs[i].id + ' p:first').html()) || maRegExp.test($('#' + divs[i].id + ' p:last').html()) || maRegExp.test($('#' + divs[i].id + ' p:nth-child(3)').html())) { // test de la regexp
            divs[i].style.display = "block";
        } else {
            divs[i].style.display = "none";
        }
    }
}

function setClick(){
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
                                actualiserRdv()
                            })
                            $.modal.close()
                        })
                        $("input[name='daterepo'").datetimepicker({
                            language: 'fr-FR',
                            allowTimes: [
                                '9:00', '9:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'
                            ]
                        });
                    })
                    reload_js('/public/assets/js/modifier_client.js');
                })
                let info = new EJS({ url: '/public/views/partials/traitementclient/info_client'}).render({findedClient: data.findedRdv.Client})
                $('.ctn_infos_client').append(info)
        })
    })

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
}

function displayNbRdvs(){
        var nbrdvs=$('#displayrdv .ctn_rdv_auj ').length;
        $(".nbrdvs").text("RDV(s) : "+ nbrdvs );
        var rdvconf=$('#displayrdv .confirme ').length;
        $(".rdvconf").text(" Confirmés : "+ rdvconf );
}



function actualiserRdv(){
    let date= {}
        $('.selectdate_rdv :input').each((index, element) => {
            if(element.value != ''){
                date[element.name] = element.value
            }
        });
        // if("datedebut" in date){
        //     if(!("datefin" in date)){
        //         date['datefin'] = date['datedebut']
        //     }
            $.ajax({
                url: '/badging/manage',
                method: 'POST',
                data: date
             }).done((data) => {
                $('.rdvs').html('');

                if(data.errorObject && data.errorObject.error) {
                    console.log(data.errorObject.error)

                }
                else {
                    if(data.rdvs) {
                        for(const rdv of data.rdvs) {
                            const affichageRDV = new EJS({ url: '/public/views/partials/blocrdvoptions/bloc_rdv_jour'}).render({ rdv });
                            $('.rdvs').append(affichageRDV)
                            let option = new EJS({ url: '/public/views/partials/badging/option_rdv'}).render({ rdv });
                            $('.options_template:last').append(option)
                        }
                        setClick()
                    }
                    displayNbRdvs();
                }

                // if(data != 0){
                //     data.forEach(element => {
                //         let rdv = new EJS({ url: '/public/views/partials/blocrdvoptions/bloc_rdv_jour'}).render({rdv: element});
                //         $('.rdvs').append(rdv)
                //         let option = new EJS({ url: '/public/views/partials/badging/option_rdv'}).render({rdv: element});
                //         $('.options_template:last').append(option)
                //     });
                //     reload_js('/public/assets/js/bloc_rdv.js');

                //     setClick()
                // }
                // displayNbRdvs();
             });
        // }else{
        //     console.log('Vous devez absolument choisir une date de debut')
        // }
}

function setSelectChange(){
    $('.resultatrdv').click((element) => {
        if($('.resultatrdv option:selected').val() == 12 || $('.resultatrdv option:selected').val() == 13 || $('.resultatrdv option:selected').val() == 2){
            $('.date_repo').show()
        }else{
            $('.date_repo').hide()
        }
    })
}