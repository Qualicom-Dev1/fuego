$(document).ready(async () => {
    await actualiserRdv()
    displayNbRdvs();

    $('.loadingbackground').hide()

    document.querySelectorAll('.btnAgence').forEach(btn => btn.onclick = filterByAgency)
    
    $('#rechercher_listerdv').keyup(function (e) {
        recherche($(e.currentTarget).val());
    });

    $('input[name=datedebut]').change(() => { 
        actualiserRdv();
    });
    $('input[name=datefin]').change(() => { 
        actualiserRdv();
    });

    $('.agency').click(async (event) => {
        $('.loadingbackground').show()
        let ids = []
        $('.ctn_rdv_auj').each((index , element) => {
            ids.push(element.id)
        })

        try {
            const dateDebut = $('input[name=datedebut]').val()
            const dateFin = $('input[name=datefin]').val()

            if(dateDebut === '' || dateFin === '') throw "Les dates de début et de fin doivent être renseignées."

            // url de génration du pdf agency
            const urlAgencyGlobale = '/pdf/agency'
            // url pour obtenir les ids rdvs des agency par structure
            const urlAgenciesStructures = `/manager/liste-rendez-vous/agencies?dateDebut=${dateDebut.split('/').join('-')}&dateFin=${dateFin.split('/').join('-')}`

            const optionAgencyGlobale = {
                method : 'POST',
                headers : new Headers({
                    "Content-type" : "application/json"
                }),
                body : JSON.stringify({ids, dateDebut, dateFin, nom : 'globale'})
            }

            // liste des noms des pdfs effectivement créés
            const listeURLsPDFs = []

            // requête pour créer le pdf agency global et obtenir les infos agency par structure
            const [responseAgencyGlobale, responseAgenciesStructures] = await Promise.all([
                fetch(urlAgencyGlobale, optionAgencyGlobale),
                fetch(urlAgenciesStructures)
            ])

            // si l'envoie de requête ne fonctionne pas
            if(!responseAgencyGlobale.ok || !responseAgenciesStructures.ok) throw "Une erreur est survenue, veuillez réessayer plus tard."

            const dataAgencyGlobale = await responseAgencyGlobale.json()
            const dataAgenciesStructures = await responseAgenciesStructures.json()

            // si une erreur est survenue sur l'un ou l'autre on montre cette erreur
            if(dataAgencyGlobale.infos && dataAgencyGlobale.infos.error) throw dataAgencyGlobale.infos.error
            if(dataAgenciesStructures.infos && dataAgenciesStructures.infos.error) throw dataAgenciesStructures.infos.error

            // ajout du nom de fichier popur l'agency globale
            listeURLsPDFs.push(`/agency/${dataAgencyGlobale.idPDF}/${dataAgencyGlobale.pdf}`)

            const tabPromisesAgenciesStructures = []
            // génération du pdf pour les différentes structures
            for(const agency of dataAgenciesStructures.listeAgencies) {
                const option = {
                    method : 'POST',
                    headers : new Headers({
                        "Content-type" : "application/json"
                    }),
                    body : JSON.stringify({
                        ids : agency.listeIdsRdvs,
                        dateDebut, dateFin, 
                        nom : agency.structure
                    })
                }
                tabPromisesAgenciesStructures.push(fetch('/pdf/agency', option))
            }

            // attente du résultat des générations des pdfs par structure
            const tabResponsePromisesAgenciesStructures = await Promise.all(tabPromisesAgenciesStructures)
            // parcours des réponses pour la génration des pdfs par structure
            for(const response of tabResponsePromisesAgenciesStructures) {
                if(!response.ok) throw "Une erreur est survenue, veuillez réessayer plus tard."

                const data = await response.json()

                // si une erreur est survenue on lève une exception
                if(data.infos && data.infos.error) throw data.infos.error
                // si pas d'erreur on ajoute le nom du fichier à notre liste
                listeURLsPDFs.push(`/agency/${data.idPDF}/${data.pdf}`)
            }
            
            // ouverture des différents fichiers
            for(const url of listeURLsPDFs) {
                window.open(`/../pdf${url}`,"_blank", null)
            }
        }
        catch(e) {
            divInfo_p.classList.add('error_message')
            divInfo_p.innerHTML = e
            divInfo.style.display = 'block'
        }
        finally {
            $('.loadingbackground').hide()
        }
    })

    document.getElementById('isAffichageTuile').onchange = actualiserRdv
});

function reload_js(src) {
    $('script[src="' + src + '"]').remove();
    $('<script>').attr('src', src).appendTo('head');
}

