const formAddModifyGroupeProduits = document.getElementById('formAddModifyGroupeProduits')
let isGroupeProduitsUpdated = false

async function initBoxGroupeProduits() {
    document.getElementById('btnShowAddGroupeProduits').onclick = switchAddGroupeProduits
    formAddModifyGroupeProduits.addEventListener('submit', addModifyGroupeProduits)
    document.getElementById('btnCancelGroupeProduits').onclick = cancelGroupeProduits
    document.getElementById('btnGroupeProduitsAddToListeCategories').onclick = () => addSelectedCategorie(formAddModifyGroupeProduits)
    document.getElementById('isFromTTCGroupeProduits').onchange = switchIsFromTTCGroupeProduits
    document.getElementById('btnGroupeProduitsAddToListeProduits').onclick = () => addSelectedProduit(formAddModifyGroupeProduits)

    // ajout des listeners pour le calcule de prix
    // document.getElementById('prixUnitaireHTGroupeProduits').onblur = inputPrixGroupeProduits
    // document.getElementById('prixUnitaireTTCGroupeProduits').onblur = inputPrixGroupeProduits
}

function initTextInfosGroupeProduits() {
    const textInfos = formAddModifyGroupeProduits.querySelector('.boxInfos p')
    textInfos.style.display = 'none'
    textInfos.classList.remove('error_message')
    textInfos.classList.remove('info_message')
    textInfos.innerText = ''
}

async function fillTextInfosGroupeProduits(infos) {
    const textInfos = formAddModifyGroupeProduits.querySelector('.boxInfos p')

    if(infos) {        
        if(infos.error) {
            textInfos.innerText = infos.error
            textInfos.classList.add('error_message')
        }
        else if(infos.message) {
            textInfos.innerText = infos.message
            textInfos.classList.add('info_message')
            if(isGroupeProduitsUpdated) {
                $('.loadingbackground').show()
                await refreshPageContent()
                $('.loadingbackground').hide()
                await filterByAgency({ target : document.querySelector('.btnAgence.active') })
            }
        }

        textInfos.style.display = 'flex'
    }
}

function switchAddGroupeProduits() {
    if(formAddModifyGroupeProduits.parentNode.style.display === 'none') {        
        hideAddCategorie()
        hideAddProduit()
        showAddGroupeProduits()
    }
    else {
        hideAddGroupeProduits()
        cancelGroupeProduits()
    }
}

async function showAddGroupeProduits() {
    const boxCreateModify = formAddModifyGroupeProduits.parentNode
    const btnShowAddCategorie = document.querySelector('#btnShowAddGroupeProduits svg')

    try {
        await loadContentBoxGroupeProduits()
    }
    catch(e) {
        fillBoxAddModifyGroupeProduits({ error : e })
    }

    boxCreateModify.style.display = 'flex'
    btnShowAddCategorie.classList.remove(SVGPLUS)
    btnShowAddCategorie.classList.add(SVGMOINS)
}

function hideAddGroupeProduits() {
    const boxCreateModify = formAddModifyGroupeProduits.parentNode
    const btnShowAddCategorie = document.querySelector('#btnShowAddGroupeProduits svg')

    boxCreateModify.style.display = 'none'
    btnShowAddCategorie.classList.remove(SVGMOINS)
    btnShowAddCategorie.classList.add(SVGPLUS)

    cancelGroupeProduits()
}

