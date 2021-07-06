const formAddModifyProduit = document.getElementById('formAddModifyProduit')
let isProduitUpdated = false

async function initBoxProduit() {
    document.getElementById('btnShowAddProduit').onclick = switchAddProduit
    formAddModifyProduit.addEventListener('submit', addModifyProduit)
    document.getElementById('btnCancelProduit').onclick = cancelProduit
    document.getElementById('btnProduitAddToListeCategories').onclick = () => addSelectedCategorie(formAddModifyProduit)

    // ajoute les listeners de calcule de prix
    document.getElementById('isFromTTCProduit').onchange = switchIsFromTTCProduit
    document.getElementById('tauxTVAProduit').onblur = inputPrixProduit
    document.getElementById('prixUnitaireHTProduit').onblur = inputPrixProduit
    document.getElementById('prixUnitaireTTCProduit').onblur = inputPrixProduit
}

function initTextInfosProduit() {
    const textInfos = formAddModifyProduit.querySelector('.boxInfos p')
    textInfos.style.display = 'none'
    textInfos.classList.remove('error_message')
    textInfos.classList.remove('info_message')
    textInfos.innerText = ''
}

async function fillTextInfosProduit(infos) {
    const textInfos = formAddModifyProduit.querySelector('.boxInfos p')

    if(infos) {
        if(infos.error) {
            textInfos.innerText = infos.error
            textInfos.classList.add('error_message')
        }
        else if(infos.message) {
            textInfos.innerText = infos.message
            textInfos.classList.add('info_message')
            if(isProduitUpdated) {
                $('.loadingbackground').show()
                await refreshPageContent()
                $('.loadingbackground').hide()
                await filterByAgency({ target : document.querySelector('.btnAgence.active') })
            }
        }

        textInfos.style.display = 'flex'
    }
}

function switchAddProduit() {
    if(formAddModifyProduit.parentNode.style.display === 'none') {        
        hideAddCategorie()
        hideAddGroupeProduits()
        showAddProduit()
    }
    else {
        hideAddProduit()        
    }
}

async function showAddProduit() {
    const boxCreateModify = formAddModifyProduit.parentNode
    const btnShowAddCategorie = document.querySelector('#btnShowAddProduit svg')

    try {
        await loadContentBoxProduit()
    }
    catch(e) {
        fillBoxAddModifyProduit({ error : e})
    }

    boxCreateModify.style.display = 'flex'
    btnShowAddCategorie.classList.remove(SVGPLUS)
    btnShowAddCategorie.classList.add(SVGMOINS)
}

function hideAddProduit() {
    const boxCreateModify = formAddModifyProduit.parentNode
    const btnShowAddCategorie = document.querySelector('#btnShowAddProduit svg')

    boxCreateModify.style.display = 'none'
    btnShowAddCategorie.classList.remove(SVGMOINS)
    btnShowAddCategorie.classList.add(SVGPLUS)

    cancelProduit()
}

async function fillBoxAddModifyProduit(infos = undefined, produit = undefined) {
    initTextInfosProduit()

    const title = formAddModifyProduit.querySelector('.title')

    if(infos) await fillTextInfosProduit(infos)

    if(produit) {
        $('.loadingbackground').show()
        emptyBoxProduit()
        title.innerText = `${MODIFICATION} Produit`

        document.getElementById('idProduit').value = produit.id
        document.getElementById('nomProduit').value = produit.nom
        document.getElementById('refProduit').value = produit.ref ? produit.ref : ''
        document.getElementById('designationProduit').value = produit.designation
        textarea_auto_height(document.getElementById('designationProduit'))
        document.getElementById('descriptionProduit').value = produit.description
        textarea_auto_height(document.getElementById('descriptionProduit'))
        document.getElementById('caracteristiqueProduit').value = produit.caracteristique ? produit.caracteristique : ''
        document.getElementById('uniteCaracteristiqueProduit').value = produit.uniteCaracteristique ? produit.uniteCaracteristique : ''
        document.getElementById('tauxTVAProduit').value = produit.tauxTVA
        document.getElementById('prixUnitaireHTProduit').value = produit.prixUnitaireHT
        document.getElementById('prixUnitaireTTCProduit').value = produit.prixUnitaireTTC
        document.getElementById('montantTVAProduit').value = produit.montantTVA

        if(produit.categories.length) {
            for(const categorie of produit.categories) {
                selectCategorie(formAddModifyProduit, categorie.id)
            }
        }
    }

    if(!infos && !produit) title.innerText = `${CREATION} Produit`
}

function emptyBoxProduit() {
    document.getElementById('idProduit').value = ''
    document.getElementById('nomProduit').value = ''
    document.getElementById('refProduit').value = ''
    document.getElementById('designationProduit').value = ''
    textarea_auto_height(document.getElementById('designationProduit'))
    document.getElementById('descriptionProduit').value = ''
    textarea_auto_height(document.getElementById('descriptionProduit'))
    document.getElementById('caracteristiqueProduit').value = ''
    document.getElementById('uniteCaracteristiqueProduit').value = ''
    const isFromTTCProduit = document.getElementById('isFromTTCProduit')
    isFromTTCProduit.checked = false
    isFromTTCProduit.onchange()
    document.getElementById('tauxTVAProduit').value = ''
    document.getElementById('prixUnitaireHTProduit').value = ''
    document.getElementById('prixUnitaireTTCProduit').value = ''
    document.getElementById('montantTVAProduit').value = ''

    formAddModifyProduit.querySelector('.selectCategories').querySelector('option:disabled').selected = true
    formAddModifyProduit.querySelector('.listeCategories').innerHTML = ''
}

