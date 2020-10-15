$(document).ready(() => {
    $('.historique_ligne').click((event) => {
        window.location.replace('/teleconseiller/recherche/'+$(event.currentTarget).attr('id'))
    })

    document.getElementById('btnFilter').onclick = filter
});

function filter() {
    const dateDebut = $('input[name=dateDebut]').val()
    const dateFin =  $('input[name=dateFin]').val()
    const typeRecherche = document.querySelector('select[name=typeRecherche] option:checked').value
    const departementRecherche = document.querySelector('input[name=departementRecherche]').value

    window.location.replace(`/teleconseiller/a_repositionner?dateDebut=${dateDebut}&dateFin=${dateFin}&typeRecherche=${typeRecherche}&departementRecherche=${departementRecherche}`)
}
