$(document).ready(() => {
    $('.validsearch').click(() => {
        let recherche = {}
        $('.searchclient_ctn :input:not([type=select])').each((index, element) => {
            recherche[element.name] = element.value
        });
        $(".searchclient_ctn select").each((index ,element) => {
            recherche[element.name] = $(element).children("option").filter(":selected").val()
        });
        
        $.ajax({
        url: '/badging/rechercher-client',
        method: 'POST',
        data: recherche
        })
        .done((data) => {
            $('tbody').html('');
            console.log(data)

            if(data.error) {
                $('tbody').append(`<tr><td colspan='7'>${data.error_message}</td></tr>`)
            }
            else {
                data.clients.forEach((element) => {
                    let nom = element.Client.Historiques.length != 0 ? element.Client.Historiques[0].Action.nom : '';
                    let sousstatut = element.Client.Historiques.length != 0 ? (element.Client.Historiques[0].sousstatut == null ? '' : element.Client.Historiques[0].sousstatut) : '';
                    let date = element.Client.Historiques.length != 0 ? element.Client.Historiques[0].createdAt : '';

                    $('tbody').append('<tr class="res_search" id="'+element.Client.id+'"></tr>');
                    $('tr:last').append('<td>'+element.Client.nom+'</td>');
                    $('tr:last').append('<td>'+element.Client.prenom+'</td>');
                    $('tr:last').append('<td>'+element.Client.cp+'</td>');
                    $('tr:last').append('<td>'+element.Client.ville+'</td>');
                    $('tr:last').append('<td>'+ nom +'</td>');
                    $('tr:last').append('<td>'+ sousstatut +'</td>');
                    $('tr:last').append('<td>'+ date +'</td>');

                    $('.res_search:last').click((event) => {
                        window.location.replace('/badging/client/'+$(event.currentTarget).attr('id'))
                    })
                })
            }
        })
    });  
});