async function fillBoxAddModifyGroupeProduits(infos = undefined, produit = undefined) {
    initTextInfosGroupeProduits()

    const title = formAddModifyGroupeProduits.querySelector('.title')

    if(infos) await fillTextInfosGroupeProduits(infos)

    if(produit) {
        $('.loadingbackground').show()
        emptyBoxGroupeProduits()
        title.innerText = `${MODIFICATION} Groupe Produits`

        document.getElementById('idGroupeProduits').value = produit.id
        document.getElementById('nomGroupeProduits').value = produit.nom
        document.getElementById('refGroupeProduits').value = produit.ref
        document.getElementById('designationGroupeProduits').value = produit.designation
        textarea_auto_height(document.getElementById('designationGroupeProduits'))
        document.getElementById('descriptionGroupeProduits').value = produit.description
        textarea_auto_height(document.getElementById('descriptionGroupeProduits'))

        // sélection des catégories s'il y en a 
        if(produit.categories.length) {
            for(const categorie of produit.categories) {
                selectCategorie(formAddModifyGroupeProduits, categorie.id)
            }
        }

        // masque le groupe de produits en cours
        const optionGroupeProduitsEnCours = formAddModifyGroupeProduits.querySelector('.selectProduits').querySelector(`option[value="produit_${produit.id}"]`)
        if(optionGroupeProduitsEnCours) optionGroupeProduitsEnCours.classList.add('hidden')        

        // sélection des produits s'il y en a
        if(produit.listeProduits.length) {
            for(const sousProduit of produit.listeProduits) {
                const addedTr = selectProduit(formAddModifyGroupeProduits, sousProduit.id, sousProduit.quantite, sousProduit.prixUnitaireHTApplique, sousProduit.prixUnitaireTTCApplique)
                calculePrixGroupeProduits(addedTr.querySelector('input'))
            }
        }

        // applique les prix totaux ensuite pour afficher le prix réel et non celui calculé sur le client
        document.getElementById('prixUnitaireHTGroupeProduits').value = produit.prixUnitaireHT
        document.getElementById('prixUnitaireTTCGroupeProduits').value = produit.prixUnitaireTTC
        document.getElementById('montantTVAGroupeProduits').value = produit.montantTVA
    }

    if(!infos && !produit) title.innerText = `${CREATION} Groupe Produits`
}

function emptyBoxGroupeProduits() {
    document.getElementById('idGroupeProduits').value = ''
    document.getElementById('nomGroupeProduits').value = ''
    document.getElementById('refGroupeProduits').value = ''
    document.getElementById('designationGroupeProduits').value = ''
    textarea_auto_height(document.getElementById('designationGroupeProduits'))
    document.getElementById('descriptionGroupeProduits').value = ''
    textarea_auto_height(document.getElementById('descriptionGroupeProduits'))
    document.getElementById('prixUnitaireHTGroupeProduits').value = ''
    document.getElementById('prixUnitaireTTCGroupeProduits').value = ''
    document.getElementById('montantTVAGroupeProduits').value = ''

    formAddModifyGroupeProduits.querySelector('.selectCategories').querySelector('option:disabled').selected = true
    formAddModifyGroupeProduits.querySelector('.listeCategories').innerHTML = ''
    formAddModifyGroupeProduits.querySelector('.selectProduits').querySelector('option:disabled').selected = true
    formAddModifyGroupeProduits.querySelector('.listeProduits').innerHTML = ''
}

function cancelGroupeProduits() {
    isGroupeProduitsUpdated = false
    formAddModifyGroupeProduits.querySelector('.title').innerText = `${CREATION} Groupe Produits`
    const isFromTTCGroupeProduits = document.getElementById('isFromTTCGroupeProduits')
    isFromTTCGroupeProduits.checked = false
    isFromTTCGroupeProduits.onchange()
    emptyBoxGroupeProduits()
    initTextInfosGroupeProduits()
}

async function addModifyGroupeProduits(event) {
    event.preventDefault()

    if(formAddModifyGroupeProduits.checkValidity()) {
        $('.loadingbackground').show()

        try {
            let url = `${BASE_URL}/produits/`
            let option = undefined

            const idStructure = document.querySelector('.btnAgence.active').getAttribute('data-id')
            if(idStructure === '') throw "Une agence doit être sélectionnée."

            const params = {
                idStructure : Number(idStructure),
                isGroupe : true,
                nom :document.getElementById('nomGroupeProduits').value,
                ref : document.getElementById('refGroupeProduits').value,
                designation :  document.getElementById('designationGroupeProduits').value,                
                description : document.getElementById('descriptionGroupeProduits').value,
                isFromTTC : document.getElementById('isFromTTCGroupeProduits').checked,
                prixUnitaireHT : document.getElementById('prixUnitaireHTGroupeProduits').value,
                prixUnitaireTTC : document.getElementById('prixUnitaireTTCGroupeProduits').value,
                montantTVA : document.getElementById('montantTVAGroupeProduits').value                
            }

            const liListeCategories = Array.from(formAddModifyGroupeProduits.querySelector('.listeCategories').querySelectorAll('li'))
            // ajout des ids catégories s'il y en a
            if(liListeCategories.length) params.listeIdsCategories = (liListeCategories.map(li => li.getAttribute('id').split('_')[2])).toString()

            const trListeProduits = Array.from(formAddModifyGroupeProduits.querySelector('.listeProduits').querySelectorAll('tr'))
            // crée la liste de produit s'il y en a une
            if(trListeProduits.length) {
                // on lance une erreur s'il n'y a pas au moins 2 produits
                if(trListeProduits.length < 2) throw "Le groupe doit être composé d'au moins 2 produits."
                params.listeProduits = trListeProduits.map(tr => {
                    const sousProduit = {}

                    sousProduit.id = tr.getAttribute('data-id').split('_')[2]
                    sousProduit.quantite = tr.querySelector('.groupeProduitsQuantiteProduit').value
                    sousProduit.nom = tr.querySelector('.td_nom').innerText

                    if(params.isFromTTC) sousProduit.prixUnitaireTTCApplique = tr.querySelector('.groupeProduitsPrixUnitaireTTCProduit').value
                    else sousProduit.prixUnitaireHTApplique = tr.querySelector('.groupeProduitsPrixUnitaireHTProduit').value

                    return sousProduit
                })
            }
            else throw "Des produits doivent être ajoutés au groupe."

            const id = document.getElementById('idGroupeProduits').value

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

                if(infos && infos.message) isGroupeProduitsUpdated = true
                await fillBoxAddModifyGroupeProduits(infos, produit)
            }
        }
        catch(e) {
            fillBoxAddModifyGroupeProduits({ error : e })
            console.log(e)
        }
        finally {
            $('.loadingbackground').hide()
        }
    }
    else {
        formAddModifyGroupeProduits.reportValidity()
    }
}

