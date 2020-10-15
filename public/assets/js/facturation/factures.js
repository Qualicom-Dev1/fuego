const BASE_URL = '/facturation/factures'
const SVGPLUS = 'fa-plus'
const SVGMOINS = 'fa-minus'
const CREATION = 'Création'
const MODIFICATION = 'Modification'
const DEFAULT_TVA = 20
const DEFAULT_REMISE = 0
const formAddModify = document.getElementById('formAddModify')

window.addEventListener('load', async () => {
    initDocument()
    await prestationOrdDevisSent()
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

    const liste_btnCancelFacture = document.querySelectorAll('.btnCancelFacture')
    if(liste_btnCancelFacture && liste_btnCancelFacture.length > 0) {
        for(const btn of liste_btnCancelFacture) {
            btn.onclick = cancelFacture
        }
    }

    document.getElementById('btnShowAddFacture').onclick = switchAddFacture

    document.getElementById('checkPrestationOrDevis').onchange = switchPrestationOrDevis
    document.getElementById('selectPrestationFacture').onchange = selectPrestation
    document.getElementById('selectDevisFacture').onchange = selectDevis

    document.getElementById('remiseFacture').onblur = calculPrix
    document.getElementById('tvaFacture').onblur = calculPrix
    document.getElementById('prixHTFacture').onblur = calculPrix
}

// création d'une facture depuis une prestation ou un devis déjà défnie
async function prestationOrdDevisSent() {
    const idPrestation = sessionStorage.getItem('idPrestation')
    const idDevis = sessionStorage.getItem('idDevis')
    sessionStorage.removeItem('idPrestation')
    sessionStorage.removeItem('idDevis')

    if(idPrestation !== null || idDevis !== null) {
        await showAddFacture()

        try {
            if(idPrestation) {
                document.getElementById('checkPrestationOrDevis').checked = false

                const option = document.querySelector(`#selectPrestationFacture option[value="select_prestation_${idPrestation}"]`)
                if(option === null) throw "Une erreur est survenue, la prestation demandée n'existe pas."

                option.selected = true
                await document.getElementById('selectPrestationFacture').onchange()
            }
            if(idDevis) {
                document.getElementById('checkPrestationOrDevis').checked = true

                const option = document.querySelector(`#selectDevisFacture option[value="select_prestation_${idDevis}"]`)
                if(option === null) throw "Une erreur est survenue, le devis demandé n'existe pas."

                option.selected = true
                await document.getElementById('selectDevisFacture').onchange()
            }

            document.getElementById('checkPrestationOrDevis').onchange()
        }
        catch(e) {
            fillTextInfos({ error : e })
        }     
    }
}

async function showAddFacture() {
    const boxCreateModify = document.querySelector('.boxCreateModify')
    const btnShowAddFacture = document.querySelector('#btnShowAddFacture svg')

    await loadContentBox()

    boxCreateModify.style.display = 'flex'
    btnShowAddFacture.classList.remove(SVGPLUS)
    btnShowAddFacture.classList.add(SVGMOINS) 
    btnShowAddFacture.setAttribute('title', "Fermer le volet de création")
}

function hideAddFacture() {
    const boxCreateModify = document.querySelector('.boxCreateModify')
    const btnShowAddFacture = document.querySelector('#btnShowAddFacture svg')

    boxCreateModify.style.display = 'none'
    btnShowAddFacture.classList.remove(SVGMOINS)
    btnShowAddFacture.classList.add(SVGPLUS)   
    btnShowAddFacture.setAttribute('title', "Ouvrir le volet de création")    
}

function switchAddFacture() {
    if(document.querySelector('.boxCreateModify').style.display === 'none') {
        showAddFacture()
    }
    else {
        hideAddFacture()
    }
}

async function loadContentBox() {
    $('.loadingbackground').show()

    await Promise.all([
        fillSelectPrestations(),
        fillSelectDevis()
    ])    

    $('.loadingbackground').hide()
}

function switchPrestationOrDevis() {
    resetProduits()
    resetContent()

    if(document.getElementById('checkPrestationOrDevis').checked) {
        document.getElementById('divSelectPrestationFacture').style.display = 'none'
        document.getElementById('divSelectDevisFacture').style.display = 'flex'
    }
    else {
        document.getElementById('divSelectDevisFacture').style.display = 'none'
        document.getElementById('divSelectPrestationFacture').style.display = 'flex'
    }
}

async function fillBoxAddModify(infos = undefined, facture = undefined) {
    try {
        initTextInfos()

        const title = document.querySelector('#formAddModify .title')

        if(infos) {
            fillTextInfos(infos)
        }

        if(facture) {
            title.innerText = MODIFICATION

            if(facture.id) document.getElementById('idFacture').value = facture.id            
            document.getElementById('tvaFacture').value = facture.tva ? facture.tva : DEFAULT_TVA
            document.getElementById('remiseFacture').value = facture.remise ? facture.remise : DEFAULT_REMISE
            document.getElementById('prixHTFacture').value = facture.prixHT
            document.getElementById('prixTTCFacture').value = facture.prixTTC

            // document.querySelector('#selectPrestationFacture option:enabled').selected = true
            // await document.getElementById('selectPrestationFacture').onchange()
        }
        
        if(!infos && !facture) {
            title.innerText = CREATION
        }
    }
    catch(e) {
        console.error(e)
        fillTextInfos({ error : "Une erreur est survenue, veuillez recommencer. Si l'erreur persiste contactez votre webmaster." })
    }

    $('.loadingbackground').hide()
}

function emptySelect(id) {
    const listeOptions = document.querySelectorAll(`#${id} > option:enabled`)
    if(listeOptions && listeOptions.length > 0) {
        for(const option of listeOptions) {
            option.parentNode.removeChild(option)
        }
    }

    document.querySelector(`#${id} option:disabled`).selected = true
}

async function fillSelectPrestations() {
    const selectPrestation = document.getElementById('selectPrestationFacture')
    emptySelect('selectPrestationFacture')

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

async function fillSelectDevis() {
    const selectDevis = document.getElementById('selectDevisFacture')
    emptySelect('selectDevisFacture')

    try {
        const response = await fetch(`/facturation/devis/all`)
        if(!response.ok) throw "Une erreur est survenue lors de la récupération des devis."
        else if(response.status === 401) {
            alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
            location.reload()
        }
        else {
            const { infos, devis } = await response.json()

            if(infos && infos.error) throw infos.error

            for(const devisSimple of devis) {
                const opt = document.createElement("option")
                opt.value = `select_devis_${devisSimple.id}`
                opt.text = `${devisSimple.refDevis} du ${moment(devisSimple.createdAt).format('DD/MM/YYYY')} - ${devisSimple.Prestation.ClientBusiness.nom} - ${devisSimple.prixTTC} €`

                selectDevis.append(opt)
            }
        }
    }
    catch(e) {
        fillBoxAddModify({ error : e })
    }
}

async function selectPrestation() {
    if(document.querySelector('#selectPrestationFacture option:checked:enabled') !== null) {
        $('.loadingbackground').show()

        try {
            const idPrestation = document.querySelector('#selectPrestationFacture option:checked:enabled').value.split('_')[2]

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
                        <td>${produit.designation}</td>
                        <td>${produit.quantite}</td>
                        <td>${produit.prixUnitaire}</td>
                        <td>${sousTotal.toFixed(2)}</td>
                    `

                    document.getElementById('listeProduits').appendChild(tr)                    
                }

                document.getElementById('estimationPrix').innerText = total.toFixed(2)
                document.getElementById('prixHTFacture').value = total.toFixed(2)
                calculPrix()
            }
        }
        catch(e) {
            fillTextInfos({ error : e })
        }        

        $('.loadingbackground').hide()
    }
}

async function selectDevis() {
    if(document.querySelector('#selectDevisFacture option:checked:enabled') !== null) {
        $('.loadingbackground').show()

        try {
            const idDevis = document.querySelector('#selectDevisFacture option:checked:enabled').value.split('_')[2]

            const response = await fetch(`/facturation/devis/${idDevis}`)
            if(!response.ok) throw "Une erreur est survenue lors de la récupération de la devis."
            else if(response.status === 401) {
                alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
                location.reload()
            }
            else {
                const { infos, devis } = await response.json()

                if(infos && infos.error) throw infos.error

                const option = document.querySelector(`#selectPrestationFacture option[value="select_prestation_${devis.Prestation.id}"]`)
                if(option === null) throw "Une erreur est survenue, la prestation correspondant à ce devis n'existe pas."

                option.selected = true
                await document.getElementById('selectPrestationFacture').onchange()

                document.getElementById('remiseFacture').value = devis.remise
                document.getElementById('tvaFacture').value = devis.tva
                document.getElementById('prixHTFacture').value = devis.prixHT
                document.getElementById('prixTTCFacture').value = devis.prixTTC
            }
        }
        catch(e) {
            fillTextInfos({ error : e })
        }        

        $('.loadingbackground').hide()
    }
}

function calculPrix() {
    const inputPrixHT = document.getElementById('prixHTFacture')
    const inputPrixTTC = document.getElementById('prixTTCFacture')
    const estimationPrix = document.getElementById('estimationPrix').innerText

    if(document.querySelector('#selectPrestationFacture option:checked:enabled') !== null && estimationPrix !== "") {
        let prixHT = 0
        let prixTTC = 0

        const remise = document.getElementById('remiseFacture').value !== "" ? document.getElementById('remiseFacture').value : DEFAULT_REMISE
        const tva = document.getElementById('tvaFacture').value !== "" ? document.getElementById('tvaFacture').value : DEFAULT_TVA        

        prixHT = Number(Math.round(((Number(estimationPrix) - Number(remise)) + Number.EPSILON) * 100) / 100)
        prixTTC = Number(Math.round(((Number(prixHT) * Number(1 + (Number(tva) / 100))) + Number.EPSILON) * 100) / 100)

        inputPrixHT.value = prixHT.toFixed(2)
        inputPrixTTC.value = prixTTC.toFixed(2)
    }
}

function resetProduits() {
    document.getElementById('listeProduits').innerHTML = ""
    document.getElementById('estimationPrix').innerText = ""
}

function resetContent() {
    document.querySelector('#selectPrestationFacture option:disabled').selected = true
    document.querySelector('#selectDevisFacture option:disabled').selected = true
    document.getElementById('remiseFacture').value = DEFAULT_REMISE
    document.getElementById('tvaFacture').value = DEFAULT_TVA
    document.getElementById('prixHTFacture').value = ""
    document.getElementById('prixTTCFacture').value = ""
}

function cancel() {
    isUpdated = false
    document.querySelector('#formAddModify .title').innerText = CREATION
    document.getElementById('idFacture').value = ''
    document.getElementById('checkPrestationOrDevis').checked = true
    document.getElementById('checkPrestationOrDevis').onchange()
    
    resetProduits()
    resetContent()
    
    initTextInfos()
}

async function addModify(event) {
    event.preventDefault()

    if(formAddModify.checkValidity()) {
        $('.loadingbackground').show()

        try {
            let url = BASE_URL
            let options = undefined

            // cas avec devis
            if(document.getElementById('checkPrestationOrDevis').checked) {
                if(document.querySelector('#selectDevisFacture option:checked:enabled') === null) throw "Un devis doit être sélectionné."
            }
            // cas sans devis
            else {
                if(document.querySelector('#selectPrestationFacture option:checked:enabled') === null) throw "Une prestation doit être sélectionnée."
            }

            
            if(Number(document.getElementById('prixHTFacture').value) === 0) throw "Le prix HT est incorrect."
            if(Number(document.getElementById('prixTTCFacture').value) === 0) throw "Le prix TTC est incorrect."          

            const tva = document.getElementById('tvaFacture').value
            const remise = document.getElementById('remiseFacture').value
            const prixHT = document.getElementById('prixHTFacture').value
            const prixTTC = document.getElementById('prixTTCFacture').value

            const params = {
                idPrestation : document.querySelector('#selectPrestationFacture option:checked:enabled').value.split('_')[2],
                tva : tva !== "" ? tva : undefined,
                remise : remise !== "" ? remise : undefined,
                prixHT,
                prixTTC
            }

            const id = document.getElementById('idFacture').value

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
        await showAddFacture()
        $('.loadingbackground').show()
        try {
            const response = await fetch(`${BASE_URL}/${id}`)
            if(!response.ok) throw "Une erreur est survenue lors de la récupération de la facture."
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

async function cancelFacture({ target }) {
    const id = target.closest('tr').getAttribute('id').split('_')[1]
    
    if(id && confirm("Êtes-vous sûr de vouloir annuler la facture?")) {
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
            if(!response.ok) throw "Une erreur est survenue lors de la demande d'annulation de la facture."
            else if(response.status === 401) {
                alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
                location.reload()
            }
            else {
                const { infos, facture } = await response.json()

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