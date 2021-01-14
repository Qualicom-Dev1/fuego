const BASE_URL = '/facturation/devis'
const SVGPLUS = 'fa-plus'
const SVGMOINS = 'fa-minus'
const CREATION = 'Création'
const MODIFICATION = 'Modification'
const DEFAULT_TVA = 20
const DEFAULT_REMISE = 0
const formAddModify = document.getElementById('formAddModify')

window.addEventListener('load', async () => {
    initDocument()
    await prestationSent()
    $('.loadingbackground').hide()
})

function initDocument() {    
    formAddModify.addEventListener('submit', addModify)
    document.getElementById('btnCancel').onclick = cancel
    
    const liste_btnModify = document.querySelectorAll('.btnModify')
    if(liste_btnModify && liste_btnModify.length > 0) {
        for(const btn of liste_btnModify) {
            btn.onclick = showElt
        }
    }

    const liste_btnToFacture = document.querySelectorAll('.btnToFacture')
    if(liste_btnToFacture && liste_btnToFacture.length > 0) {
        for(const btn of liste_btnToFacture) {
            btn.onclick = toFacture
        }
    }

    const liste_btnCancelDevis = document.querySelectorAll('.btnCancelDevis')
    if(liste_btnCancelDevis && liste_btnCancelDevis.length > 0) {
        for(const btn of liste_btnCancelDevis) {
            btn.onclick = cancelDevis
        }
    }

    const liste_btnRemove = document.querySelectorAll('.btnRemove')
    if(liste_btnRemove && liste_btnRemove.length > 0) {
        for(const btn of liste_btnRemove) {
            btn.onclick = remove
        }
    }

    document.getElementById('btnShowAddDevis').onclick = switchAddDevis

    document.getElementById('selectPrestationDevis').onchange = selectPrestation

    document.getElementById('remiseDevis').onblur = calculPrix
    document.getElementById('tvaDevis').onblur = calculPrix
    document.getElementById('prixHTDevis').onblur = calculPrix
}

// création d'un devis depuis une prestation déjà défnie
async function prestationSent() {
    const idPrestation = sessionStorage.getItem('idPrestation')
    sessionStorage.removeItem('idPrestation')

    if(idPrestation !== null) {
        await showAddDevis()

        const option = document.querySelector(`#selectPrestationDevis option[value="select_prestation_${idPrestation}"]`)

        if(option !== null) {
            option.selected = true
            await document.getElementById('selectPrestationDevis').onchange()
        }
        else {
            fillTextInfos({ error : "Une erreur est survenue, la prestation demandée n'existe pas." })
        }        
    }
}

async function showAddDevis() {
    const boxCreateModify = document.querySelector('.boxCreateModify')
    const btnShowAddDevis = document.querySelector('#btnShowAddDevis svg')

    await loadContentBox()

    boxCreateModify.style.display = 'flex'
    btnShowAddDevis.classList.remove(SVGPLUS)
    btnShowAddDevis.classList.add(SVGMOINS) 
    btnShowAddDevis.setAttribute('title', "Fermer le volet de création")
}

function hideAddDevis() {
    const boxCreateModify = document.querySelector('.boxCreateModify')
    const btnShowAddDevis = document.querySelector('#btnShowAddDevis svg')

    boxCreateModify.style.display = 'none'
    btnShowAddDevis.classList.remove(SVGMOINS)
    btnShowAddDevis.classList.add(SVGPLUS)   
    btnShowAddDevis.setAttribute('title', "Ouvrir le volet de création")    
}

function switchAddDevis() {
    if(document.querySelector('.boxCreateModify').style.display === 'none') {
        showAddDevis()
    }
    else {
        hideAddDevis()
    }
}

async function loadContentBox() {
    $('.loadingbackground').show()

    await Promise.all([
        fillSelectPrestations()
    ])    

    $('.loadingbackground').hide()
}

async function fillBoxAddModify(infos = undefined, devis = undefined) {
    try {
        initTextInfos()

        const title = document.querySelector('#formAddModify .title')

        if(infos) {
            fillTextInfos(infos)
        }

        if(devis) {
            title.innerText = MODIFICATION

            if(devis.id) document.getElementById('idDevis').value = devis.id            
            document.getElementById('tvaDevis').value = devis.tva ? devis.tva : DEFAULT_TVA
            document.getElementById('remiseDevis').value = devis.remise ? devis.remise : DEFAULT_REMISE
            document.getElementById('prixHTDevis').value = devis.prixHT
            document.getElementById('prixTTCDevis').value = devis.prixTTC

            document.querySelector('#selectPrestationDevis option:enabled').selected = true
            await document.getElementById('selectPrestationDevis').onchange()
        }
        
        if(!infos && !devis) {
            title.innerText = CREATION
        }
    }
    catch(e) {
        console.error(e)
        fillTextInfos({ error : "Une erreur est survenue, veuillez recommencer. Si l'erreur persiste contactez votre webmaster." })
    }

    $('.loadingbackground').hide()
}

