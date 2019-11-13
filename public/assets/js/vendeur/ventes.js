$(document).ready(() => {

    $('.loadingbackground').hide()

    setClick()
    
    $('input[name=rechercher_listeventes]').keyup(function (e) {
        recherche($(e.currentTarget).val());
    });

    $('.datepicker').change(() => {
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
                    $('.hover_btn3').click((event) => {
                        let compteRendu = {
                            statut: $("input[name=statut]:checked").val(),
                            idEtat: $("select[name=idEtat]").children("option").filter(":selected").val() == "" ? null : $("select[name=idEtat]").children("option").filter(":selected").val(),
                            idRdv: $("input[name=idRdv]").val(),
                            idVendeur: $("select[name=idVendeur]").children("option").filter(":selected").val() == "" ? null : $("select[name=idVendeur]").children("option").filter(":selected").val(),
                        }
    
                        $.ajax({
                            url: '/manager/update/compte-rendu',
                            method: 'POST',
                            data: compteRendu
                            }).done((data) => {
                                actualiserRdv();
                        })
                        $.modal.close()
                    })
                    $('#modal_liste_RDV').modal({
                        fadeDuration: 100
                    })
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

function actualiserRdv(){
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
            $.ajax({
                url: '/commerciaux/ventes',
                method: 'POST',
                data: date
             }).done((data) => {
                $('.rdvs').html('');
                if(data != 0){
                    data.forEach(element => {
                        let rdv = new EJS({ url: '/public/views/partials/blocrdvoptions/bloc_rdv_jour'}).render({rdv: element});
                        $('.rdvs').append(rdv)
                        let option = new EJS({ url: '/public/views/partials/blocrdvoptions/option_bloc_rdv_liste'}).render({rdv: element});
                        $('.options_template:last').append(option)
                    });
                    reload_js('/public/assets/js/bloc_rdv.js');
                    setClick()
                }
             });
        }else{
            console.log('Vous devez absolument choisir une date de debut')
        }
}