$(document).ready(async () => {    
    await actualiserRdv()
    
    $('input[name=rechercher_listeventes]').keyup(function (e) {
        recherche($(e.currentTarget).val());
    });
    
    document.getElementById('btnChangeDate').onclick = actualiserRdv

    $('.loadingbackground').hide()
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

function removeErrorMessage() {
    const div = document.getElementById('div_info')
    const p = div.getElementsByTagName('p')[0]

    div.style.display = 'none'
    p.innerText = ''
    p.classList.remove('error_message')
    p.classList.remove('info_message')
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

    // p.classList.add('info_message')
    p.innerText = message
    div.style.display = 'block'
}

async function actualiserRdv(){
    $('.loadingbackground').show()

    removeErrorMessage()
    document.getElementsByClassName('rdvs')[0].innerHTML = ''

    const inputDateDebut = document.querySelector('input[name=dateDebut]').value
    const inputDateFin = document.querySelector('input[name=dateFin]').value

    try {
        if(inputDateDebut === '' && inputDateFin === '') {
            throw "Une date de début ou une date de fin doit être choisie."
        }

        const url = '/commerciaux/ventes'
        const option = {
            method : 'POST',
            headers : new Headers({
                "Content-type" : "application/json"
            }),
            body : JSON.stringify({ 
                dateDebut : inputDateDebut, 
                dateFin : inputDateFin 
            })
        }

        const response = await fetch(url, option)
        if(!response.ok) throw generalError

        const { infos, rdvsVentes, dateDebut, dateFin } = await response.json()
        if(infos && infos.error) throw infos.error

        if(dateDebut) document.querySelector('input[name=dateDebut]').value = dateDebut
        if(dateFin) document.querySelector('input[name=dateFin]').value = dateFin
        if(infos && infos.message) setInformationMessage(infos.message)
        if(rdvsVentes) {
            for(const rdv of rdvsVentes) {
                const blocRDV = new EJS({ url: '/public/views/partials/rdvs/bloc_rdv_jour'}).render({ rdv })
                $('.rdvs').append(blocRDV)
                const optionBlocRDV = new EJS({ url: '/public/views/partials/rdvs/option_bloc_rdv_liste'}).render({ rdv })
                $('.options_template:last').append(optionBlocRDV)
            }

            reload_js('/public/assets/js/bloc_rdv.js')
            setClick()
        }
    }
    catch(e) {
        setErrorMessage(e)
        console.error(e)
    }
    finally {
        $('.loadingbackground').hide()
    }
}