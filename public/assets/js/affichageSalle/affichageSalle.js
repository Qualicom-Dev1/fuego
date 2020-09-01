$('.loadingbackground').show()

$(document).ready(async () => {
    // charge le contenu
    await Promise.all([
        getObjectif(),
        getListeVendeurs(),
        getListeTelepros(),
        getNbVentes(),
        getInfoMessage()
    ])

    $('.loadingbackground').hide()

    // actualisation de l'affichage toutes les minutes
    majAffichage(60000)
})

function majAffichage(interval) {
    setInterval(() => {
        getObjectif()
        getListeVendeurs()
        getListeTelepros()
        getNbVentes()
        getInfoMessage()
    }, interval)
}

async function getObjectif() {
    const div_objectif = document.getElementById('div_objectif')
    let objectif = '0'

    try {
        const response = await fetch('/ecran/objectif')
        if(!response.ok) throw `Erreur lors de la récupération de l'objectif (${response.statusText})`

        const data = await response.json()
        if(data.infoObject && data.infoObject.error) throw data.infoObject.error

        if(data.objectif) objectif = data.objectif
    }
    catch(e) {
        console.error(e)
        objectif = '?'
    }

    div_objectif.innerText = objectif
}

async function getListeVendeurs() {
    const div_vendeurs = document.getElementById('div_vendeurs')
    let content = undefined
    
    try {
        const response = await fetch('/ecran/rdv-vendeurs')
        if(!response.ok) throw `Erreur lors de la récupération de la liste des vendeurs (${response.statusText})`

        const data = await response.json()

        if(data.infoObject && data.infoObject.error) {
            content = `<p class='error_message'>${data.infoObject.error}</p>`
        }
        else {
            content = new EJS({ url : '/public/views/partials/affichageSalle/vendeurs.ejs' }).render({ infoObject : data.infoObject, listeVendeurs : data.listeVendeurs })
        }
    }
    catch(e) {
        console.error(e)
    }

    if(content) {
        div_vendeurs.innerHTML = content
    }
}

async function getListeTelepros() {
    const div_telepros = document.getElementById('div_telepros')
    let content = undefined

    try {
        const response = await fetch('/ecran/rdv-telepros')
        if(!response.ok) throw `Erreur lors de la récupération de la liste des telepros (${response.statusText})`

        const data = await response.json()

        if(data.infoObject && data.infoObject.error) {
            content = `<p class='error_message'>${data.infoObject.error}</p>`
        }
        else {
            content = new EJS({ url : '/public/views/partials/affichageSalle/telepros.ejs' }).render({ infoObject : data.infoObject, listeTelepros : data.listeTelepros })
        }
    }
    catch(e) {
        console.error(e)
    }

    if(content) {
        div_telepros.innerHTML = content
    }
}

async function getNbVentes() {
    const div_nbVentes = document.getElementById('nbVentes')
    let nbVentes = 0

    try {
        const response = await fetch('/ecran/nbVentes')
        if(!response.ok) throw `Erreur lors de la récupération du nombre de ventes (${response.statusText})`

        const data = await response.json()

        if(data.infoObject && data.infoObject.error) throw data.infoObject.error

        if(data.nbVentes) nbVentes = data.nbVentes
    }
    catch(e) {
        console.error(e)
        nbVentes = '?'
    }

    div_nbVentes.innerText = nbVentes
}

async function getInfoMessage() {
    const div_info = document.getElementById('div_info')
    let content = ''

    try {
        const response = await fetch('/ecran/infoTexte')
        if(!response.ok) throw `Erreur lors de la récupération du message d'info (${response.statusText})`

        const data = await response.json()

        if(data.infoObject) {
            if(data.infoObject.error) throw data.infoObject.error
            if(data.infoObject.message) content = data.infoObject.message
        }
        else {
            content = data.message.texte
        }
    }
    catch(e) {
        console.error(e)
    }

    div_info.innerHTML = content
}