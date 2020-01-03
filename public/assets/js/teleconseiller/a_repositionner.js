$(document).ready(() => {
  
    $('.historique_ligne').click((event) => {
        window.location.replace('/teleconseiller/recherche/'+$(event.currentTarget).attr('id'))
    })

});
