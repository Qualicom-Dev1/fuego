$(document).ready(() => {
    $('.historique_ligne').click((event) => {
        window.location.replace('/telec/rappels/'+$(event.currentTarget).attr('id'))
    })
});