function emptySelectPrestation() {
    const listeOptions = document.querySelectorAll(`#selectPrestationDevis > option:enabled`)
    if(listeOptions && listeOptions.length > 0) {
        for(const option of listeOptions) {
            option.parentNode.removeChild(option)
        }
    }

    document.querySelector(`#selectPrestationDevis option:disabled`).selected = true
}

async function fillSelectPrestations() {
    const selectPrestation = document.getElementById('selectPrestationDevis')
    emptySelectPrestation()

    try {
        const response = await fetch(`/facturation/prestations/all`)
        if(!response.ok) throw "Une erreur est survenue lors de la récupération des prestations."
        else if(response.status === 401) {
            alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
            location.reload()
        }
        else {
            const { infos, prestations } = await response.json()

            if(infos && infos.error) throw infos.error

            for(const prestation of prestations) {
                const opt = document.createElement("option")
                opt.value = `select_prestation_${prestation.id}`
                opt.text = `${moment(prestation.createdAt).format('DD/MM/YYYY')} - ${prestation.ClientBusiness.nom} (${prestation.Pole.nom})`

                selectPrestation.append(opt)
            }
        }
    }
    catch(e) {
        fillBoxAddModify({ error : e })
    }
}

async function selectPrestation() {
    if(document.querySelector('#selectPrestationDevis option:checked:enabled') !== null) {
        $('.loadingbackground').show()

        try {
            const idPrestation = document.querySelector('#selectPrestationDevis option:checked:enabled').value.split('_')[2]

            const response = await fetch(`/facturation/prestations/${idPrestation}`)
            if(!response.ok) throw "Une erreur est survenue lors de la récupération de la prestation."
            else if(response.status === 401) {
                alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
                location.reload()
            }
            else {
                const { infos, prestation } = await response.json()

                if(infos && infos.error) throw infos.error

                let total = 0
                document.getElementById('listeProduits').innerHTML = ""
                for(const produitsBusiness of prestation.ProduitsBusiness) {
                    const produit = produitsBusiness.ProduitBusiness_Prestation
                    
                    const sousTotal = Number(Math.round(((Number(produit.prixUnitaire) * Number(produit.quantite)) + Number.EPSILON) * 100) / 100)
                    total = Number(Math.round(((Number(total) + Number(sousTotal)) + Number.EPSILON) * 100) / 100)

                    const tr = document.createElement('tr')
                    tr.innerHTML = `
                        <td class="textFormated">${produit.designation}</td>
                        <td>${produit.quantite}</td>
                        <td>${produit.prixUnitaire}</td>
                        <td>${sousTotal.toFixed(2)}</td>
                    `

                    document.getElementById('listeProduits').appendChild(tr)                    
                }

                document.getElementById('estimationPrix').innerText = total.toFixed(2)
                document.getElementById('prixHTDevis').value = total.toFixed(2)
                calculPrix()
            }
        }
        catch(e) {
            fillTextInfos({ error : e })
        }        

        $('.loadingbackground').hide()
    }
}

function calculPrix() {
    const inputPrixHT = document.getElementById('prixHTDevis')
    const inputPrixTTC = document.getElementById('prixTTCDevis')
    const estimationPrix = document.getElementById('estimationPrix').innerText

    if(document.querySelector('#selectPrestationDevis option:checked:enabled') !== null && estimationPrix !== "") {
        let prixHT = 0
        let prixTTC = 0

        const remise = document.getElementById('remiseDevis').value !== "" ? document.getElementById('remiseDevis').value : DEFAULT_REMISE
        const tva = document.getElementById('tvaDevis').value !== "" ? document.getElementById('tvaDevis').value : DEFAULT_TVA        

        prixHT = Number(Math.round(((Number(estimationPrix) - Number(remise)) + Number.EPSILON) * 100) / 100)
        prixTTC = Number(Math.round(((Number(prixHT) * Number(1 + (Number(tva) / 100))) + Number.EPSILON) * 100) / 100)

        inputPrixHT.value = prixHT.toFixed(2)
        inputPrixTTC.value = prixTTC.toFixed(2)
    }
}

function cancel() {
    isUpdated = false
    document.querySelector('#formAddModify .title').innerText = CREATION
    document.getElementById('idDevis').value = ''
    document.querySelector('#selectPrestationDevis option:disabled').selected = true

    document.getElementById('listeProduits').innerHTML = ""
    document.getElementById('estimationPrix').innerText = ""
    document.getElementById('remiseDevis').value = DEFAULT_REMISE
    document.getElementById('tvaDevis').value = DEFAULT_TVA
    document.getElementById('prixHTDevis').value = ""
    document.getElementById('prixTTCDevis').value = ""
    initTextInfos()
}

