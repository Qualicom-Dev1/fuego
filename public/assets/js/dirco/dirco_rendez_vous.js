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
                        $('.save').click((event) => {
                            let compteRendu = {
                                statut: $("input[name=statut]:checked").val(),
                                idEtat: $("select[name=idEtat]").children("option").filter(":selected").val() == "" ? null : $("select[name=idEtat]").children("option").filter(":selected").val(),
                                idRdv: $("input[name=idRdv]").val(),
                                idVendeur: $("select[name=idVendeur]").children("option").filter(":selected").val() == "" ? null : $("select[name=idVendeur]").children("option").filter(":selected").val(),
                                date: $("input[name=date]").val(),
                                commentaire: $("input[name=commentaire]").val()
                            }
        
                            $.ajax({
                                url: '/manager/update/compte-rendu',
                                method: 'POST',
                                data: compteRendu
                                }).done((data) => {
                                    window.location.assign('/directeur/rendez-vous')
                            })
                            $.modal.close()
                        })
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