function recherche(entree) {
    const maRegExp = new RegExp(entree, 'gi');
    const switchAffichage = document.getElementById('isAffichageTuile')
    const isAffichageTuile = switchAffichage ? switchAffichage.checked : true

    if(isAffichageTuile) {
        divs = $('.ctn_rdv_auj');
        for (i = 0; i < divs.length; i++) {
            if (maRegExp.test($('#' + divs[i].id + ' p:first').html()) || maRegExp.test($('#' + divs[i].id + ' p:last').html()) || maRegExp.test($('#' + divs[i].id + ' p:nth-child(3)').html())) { // test de la regexp
                divs[i].style.display = "block";
            } else {
                divs[i].style.display = "none";
            }
        }
    }
    else {
        const listeTr = document.querySelectorAll('#tableRDVs tr[data-agence]')
        if(listeTr.length) {
            for(const tr of listeTr) {
                if(maRegExp.test(tr.querySelector('.rechercheClient').innerText)) {
                    tr.style.display = 'table-row'
                }
                else {
                    tr.style.display = 'none'
                }
            }
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
                        $('.resultatrdv').click()

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
                                // commentaire: $("input[name=commentaire]").val(),
                                commentaire: $("textarea[name=commentaireRDV]").val(),
                                commentaireNew: $("input[name=commentairerepo]").val(),
                                datenew: $("input[name=daterepo]").val(),
                                rnew: $("input[name=r]").val(),
                                sousstatut : $('.traitementactive').html() ? $('.traitementactive').html() : null,
                                commentaireHC : $('input[name=commentaireHC]').val(),
                                dateRappel : (document.querySelector("input[name=statut]:checked").getAttribute('id') === 'checkarepo') ? ($("input[name=daterappel]").val() !== '' ? $("input[name=daterappel]").val() : undefined) : undefined,
                                commentaireRappel : (document.querySelector("input[name=statut]:checked").getAttribute('id') === 'checkarepo') ? ($("input[name=commentaire_rappel]").val() !== '' ? $("input[name=commentaire_rappel]").val() : undefined) : undefined,
                                montantVente : (Number($("select[name=idEtat]").children("option").filter(":selected").val()) === 1 && Number($('input[name=montantVente]').val()) > 0) ? $('input[name=montantVente]').val() : null
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
                                    if(data.infoObject.warning) alert(data.infoObject.warning)
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
    var nbrdvs=$('#displayrdv [data-agence]').length;
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
            // affichage tuiles
            if(document.getElementById('isAffichageTuile').checked) {
                for(const rdv of data.listeRdvs) {
                    const blocRDV = new EJS({ url: '/public/views/partials/rdvs/bloc_rdv_jour'}).render({ rdv })
                    $('.rdvs').append(blocRDV)
                    const optionBlocRDV = new EJS({ url: '/public/views/partials/rdvs/option_bloc_rdv_liste'}).render({ rdv })
                    $('.options_template:last').append(optionBlocRDV)
                }
            }
            // affichage tableau
            else {
                const tableau = new EJS({ url: '/public/views/partials/rdvs/tableau_listeRDVs'}).render({ listeRdvs : data.listeRdvs, isTMK : data.isTMK, option_bloc : 'option_bloc_rdv_liste' })
                div_rdvs.innerHTML = tableau
            }

            reload_js('/public/assets/js/bloc_rdv.js')
            setClick()
            filterByAgency({ target : document.querySelector('.btnAgence.active') })
        }
    }
    catch(e) {
        div_error.innerText = e
        div_error.style.display = 'block'
        console.error(e)
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

function filterByAgency({ target }) {
    // retrait et ajout des classes aux boutons
    document.querySelector('.btnAgence.active').classList.remove('active')
    target.classList.add('active')

    const switchAffichage = document.getElementById('isAffichageTuile')
    const isAffichageTuile = switchAffichage ? switchAffichage.checked : true

    const element = isAffichageTuile ? 'div' : 'tr'

    // affiche les éléments cachés
    document.querySelectorAll(`${element}.hidden[data-agence]`).forEach(elt => elt.classList.remove('hidden'))

    const agence = target.getAttribute('data-for')
    // si une agence est sélectionnée, n'afficher que les éléments de celle-ci
    if(agence) {
        document.querySelectorAll(`${element}[data-agence]`).forEach(elt => {
            // si l'élément ne contient pas le nom de l'agence on le cache
            if(elt.getAttribute('data-agence').indexOf(agence) < 0) {
                elt.classList.add('hidden')
            }
        })
    }
}