function cancelProduit() {
    isProduitUpdated = false
    formAddModifyProduit.querySelector('.title').innerText = `${CREATION} Produit`
    emptyBoxProduit()
    initTextInfosProduit()
}

async function addModifyProduit(event) {
    event.preventDefault()
    
    if(formAddModifyProduit.checkValidity()) {
        $('.loadingbackground').show()

        try {
            let url = `${BASE_URL}/produits/`
            let option = undefined

            const idStructure = document.querySelector('.btnAgence.active').getAttribute('data-id')
            if(idStructure === '') throw "Une agence doit être sélectionnée."

            const params = {
                idStructure : Number(idStructure),                
                nom : document.getElementById('nomProduit').value,
                ref : document.getElementById('refProduit').value,
                designation : document.getElementById('designationProduit').value,
                description : document.getElementById('descriptionProduit').value,
                caracteristique : document.getElementById('caracteristiqueProduit').value,
                uniteCaracteristique : document.getElementById('uniteCaracteristiqueProduit').value,
                tauxTVA : document.getElementById('tauxTVAProduit').value,
                prixUnitaireHT : document.getElementById('prixUnitaireHTProduit').value,
                prixUnitaireTTC : document.getElementById('prixUnitaireTTCProduit').value,
                montantTVA : document.getElementById('montantTVAProduit').value,
            }

            const liListeCategories = Array.from(formAddModifyProduit.querySelector('.listeCategories').querySelectorAll('li'))
            // ajout des ids catégories s'il y en a
            if(liListeCategories.length) params.listeIdsCategories = (liListeCategories.map(li => li.getAttribute('id').split('_')[2])).toString()

            const id = document.getElementById('idProduit').value

            // création
            if(id === '') {
                option = {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    method : 'POST',
                    body : JSON.stringify(params)
                }
            }
            // modification
            else {
                url += id
                option = {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    method : 'PATCH',
                    body : JSON.stringify(params)
                }
            }

            const response = await fetch(url, option)
            if(!response.ok) throw generalError
            else if(response.status === 401) {
                alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
                location.reload()
            }
            else {
                const { infos, produit } = await response.json()

                if(infos && infos.message) isProduitUpdated = true
                // cancelProduit()
                await fillBoxAddModifyProduit(infos, produit)
            }
        }
        catch(e) {
            fillBoxAddModifyProduit({ error : e })
            console.log(e)
        }
        finally {
            $('.loadingbackground').hide()
        }
    }
    else {
        formAddModifyProduit.reportValidity()
    }
}

async function showProduit(id) {    
    await showAddProduit()
    $('.loadingbackground').show()

    try {
        const response = await fetch(`${BASE_URL}/produits/produits/${id}`)
        if(!response.ok) throw generalError
        else if(response.status === 401) {
            alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
            location.reload()
        }
        else {
            const { infos, produit } = await response.json()

            if(infos && infos.message) isProduitUpdated = true
            fillBoxAddModifyProduit(infos, produit)
        }
    }
    catch(e) {
        fillBoxAddModifyProduit({ error : e })
    }
    finally {
        $('.loadingbackground').hide()
    }
}

async function loadContentBoxProduit() {
    $('.loadingbackground').show()

    try {
        await fillSelectCategories(formAddModifyProduit)
    }
    catch(e) {
        fillBoxAddModifyProduit({ error : e })
    }
    finally {
        $('.loadingbackground').hide()
    }
}

function switchIsFromTTCProduit() {
    // changement du texte affiché
    const isFromTTCProduit = document.getElementById('isFromTTCProduit').checked
    const labelContent = document.getElementById('labelContentIsFromTTCProduit')

    labelContent.innerText = isFromTTCProduit ? 'TTC' : 'HT'

    // modification des inputs
    const prixUnitaireHTProduit = document.getElementById('prixUnitaireHTProduit')
    const prixUnitaireTTCProduit = document.getElementById('prixUnitaireTTCProduit')

    if(isFromTTCProduit) {
        prixUnitaireHTProduit.disabled = true
        prixUnitaireHTProduit.classList.add('inputDisabled')
        prixUnitaireTTCProduit.disabled = false
        prixUnitaireTTCProduit.classList.remove('inputDisabled')
    }
    else {
        prixUnitaireTTCProduit.disabled = true
        prixUnitaireTTCProduit.classList.add('inputDisabled')
        prixUnitaireHTProduit.disabled = false
        prixUnitaireHTProduit.classList.remove('inputDisabled')
    }
}

function inputPrixProduit() {
    const calculeFromTTC = document.getElementById('isFromTTCProduit').checked 
    const tauxTVA = document.getElementById('tauxTVAProduit').value
    const inputPrixHT = document.getElementById('prixUnitaireHTProduit')
    const inputPrixTTC = document.getElementById('prixUnitaireTTCProduit')
    const inputMontantTVA = document.getElementById('montantTVAProduit')

    let prixHT = undefined
    let prixTTC = undefined

    if(calculeFromTTC) {
        prixTTC = inputPrixTTC.value
        inputPrixHT.value = (tauxTVA && prixTTC) ? (calculePrixHT(tauxTVA, prixTTC)).toFixed(2) : ''
        prixHT = inputPrixHT.value
    }
    else {
        prixHT = inputPrixHT.value
        inputPrixTTC.value = (tauxTVA && prixHT) ? (calculePrixTTC(tauxTVA, prixHT)).toFixed(2) : ''
        prixTTC = inputPrixTTC.value
    }

    if(prixHT && prixTTC) inputMontantTVA.value = calculeMontantTVA(prixHT, prixTTC)
}