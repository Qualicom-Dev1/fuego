$('.loadingbackground').show()

$(document).ready(async () => {
    document.getElementById('btnAddMessage').onclick = addMessage

    await getInfoMessage()

    $('.loadingbackground').hide()
})

async function getInfoMessage() {
    const currentMessage = document.getElementById('currentMessages')
    let content = ''

    try {
        const response = await fetch('/ecran/infoTexte')
        if(!response.ok) throw `Erreur lors de la récupération du message d'info (${response.statusText})`

        const data = await response.json()

        if(data.infoObject) {
            if(data.infoObject.error) throw data.infoObject.error
            if(data.infoObject.message) content = `<p>${data.infoObject.message}</p>`
        }
        else if(data.messages) {
            content = '<ul>'
            for(const message of data.messages) {
                content += `<li>${message.Structure.nom} - ${moment(message.createdAt).format('DD/MM/YYYY HH:mm')} - ${message.texte}</li>`
            }         
            content += '</ul>'   
        }
    }
    catch(e) {
        console.error(e)
    }

    currentMessage.innerHTML = content
}

async function addMessage() {
    $('.loadingbackground').show()

    const div_infoMessage = document.getElementById('infoMessage')
    const idStructure = document.getElementById('idStructure').value
    const message = document.getElementById('message').value    

    try {
        div_infoMessage.innerText = ''
        div_infoMessage.classList.remove('info_message')
        div_infoMessage.classList.remove('error_message')

        if(message === '') throw "Le message ne peut pas être vide."

        const url = '/ecran/infoTexte'
        const option = {
            method : 'POST',
            headers : new Headers({
                "Content-type" : "application/json"
            }),
            body : JSON.stringify({
                idStructure,
                message 
            })
        }

        const response = await fetch(url, option)
        if(!response.ok) throw `Une erreur est survenue lors de l'envoie du message (${response.statusText}).`

        const data = await response.json()

        if(data.infoObject) {
            if(data.infoObject.error) throw data.infoObject.error
            if(data.infoObject.message) {
                div_infoMessage.classList.add('info_message')
                div_infoMessage.innerText = data.infoObject.message
                await getInfoMessage()
            }
        }

        document.getElementById('message').value = ''
    }
    catch(e) {
        div_infoMessage.classList.add('error_message')
        div_infoMessage.innerText = e
    }

    $('.loadingbackground').hide()
}