async function addModify(event) {
    event.preventDefault()

    if(formAddModify.checkValidity()) {
        $('.loadingbackground').show()

        try {
            let url = BASE_URL
            let options = undefined

            if(document.querySelector('#selectPrestationDevis option:checked:enabled') === null) throw "Une prestation doit être sélectionnée."
            if(Number(document.getElementById('prixHTDevis').value) === 0) throw "Le prix HT est incorrect."
            if(Number(document.getElementById('prixTTCDevis').value) === 0) throw "Le prix TTC est incorrect."          

            const tva = document.getElementById('tvaDevis').value
            const remise = document.getElementById('remiseDevis').value
            const prixHT = document.getElementById('prixHTDevis').value
            const prixTTC = document.getElementById('prixTTCDevis').value

            const params = {
                idPrestation : document.querySelector('#selectPrestationDevis option:checked:enabled').value.split('_')[2],
                tva : tva !== "" ? tva : undefined,
                remise : remise !== "" ? remise : undefined,
                prixHT,
                prixTTC
            }

            const id = document.getElementById('idDevis').value

            // création
            if(id === '') {
                options = {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    method : 'POST',
                    body : JSON.stringify(params)
                }
            }
            // modification
            else {
                url += `/${id}`
                options = {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    method : 'PATCH',
                    body : JSON.stringify(params)
                }
            }

            const response = await fetch(url, options)
            if(!response.ok) throw "Une erreur est survenue lors de l'envoie du formulaire."
            else if(response.status === 401) {
                alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
                location.reload()
            }
            else {
                const { infos, devis } = await response.json()

                if(infos.message) {
                    isUpdated = true
                }

                fillBoxAddModify(infos)
            }
        }
        catch(e) {
            fillBoxAddModify({ error : e })
        }
    }
    else {
        formAddModify.reportValidity()
    }
}

async function showElt({ target }) {
    const id = target.closest('tr').getAttribute('id').split('_')[1]
    
    if(id) {        
        await showAddDevis()
        $('.loadingbackground').show()
        try {
            const response = await fetch(`${BASE_URL}/${id}`)
            if(!response.ok) throw "Une erreur est survenue lors de la récupération du devis."
            else if(response.status === 401) {
                alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
                location.reload()
            }
            else {
                const { infos, devis } = await response.json()

                fillBoxAddModify(infos, devis)
            }
        }
        catch(e) {
            fillBoxAddModify({ error : e })
        }
    }
}

async function cancelDevis({ target }) {
    const id = target.closest('tr').getAttribute('id').split('_')[1]
    
    if(id && confirm("Êtes-vous sûr de vouloir annuler le devis?")) {
        $('.loadingbackground').show()
        try {
            const url = `${BASE_URL}/${id}/cancel`
            const options = {
                headers: {
                    'Content-Type': 'application/json'
                },
                method : 'PATCH'
            }

            const response = await fetch(url, options)
            if(!response.ok) throw "Une erreur est survenue lors de la demande d'annulation du devis."
            else if(response.status === 401) {
                alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
                location.reload()
            }
            else {
                const { infos, devis } = await response.json()

                if(infos && infos.error) throw infos.error
                if(infos && infos.message) {
                    alert(`${infos.message} La page va s'actualiser dans quelques instants...`)
                    window.location.reload()
                }
            }
        }
        catch(e) {
            alert(e)
        }
        $('.loadingbackground').hide()
    }
}

async function remove({ target }) {
    const id = target.closest('tr').getAttribute('id').split('_')[1]
    
    if(id && confirm("Êtes-vous sûr de vouloir supprimer le devis?")) {
        $('.loadingbackground').show()
        try {
            const url = `${BASE_URL}/${id}`
            const options = {
                headers: {
                    'Content-Type': 'application/json'
                },
                method : 'DELETE'
            }

            const response = await fetch(url, options)
            if(!response.ok) throw "Une erreur est survenue lors de la demande de suppression du devis."
            else if(response.status === 401) {
                alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
                location.reload()
            }
            else {
                const { infos, devis } = await response.json()

                if(infos && infos.error) throw infos.error
                if(infos && infos.message) {
                    alert(`${infos.message} La page va s'actualiser dans quelques instants...`)
                    window.location.reload()
                }
            }
        }
        catch(e) {
            alert(e)
        }
        $('.loadingbackground').hide()
    }
}

function toFacture({ target }) {
    const id = target.closest('tr').getAttribute('id').split('_')[1]
    sessionStorage.setItem('idDevis', id)

    window.location = '/facturation/factures'
}