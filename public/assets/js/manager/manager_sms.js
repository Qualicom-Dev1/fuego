$(document).ready(async () => {
    await actualiseAffichage()

    document.getElementById('btnChangeDate').onclick = actualiseAffichage

    $('.loadingbackground').hide()
})

async function actualiseAffichage() {
    $('.loadingbackground').show()

    const div_error = document.getElementById('general_error_message')
    div_error.style.display = 'none'
    div_error.innerText = ''
    div_error.classList.remove('error_message')
    div_error.classList.remove('info_message')

    try {
        await Promise.all([
            getSmsSent(),
            getSmsReceived()
        ])
    }
    catch(e) {
        div_error.innerText = e
        div_error.classList.add('error_message')
        div_error.style.display = 'block'
    }

    document.querySelectorAll('.btnDeleteSMS').forEach(btn => btn.onclick = deleteSMS)

    $('.loadingbackground').hide()
}

async function getSmsSent() {
    const dateDebut = document.querySelector('input[name=dateDebut]').value
    const dateFin = document.querySelector('input[name=dateFin]').value

    let infoObject = undefined
    let listeSMS = []

    const response = await fetch(`/manager/sms/sent?dateDebut=${dateDebut}&dateFin=${dateFin}`)
    if(!response.ok) {
        infoObject = {
            error : 'Une erreur est survenue lors de la récupération des sms envoyés, veuillez recommencer plus tard.'
        }
    }
    else {
        const data = await response.json()
        
        infoObject = data.infoObject
        listeSMS = data.smsSent
    }
    
    const content = new EJS({ url: '/public/views/partials/manager/tableauSMS.ejs'}).render({ infoObject, listeSMS, action : 'outgoing' })
    document.getElementById('div_smsSent').innerHTML = content

    document.getElementById('nbSentSMS').innerText = `(${listeSMS.length})`
}

async function getSmsReceived() {
    const dateDebut = document.querySelector('input[name=dateDebut]').value
    const dateFin = document.querySelector('input[name=dateFin]').value

    let infoObject = undefined
    let listeSMS = []

    const response = await fetch(`/manager/sms/received?dateDebut=${dateDebut}&dateFin=${dateFin}`)
    if(!response.ok) {
        infoObject = {
            error : 'Une erreur est survenue lors de la récupération des sms reçus, veuillez recommencer plus tard.'
        }
    }
    else {
        const data = await response.json()
        
        infoObject = data.infoObject
        listeSMS = data.smsReceived
    }
    
    const content = new EJS({ url: '/public/views/partials/manager/tableauSMS.ejs'}).render({ infoObject, listeSMS, action : 'incoming' })
    document.getElementById('div_smsReceived').innerHTML = content

    document.getElementById('nbReceivedSMS').innerText = `(${listeSMS.length})`
}

async function deleteSMS({ target }) {
    $('.loadingbackground').show()

    const div_error = document.getElementById('general_error_message')
    div_error.style.display = 'none'
    div_error.innerText = ''
    div_error.classList.remove('error_message')
    div_error.classList.remove('info_message')

    const tr = target.closest('tr')
    const id = tr.getAttribute('id')
    const action = tr.getAttribute('data-action')

    try {
        const option = {
            method : 'DELETE'
        }

        const response = await fetch(`/manager/sms/delete/${action}/${id}`, option)
        if(!response.ok) throw "Une erreur est survenue lors de la suppression, veuillez recommencer plus tard."

        const data = await response.json()

        if(data.infoObject && data.infoObject.error) throw data.infoObject.error
        if(data.infoObject && data.infoObject.message) {
            div_error.innerText = data.infoObject.message
            div_error.classList.add('info_message')
        }

        tr.parentNode.removeChild(tr)
    }
    catch(e) {
        div_error.innerText = e
        div_error.classList.add('error_message')
    }
    finally {
        div_error.style.display = 'block'
        $('.loadingbackground').hide()
    }
}