async function showGroupeProduits(id) {
    await showAddGroupeProduits()
    $('.loadingbackground').show()

    try {
        const response = await fetch(`${BASE_URL}/produits/groupesProduits/${id}`)
        if(!response.ok) throw generalError
        else if(response.status === 401) {
            alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
            location.reload()
        }
        else {
            const { infos, produit } = await response.json()

            if(infos && infos.message) isProduitUpdated = true
            fillBoxAddModifyGroupeProduits(infos, produit)
        }
    }
    catch(e) {
        fillBoxAddModifyGroupeProduits({ error : e })
    }
    finally {
        $('.loadingbackground').hide()
    }
}

async function loadContentBoxGroupeProduits() {
    $('.loadingbackground').show()

    try {
        await Promise.all([
            fillSelectCategories(formAddModifyGroupeProduits),
            fillSelectProduits(formAddModifyGroupeProduits)
        ])
    }
    catch(e) {
        fillBoxAddModifyProduit({ error : e })
    }
    finally {
        $('.loadingbackground').hide()
    }
}

function switchIsFromTTCGroupeProduits() {
    const isFromTTCGroupeProduits = document.getElementById('isFromTTCGroupeProduits').checked
    const labelContent = document.getElementById('labelContentIsFromTTCGroupeProduits')

    // modification du texte affiché
    labelContent.innerText = isFromTTCGroupeProduits ? 'TTC' : 'HT'

    // modification des inputs
    const listeInputsPrixHT = formAddModifyGroupeProduits.querySelectorAll('.groupeProduitsPrixUnitaireHTProduit')
    const listeInputsPrixTTC = formAddModifyGroupeProduits.querySelectorAll('.groupeProduitsPrixUnitaireTTCProduit')

    if(isFromTTCGroupeProduits) {
        for(const input of listeInputsPrixHT) {
            input.disabled = true
            input.classList.add('inputDisabled')
        }

        for(const input of listeInputsPrixTTC) {
            input.disabled = false
            input.classList.remove('inputDisabled')
        }
    }
    else {
        for(const input of listeInputsPrixTTC) {
            input.disabled = true
            input.classList.add('inputDisabled')
        }
        
        for(const input of listeInputsPrixHT) {
            input.disabled = false
            input.classList.remove('inputDisabled')
        }
    }
}

function inputPrixGroupeProduits() {
    const prixHT = document.getElementById('prixUnitaireHTGroupeProduits').value
    const prixTTC = document.getElementById('prixUnitaireTTCGroupeProduits').value

    if(prixHT && prixTTC) {
        try {
            initTextInfosGroupeProduits()

            if(Number(prixTTC) <= Number(prixHT)) throw "Le prix TTC doit être supérieur au prix HT."

            document.getElementById('montantTVAGroupeProduits').value = calculeMontantTVA(prixHT, prixTTC)
        }
        catch(e) {
            fillBoxAddModifyGroupeProduits({ error : e })
        }
    }
}