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

    $('.loadingbackground').hide()

        var nbrdvs=$('#ctn_rdvs_auj .ctn_rdv_auj ').length;
        $(".nbrdvs").text("RDV(s) : "+ nbrdvs );
    
        var nbrdvs=$('#ctn_rdvs_lend .ctn_rdv_auj ').length;
        $(".nbrdvslend").text("RDV(s) : "+ nbrdvs );
    
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
                            // let compteRendu = {
                            //     statut: $("input[name=statut]:checked").val(),
                            //     idEtat: $("select[name=idEtat]").children("option").filter(":selected").val() == "" ? null : $("select[name=idEtat]").children("option").filter(":selected").val(),
                            //     idRdv: $("input[name=idRdv]").val(),
                            //     idVendeur: $("select[name=idVendeur]").children("option").filter(":selected").val() == "" ? null : $("select[name=idVendeur]").children("option").filter(":selected").val(),
                            //     date: $("input[name=date]").val(),
                            //     commentaire: $("input[name=commentaire]").val()
                            // }
        
                            // $.ajax({
                            //     url: '/manager/update/compte-rendu',
                            //     method: 'POST',
                            //     data: compteRendu
                            //     }).done((data) => {
                            //         window.location.assign('/directeur/rendez-vous')
                            // })
                            // $.modal.close()

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
                                window.location.assign('/directeur/rendez-vous')
                            }
                            catch(e) {
                                setErrorMessage(e)
                            }
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
        // $.ajax({
        //     url: '/pdf/agency',
        //     data: {
        //         ids: ids,
        //         name: $($('.ctn_rdvs_auj .ctn_rdv_auj h6')[0]).html().split(' ')[0].split('/').join('-')
        //     },
        //     method: 'POST'
        // }).done((data) => {
        //     window.open('/pdf/'+data,"_blank", null);
        //     $('.loadingbackground').hide()
        // })

        openAgency(ids, moment().format('DD/MM/YYYY'))
    })
    
    $('.agency_tomorow').click((event) => {
        $('.loadingbackground').show()
        let ids = []
        $('.ctn_rdvs_lend .ctn_rdv_auj').each((index , element) => {
            ids.push(element.id)
        })
        // $.ajax({
        //     url: '/pdf/agency',
        //     data: {
        //         ids: ids,
        //         name: $($('.ctn_rdvs_lend .ctn_rdv_auj h6')[0]).html().split(' ')[0].split('/').join('-')
        //     },
        //     method: 'POST'
        // }).done((data) => {
        //     window.open('/pdf/'+data,"_blank", null);
        //     $('.loadingbackground').hide()
        // })

        openAgency(ids, moment().add(1, 'days').format('DD/MM/YYYY'))
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

async function openAgency(ids, date) {
    try {
        // url de génration du pdf agency
        const urlAgencyGlobale = '/pdf/agency'
        const optionAgencyGlobale = {
            method : 'POST',
            headers : new Headers({
                "Content-type" : "application/json"
            }),
            body : JSON.stringify({ids, dateDebut : date, dateFin : date, nom : ''})
        }
        
        const responseAgencyGlobale = await fetch(urlAgencyGlobale, optionAgencyGlobale)

        // si l'envoie de requête ne fonctionne pas
        if(!responseAgencyGlobale.ok) throw "Une erreur est survenue, veuillez réessayer plus tard."

        const dataAgencyGlobale = await responseAgencyGlobale.json()

        // si une erreur est survenue sur l'un ou l'autre on montre cette erreur
        if(dataAgencyGlobale.infos && dataAgencyGlobale.infos.error) throw dataAgencyGlobale.infos.error
        
        // ouverture du nom de fichier pour l'agency globale
        window.open(`/../pdf/agency/${dataAgencyGlobale.idPDF}/${dataAgencyGlobale.pdf}`,"_blank", null)
    }
    catch(e) {
        divInfo_p.classList.add('error_message')
        divInfo_p.innerHTML = e
        divInfo.style.display = 'block'
    }
    finally {
        $('.loadingbackground').hide()
    }
}