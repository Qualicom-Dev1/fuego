$(document).ready(async () => {
    await actualiserRdv()
    displayNbRdvs();

    $('.loadingbackground').hide()
    
    $('#rechercher_listerdv').keyup(function (e) {
        recherche($(e.currentTarget).val());
    });

    $('input[name=datedebut]').change(() => { 
        actualiserRdv();
    });
    $('input[name=datefin]').change(() => { 
        actualiserRdv();
    });

    $('.agency').click((event) => {
        $('.loadingbackground').show()
        let ids = []
        $('.ctn_rdv_auj').each((index , element) => {
            ids.push(element.id)
        })
        $.ajax({
            url: '/pdf/agency',
            data: {
                ids: ids,
                name: $('input[name=datedebut]').val().split('/').join('-')
            },
            method: 'POST'
        }).done((data) => {
            window.open('/../pdf/'+data,"_blank", null)
            $('.loadingbackground').hide()
        })
    })
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
                        
                        setCallandHang()
                        setSelectChange()
                        setEtatChange()

                        $('.save').click(async (event) => {
                            // traitement de la div d'informations
                            const divInfo = document.getElementById('div_info')
                            const divInfo_p = divInfo.querySelector('p')
                            divInfo.style.display = 'none'
                            divInfo_p.innerHTML = ''
                            divInfo_p.classList.remove('error_message')
                            divInfo_p.classList.remove('info_message')  
                            
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
                                sousstatut : $('.traitementactive').html() ? $('.traitementactive').html() : null,
                                commentaireHC : $('input[name=commentaireHC]').val(),
                                dateRappel : (document.querySelector("input[name=statut]:checked").getAttribute('id') === 'checkarepo') ? ($("input[name=daterappel]").val() !== '' ? $("input[name=daterappel]").val() : undefined) : undefined,
                                commentaireRappel : (document.querySelector("input[name=statut]:checked").getAttribute('id') === 'checkarepo') ? ($("input[name=commentaire_rappel]").val() !== '' ? $("input[name=commentaire_rappel]").val() : undefined) : undefined
                            }

                            try {
                                const url = '/manager/update/compte-rendu'
                                const option = {
                                    method : 'POST',
                                    headers : new Headers({
                                        "Content-type" : "application/json"
                                    }),
                                    body : JSON.stringify(compteRendu)
                                }

                                const response = await fetch(url, option)
                                if(!response.ok) throw "Une erreur est survenue, veuillez réessayer plus tard."

                                const data = await response.json()

                                if(data.infoObject) {
                                    if(data.infoObject.error) throw data.infoObject.error
                                    if(data.infoObject.message) divInfo_p.innerHTML = data.infoObject.message
                                }

                                actualiserRdv()
                                $.modal.close()
                            }
                            catch(e) {
                                divInfo_p.classList.add('error_message')
                                divInfo_p.innerHTML = e
                            }
                            finally {
                                divInfo.style.display = 'block'
                            }
        
                            // $.ajax({
                            //     url: '/manager/update/compte-rendu',
                            //     method: 'POST',
                            //     data: compteRendu
                            // }).done((data) => {
                            //     actualiserRdv()
                            // })
                            // $.modal.close()
                        })
                        $('.datetimepicker').datetimepicker({
                            language: 'fr-FR',
                            format:'d/m/Y H:i',
                            allowTimes: [
                                '9:00', '9:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'
                            ]
                        });
                        $('.supprimerrdv').click((e) => {
                            $.ajax({
                                url: '/manager/liste-rendez-vous/delete-rendez-vous',
                                method: 'POST',
                                data: {
                                    id: $(event.currentTarget).attr('id')
                                }
                                }).done((data) => {
                                    actualiserRdv()
                                })
                        })
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



async function actualiserRdv() {
    const div_error = document.getElementById('general_error_message')
    const div_rdvs = document.getElementsByClassName('rdvs')[0]

    $('.loadingbackground').show()
    div_error.innerText = ''
    div_error.style.display = 'none'
    div_rdvs.innerHTML = ''

    let datedebut = document.querySelector('input[name=datedebut]').value
    let datefin = document.querySelector('input[name=datefin]').value

    try {
        if(datedebut === '' && datefin === '') {
            throw "Une date de début ou une date de fin doit être choisie."
        }

        const url = '/manager/liste-rendez-vous'
        const option = {
            method : 'POST',
            headers : new Headers({
                "Content-type" : "application/json"
            }),
            body : JSON.stringify({ datedebut, datefin })
        }

        const response = await fetch(url, option)

        if(!response.ok) throw "Une erreur est survenue lors de la récupération des RDVs, veuillez réessayer plus tard."

        const data = await response.json()

        if(data.infoObject && data.infoObject.error) throw data.infoObject.error

        if(data.infoObject && data.infoObject.message) {
            div_rdvs.innerHTML = `<div class="col-md-12"><p>${data.infoObject.message}</p></div>`
        }
        else {
            for(const rdv of data.listeRdvs) {
                const blocRDV = new EJS({ url: '/public/views/partials/blocrdvoptions/bloc_rdv_jour'}).render({ rdv })
                $('.rdvs').append(blocRDV)
                const optionBlocRDV = new EJS({ url: '/public/views/partials/blocrdvoptions/option_bloc_rdv_liste'}).render({ rdv })
                $('.options_template:last').append(optionBlocRDV)
            }
            
            reload_js('/public/assets/js/bloc_rdv.js')
            setClick()
        }
    }
    catch(e) {
        div_error.innerText = e
        div_error.style.display = 'block'
    }

    displayNbRdvs()
    $('.loadingbackground').hide()
}

function setCallandHang(){
    $('.appel').click(element => {
        $.ajax({
            url: '/teleconseiller/call',
            method:'POST',
            data:{
                phone: $('input[name=tel'+$(element.currentTarget).attr('id').split('_')[1]+']').val()
            }
        })
    });
    $('.hangup').click(function(){
        $.ajax({
            url: '/teleconseiller/hangup',
            method:'POST',
        })
    });
}

function changeStatut({ target }) {
    if(target.getAttribute('id') === 'checkHorsCritere') {
        showHC('etat_HC')
        document.querySelector('.resultatrdv option[value="6"]').selected = true
        document.querySelector('.resultatrdv').click()
    }
    else if(document.getElementById('div_HC').parentNode.getAttribute('id') === 'etat_HC'){
        hideHC()
    }

    if(target.getAttribute('id') === 'checkarepo') {
        $('#div_rappel').show()
        document.querySelector('.resultatrdv option[value="6"]').selected = true
        document.querySelector('.resultatrdv').click()
    }
    else {
        $('#div_rappel').hide()
    }

    if(target.getAttribute('id') === 'checknonconfirme') {
        document.querySelector('.resultatrdv option[value=""]').selected = true
        document.querySelector('.resultatrdv').click()
    }
}

function setEtatChange() {
    const listeInputStatut = document.querySelectorAll('input[name="statut"]')
    if(listeInputStatut.length > 0) {
        for(const input of listeInputStatut) {
            input.onchange = changeStatut
        }
    }
}

function setSelectChange(){
    $('.resultatrdv').click((element) => {
        // si un compte rendu est donné, c'est que le RDV était forcément confirmé
        if(Number($('.resultatrdv option:selected').val()) !== 0 && Number($('.resultatrdv option:selected').val()) !== 6) {
            document.getElementById('checkconfirme').checked = true
            document.getElementById('checkconfirme').onchange({ target : document.getElementById('checkconfirme') })
        }

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