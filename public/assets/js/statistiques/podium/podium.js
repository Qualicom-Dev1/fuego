$('.loadingbackground').show()

$(document).ready(async () => {
    // charge le contenu
    await Promise.all([
        fillVentesJour(),
        fillVentesMois(),
        fillListing(undefined, true)
    ])

    document.querySelector('input[name=dateDebut]').onchange = fillListing
    document.querySelector('input[name=dateFin]').onchange = fillListing
    document.getElementById('ventes_custom_aggregated').onchange = fillListing
    document.getElementById('ventes_custom_all').onchange = fillListing

    $('.loadingbackground').hide()
})

// let modal = new EJS({ url: '/public/views/partials/modals/modal_compte_rendu'}).render(data)
// $('#modal_liste_RDV').append(modal)

async function fillVentesJour() {
    let content = ''

    try {
        const response = await fetch('/statistiques/podium/ventes/jour')
        if(!response.ok) throw "Une erreur est survenue lors de la récupération des ventes du jour. Veuillez recommencer plus tard."

        const data = await response.json()

        content = new EJS({ url: '/public/views/partials/statistiques/podium/ventes_jour.ejs'}).render({ infoObject : data.infoObject, ventes : data.ventes })
    }
    catch(e) {
        content = `<p class="error_message">${e}</p>`
    }
    finally {
        document.getElementById('content_ventes_jour').innerHTML = content
    }
}

async function fillVentesMois() {
    let content = ''

    try {
        const response = await fetch('/statistiques/podium/ventes/mois')
        if(!response.ok) throw "Une erreur est survenue lors de la récupération des ventes du mois. Veuillez recommencer plus tard."

        const data = await response.json()

        content = new EJS({ url: '/public/views/partials/statistiques/podium/ventes_mois.ejs'}).render({ infoObject : data.infoObject, ventes : data.ventes })

        if(!data.infoObject) {
            const nbVentes = data.ventes.reduce((accumulator, currentValue) => accumulator + currentValue.nbVentes, 0)
            document.getElementById('nb_ventes_mois').innerText = `SOIT ${nbVentes} VENTE${nbVentes > 1 ? 'S' : ''} SUR LE MOIS`
        }        
    }
    catch(e) {
        content = `<p class="error_message">${e}</p>`
    }
    finally {
        document.getElementById('content_ventes_mois').innerHTML = content
    }
}

async function fillListing(event, init = false) {
    if(!init) $('.loadingbackground').show()

    let content = ''
    let dateDebut = document.querySelector('input[name=dateDebut]').value
    let dateFin = document.querySelector('input[name=dateFin]').value
    const ventes_custom_type = document.querySelector('input[name=ventes_custom_type]:checked').value

    moment.locale('fr')

    try {
        let url = `/statistiques/podium/ventes/custom/${ventes_custom_type}`

        if(dateDebut !== '' && dateFin !== '') {
            dateDebut = moment(dateDebut, 'DD/MM/YYYY').format('YYYY-MM-DD')
            dateFin = moment(dateFin, 'DD/MM/YYYY').format('YYYY-MM-DD')
            url += `?dateDebut=${dateDebut}&dateFin=${dateFin}`
        }
        else if(dateDebut !== '') {
            dateDebut = moment(dateDebut, 'DD/MM/YYYY').format('YYYY-MM-DD')
            url += `?dateDebut=${dateDebut}`
        }
        else if(dateFin !== '') {
            dateFin = moment(dateFin, 'DD/MM/YYYY').format('YYYY-MM-DD')
            url += `?dateFin=${dateFin}`
        }

        if(moment().startOf('month').format('YYYY-MM-DD') !== dateDebut && moment().endOf('month').format('YYYY-MM-DD') !== dateFin) {
            document.getElementById('dates_listing_ventes').innerText = 'personnalisé'.toUpperCase()
        }
        else {
            document.getElementById('dates_listing_ventes').innerText = moment().format('MMMM YYYY').toUpperCase()
        }

        const response = await fetch(url)
        if(!response.ok) throw "Une erreur est survenue lors de la récupération du listing des ventes. Veuillez recommencer plus tard."

        const data = await response.json()

        content = new EJS({ url: '/public/views/partials/statistiques/podium/ventes_listing.ejs'}).render({ infoObject : data.infoObject, ventes : data.ventes, ventes_custom_type, moment })   
    }
    catch(e) {
        content = `<p class="error_message">${e}</p>`
    }
    finally {
        document.getElementById('content_listing_ventes').innerHTML = content

        $('.loadingbackground').hide()
    }
}