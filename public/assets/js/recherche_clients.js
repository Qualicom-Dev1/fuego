

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
        url: '/teleconseiller/rechercher-client',
        method: 'POST',
        data: recherche
      }).done((data) => {

        $('tbody').html('');

        data.findedClients.forEach((element) => {

            let nom = element.Historiques.length != 0 ? element.Historiques[0].Action.nom : '';
            let sousstatut = element.Historiques.length != 0 ? (element.Historiques[0].sousstatut == null ? '' : element.Historiques[0].sousstatut) : '';
            let date = element.Historiques.length != 0 ? element.Historiques[0].createdAt : '';

            $('tbody').append('<tr class="res_search" id="'+element.id+'"></tr>');
            $('tr:last').append('<td>'+element.nom+'</td>');
            $('tr:last').append('<td>'+element.prenom+'</td>');
            $('tr:last').append('<td>'+element.cp+'</td>');
            $('tr:last').append('<td>'+element.ville+'</td>');
            $('tr:last').append('<td>'+ nom +'</td>');
            $('tr:last').append('<td>'+ sousstatut +'</td>');
            $('tr:last').append('<td>'+ date +'</td>');

            $('.res_search:last').click((event) => {
              window.location.replace('/teleconseiller/recherche/'+$(event.currentTarget).attr('id'))
          })
        })

      })

    });    

});
