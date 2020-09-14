$(document).ready(async () => {
    document.getElementById('btnChangeDate').onclick = createRapport

    $('.loadingbackground').hide()
})

function createRapport() {
    $('.loadingbackground').show()

    const dateDebut = document.querySelector('input[name=dateDebut]').value
    const dateFin = document.querySelector('input[name=dateFin]').value

    const div_error = document.getElementById('general_error_message')
    div_error.style.display = 'none'
    div_error.innerText = ''
    div_error.classList.remove('error_message')
    div_error.classList.remove('info_message')

    try {
        if(dateDebut === '') throw "Une date de début doit être sélectionnée."
        if(dateFin === '') throw "Une date de fin doit être sélectionnée."

        window.open(`/manager/rapportActivite/create?dateDebut=${dateDebut}&dateFin=${dateFin}`, '_blank')
    }
    catch(e) {
        div_error.innerText = e
        div_error.classList.add('error_message')
        div_error.style.display = 'block'
    }

    $('.loadingbackground').hide()
}