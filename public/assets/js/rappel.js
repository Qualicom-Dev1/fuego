$(document).ready(() => {
    $('.historique_ligne').click((event) => {
        window.location.replace('/teleconseiller/rappels/'+$(event.currentTarget).attr('id'))
    })

    document.getElementById('btnFilterDate').onclick = filterDate
});

function filterDate() {
    const dateDebut = $('input[name=dateDebut]').val()
    const dateFin =  $('input[name=dateFin]').val()

    window.location.replace(`/teleconseiller/rappels?dateDebut=${dateDebut}&dateFin=${dateFin}`)
}
