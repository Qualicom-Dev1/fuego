$(document).ready(() => {
    $('.historique_ligne').click((event) => {
        window.location.replace('/teleconseiller/rappels/'+$(event.currentTarget).attr('id'))
    })
});
