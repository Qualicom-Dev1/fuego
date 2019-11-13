$(document).ready(() => {

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
            window.open('../'+data,"_blank", null);
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
            window.open('../'+data,"_blank", null);
            $('.loadingbackground').hide()
        })
    })

});