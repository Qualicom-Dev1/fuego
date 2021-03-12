window.addEventListener('load', async () => {
    await initDocument()
    $('.loadingbackground').hide()
})

async function initDocument() {
    // initialisation du caroussel
    $('#carouselBDC').carousel({
        interval : false,
        keyboard : false,
        ride : false,
        wrap : false,
        touch : false,
        cycle : false
    })

    // initialisation des listeners
    document.getElementById('selectIntituleClient').onchange = changeSelectIntituleClient
    document.getElementById('selectIntituleClient').onblur = changeSelectIntituleClient
}

function setErrorMessage(element, message) {
    if(element === undefined || !['generale', 'formRenseignementsClients', 'formFicheRenseignementsTechniques', 'formProduits', 'formPose', 'formPaiement', 'formAcceptation'].includes(element)) element = 'generale'

    const div = document.getElementById(`div_info_${element}`)
    const p = div.getElementsByTagName('p')[0]

    p.classList.add('error_message')
    p.innerText = message
    div.style.display = 'block'
}

function setInformationMessage(element, message) {
    if(element === undefined || !['generale', 'formRenseignementsClients', 'formFicheRenseignementsTechniques', 'formProduits', 'formPose', 'formPaiement', 'formAcceptation'].includes(element)) element = 'generale'

    const div = document.getElementById(`div_info_${element}`)
    const p = div.getElementsByTagName('p')[0]

    p.classList.add('info_message')
    p.innerText = message
    div.style.display = 'block'
}

function removeErrorMessage(element) {
    if(element === undefined || !['generale', 'formRenseignementsClients', 'formFicheRenseignementsTechniques', 'formProduits', 'formPose', 'formPaiement', 'formAcceptation'].includes(element)) element = 'generale'

    const div = document.getElementById(`div_info_${element}`)
    const p = div.getElementsByTagName('p')[0]

    p.innerText = ''
    p.classList.remove('error_message')
    p.classList.remove('info_message')
    div.style.display = 'none'
}

function changeSelectIntituleClient() {
    const divClient2 = document.getElementById('divClient2')

    if(!!Number(document.querySelector('#selectIntituleClient option:checked').getAttribute('data-multi'))) {
        divClient2.style.display = 'flex'
    }
    else {
        divClient2.style.display = 'none'
        divClient2.querySelectorAll('input').forEach(input => input.value = '')
    }
}