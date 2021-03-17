let bdc = {
    client : undefined,
    listeProduits : undefined,
    infosPaiement : undefined
}

window.addEventListener('load', async () => {
    await Promise.all([
        initDocument(),
        loadContent()
    ])

    $('.loadingbackground').hide()
})

async function initDocument() {
    if(document.getElementById('carouselBDC')) {
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
        document.querySelectorAll('.btnCarouselPrev').forEach(btn => {
            btn.onclick = () => $('#carouselBDC').carousel('prev')
        })
        document.getElementById('validationClients').onclick = validationClients
        document.getElementById('validationCommande').onclick = validationCommande
        document.getElementById('validationPaiement').onclick = validationPaiement
        document.getElementById('validationBDC').onclick = validationBDC
    
        $('#modalInformation').modal({
            // fadeDuration: 100
            backdrop : 'static',
            keyboard : false,
            focus : true,
            show : true
        })

    }
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

async function loadContent() {
    const refIdClient = document.getElementById('refIdClient')
    if(refIdClient && refIdClient.value) {
        try {
            const response = await fetch(`/adv/bdc/clients/clientRDV/${refIdClient.value}`)
            if(!response.ok) throw generalError
            else if(response.status === 401) {
                alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
                location.reload()
            }
            else {
                const { infos, client } = await response.json()
                if(infos && infos.error) throw infos.error

                if(!client) throw "Une erreur est survenue lors du chargement des informations client."

                const selectIntituleClient = document.getElementById('selectIntituleClient')
                selectIntituleClient.querySelector(`option[value=${client.intitule}]`).checked = true
                selectIntituleClient.onchange()

                document.getElementById('nomClient1').value = client.nom ? client.nom : ''
                document.getElementById('prenomClient1').value = client.prenom ? client.prenom : ''
                document.getElementById('adresse').value = client.adresse ? client.adresse : ''
                document.getElementById('cp').value = client.cp ? client.cp : ''
                document.getElementById('ville').value = client.ville ? client.ville : ''
                document.getElementById('email').value = client.mail ? client.mail : ''
                document.getElementById('telephoneFixe').value = client.tel1 ? client.tel1 : ''
                document.getElementById('telephonePort').value = client.tel2 ? client.tel2 : ''
            }
        }
        catch(e) {
            setErrorMessage('generale', e)
        }
    }
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

// vérifie les infos clients et la fiche de renseignements techniques
// si les informations sont correctes passe à l'étape suivante
async function validationClients() {
    const formRenseignementsClients = document.getElementById('formRenseignementsClients')
    const formFicheRenseignementsTechniques = document.getElementById('formFicheRenseignementsTechniques')

    if(formRenseignementsClients.checkValidity() && formFicheRenseignementsTechniques.checkValidity()) {
        $('.loadingbackground').show()
        removeErrorMessage('formFicheRenseignementsTechniques')
        
        try {
            // récupération des infos du client
            bdc.client = {
                intitule : document.querySelector('#selectIntituleClient option:checked').value,
                nom1 : document.getElementById('nomClient1').value,
                prenom1 : document.getElementById('prenomClient1').value,
                nom2 : document.getElementById('nomClient2').value,
                prenom2 : document.getElementById('prenomClient2').value,
                adresse : document.getElementById('adresse').value,
                adresseComplement1 : document.getElementById('adresseComplement1').value,
                adresseComplement2 : document.getElementById('adresseComplement2').value,
                cp : document.getElementById('cp').value,
                ville : document.getElementById('ville').value,
                email : document.getElementById('email').value,
                telephonePort : document.getElementById('telephonePort').value,
                telephoneFixe : document.getElementById('telephoneFixe').value,
                // fiche infos techniques
                ficheRenseignementsTechniques : {
                    typeInstallationElectrique : document.querySelector('#typeInstallationElectrique option:checked').value,
                    puissanceKW : document.getElementById('puissanceKW').value,
                    puissanceA : document.getElementById('puissanceA').value,
                    anneeConstructionMaison : document.getElementById('anneeConstructionMaison').value,
                    dureeSupposeeConstructionMaison : document.getElementById('dureeSupposeeConstructionMaison').value,
                    dureeAcquisitionMaison : document.getElementById('dureeAcquisitionMaison').value,
                    typeResidence : document.querySelector('#typeResidence option:checked').value,
                    superficie : document.getElementById('superficie').value
                }
            }

            const url = `/adv/bdc/clients/checkClient`
            const option = {
                method : 'POST',
                headers : new Headers({
                    "Content-type" : "application/json"
                }),
                body : JSON.stringify(bdc.client)
            }

            const response = await fetch(url, option)
            if(!response.ok) throw generalError
            else if(response.status === 401) {
                alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
                location.reload()
            }
            else {
                const { infos } = await response.json()
                if(infos && infos.error) throw infos.error
            }

            $('#carouselBDC').carousel('next')
        }
        catch(e) {
            setErrorMessage('formFicheRenseignementsTechniques', e)
        }
        finally {
            $('.loadingbackground').hide()
        }
    }
    else {
        formRenseignementsClients.reportValidity()
        formFicheRenseignementsTechniques.reportValidity()
    }
}

async function validationCommande() {
    $('.loadingbackground').show()

    try {


        $('#carouselBDC').carousel('next')
    }
    catch(e) {

    }
    finally {
        $('.loadingbackground').hide()
    }
}

async function validationPaiement() {
    $('.loadingbackground').show()

    try {


        $('#carouselBDC').carousel('next')
    }
    catch(e) {

    }
    finally {
        $('.loadingbackground').hide()
    }
}

async function validationBDC() {
    $('.loadingbackground').show()

    try {


        
    }
    catch(e) {

    }
    finally {
        $('.loadingbackground').hide()
    }
}

function removeProduit(elt) {
    const tr = elt.closest('tr')
    if(tr) {
        const uid = tr.getAttribute('data-uid')

        if(uid) {
            const contenuGroupe = document.querySelector(`tr[data-for='${uid}']`)
            if(contenuGroupe) contenuGroupe.parentNode.removeChild(contenuGroupe)

            tr.parentNode.removeChild(tr)
        }
    }
}

function changeQuantiteProduit(input) {
    if(input.checkValidity()) {
        const tr = input.closest('tr')
        if(tr) {
            const quantite = Number(input.value)
            const [tdPrixUnitaireHT, tdPrixTotalHT] = tr.querySelectorAll('.produitPrix')
            const inputPrixUnitaireHT = tdPrixUnitaireHT.querySelector('input')

            const prixUnitaireHT = Number(inputPrixUnitaireHT ? inputPrixUnitaireHT.value : tdPrixUnitaireHT.innerText)            
            const totalHT = Number(Math.round(((quantite * prixUnitaireHT) + Number.EPSILON) * 100) / 100)

            // modification du prix unitaire
            tdPrixTotalHT.innerText = totalHT.toFixed(2)

            const into = tr.getAttribute('data-into')            
            // si into !== null c'est un groupement de produits, 
            // donc il faut calculer le prix du parent
            if(into) calculePrixGroupeProduits(into)
        }
    }
    else {
        input.reportValidity()
    }
}

function changePrixProduit(input) {
    if(input.checkValidity()) {
        const tr = input.closest('tr')
        if(tr) {
            const prixUnitaireHT = Number(input.value)
            const quantite = Number(tr.querySelector('.produitQuantite input').value)

            const totalHT = Number(Math.round(((quantite * prixUnitaireHT) + Number.EPSILON) * 100) / 100)

            tr.querySelectorAll('.produitPrix')[1].innerText = totalHT.toFixed(2)

            const into = tr.getAttribute('data-into')            
            // si into !== null c'est un groupement de produits, 
            // donc il faut calculer le prix du parent
            if(into) calculePrixGroupeProduits(into)
        }
    }
    else {
        input.reportValidity()
    }
}

function calculePrixGroupeProduits(uid) {
    if(uid) {        
        const tr = document.querySelector(`tr[data-uid="${uid}"]`)
        if(tr) {
            // vérifie que c'est un groupement
            if(!!Number(tr.getAttribute('data-isGroupe'))) {
                const listeTrProduits = Array.from(document.querySelectorAll(`tr[data-into="${uid}"]`))
                // prixUnitaireHT = somme prixTotalHT de chaque produit contenu
                if(listeTrProduits.length) {
                    const total = listeTrProduits.reduce((accumulator, tr) => {
                        const prixTotalHT = Number(tr.querySelectorAll('.produitPrix')[1].innerText)
                        return accumulator + prixTotalHT
                    }, 0)

                    // applique le prix des produits contenus dans le groupement
                    tr.querySelectorAll('.produitPrix')[0].innerText = total.toFixed(2)

                    // recalcule le total du groupement de produits
                    tr.querySelector('.produitQuantite input').onblur()
                }                
            }
        }
    }
}

function textarea_auto_height(elem) {
    elem.style.height = "1px";
    elem.style.height = `${elem.scrollHeight}px`;
}

function createID() {
    return Math.random().toString(36).substr(2, 9)
}