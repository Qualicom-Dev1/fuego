const BASE_URL = '/adv'
const SVGPLUS = 'fa-plus'
const SVGMOINS = 'fa-minus'
const CREATION = 'Création'
const MODIFICATION = 'Modification'

let trEmptyTableCategories = undefined
let trEmptyTableGroupeProduits = undefined
let trEmptyTableProduits = undefined

async function pause(durationMs) {
    await new Promise(resolve => setTimeout(() => resolve(), durationMs))
}

window.addEventListener('load', async () => {
    // charge les premiers éléments du document
    await initDocument()

    // charge en fond le reste des éléments du document
    await Promise.all([
        initBoxCategories(),
        initBoxGroupeProduits(),
        initBoxProduit()
    ])

    $('.loadingbackground').hide()
})

async function initDocument() {
    document.querySelectorAll('.btnAgence').forEach(btn => btn.onclick = () => {
        // filtre le contenu
        filterByAgency({ target : btn })
        
        closeAllBoxes()
    })

    trEmptyTableCategories = document.getElementById('trEmptyTableCategories')
    trEmptyTableGroupeProduits = document.getElementById('trEmptyTableGroupeProduits')
    trEmptyTableProduits = document.getElementById('trEmptyTableProduits')

    // charge le contenu
    await refreshPageContent()
}

async function refreshPageContent() {
    try {
        const [reqCategories, reqGroupesProduits, reqProduits] = await Promise.all([
            loadCategories(),
            loadGroupesProduits(),
            loadProduits()
        ])

        afficheCategories(reqCategories.infos, reqCategories.categories)
        afficheGroupesProduits(reqGroupesProduits.infos, reqGroupesProduits.produits)
        afficheProduits(reqProduits.infos, reqProduits.produits)
    }
    catch(e) {
        console.error(e)
    }
}

function setErrorMessage(element, message) {
    if(element === undefined || !['generale', 'categories', 'groupesProduits', 'produits'].includes(element)) element = 'generale'

    const div = document.getElementById(`div_info_${element}`)
    const p = div.getElementsByTagName('p')[0]

    p.classList.add('error_message')
    p.innerText = message
    div.style.display = 'block'
}

function setInformationMessage(element, message) {
    if(element === undefined || !['generale', 'categories', 'groupesProduits', 'produits'].includes(element)) element = 'generale'

    const div = document.getElementById(`div_info_${element}`)
    const p = div.getElementsByTagName('p')[0]

    p.classList.add('info_message')
    p.innerText = message
    div.style.display = 'block'
}

function removeErrorMessage(element) {
    if(element === undefined || !['generale', 'categories', 'groupesProduits', 'produits'].includes(element)) element = 'generale'

    const div = document.getElementById(`div_info_${element}`)
    const p = div.getElementsByTagName('p')[0]

    p.innerText = ''
    p.classList.remove('error_message')
    p.classList.remove('info_message')
    div.style.display = 'none'
}

async function showElt(elt) {
    const tr = elt.closest('tr')
    const [type, id] = tr.getAttribute('id').split('_')
    const forAgence = tr.getAttribute('data-agences')

    if(id && type) {
        // ferme d'abord les boxes avant d'ouvrir le bon contenu
        closeAllBoxes()

        // sélection automatique de l'agence si elle n'est pas encore sélectionnée
        const agence = document.querySelector('.btnAgence.active')
        if(agence.getAttribute('data-for') !== forAgence) {
            const btnAgence = document.querySelector(`.btnAgence[data-for="${forAgence}"]`)
            if(btnAgence) await filterByAgency({ target : btnAgence})
        }

        switch(type) {
            case 'categorie' : 
                await showCategorie(id)
                formAddModifyCategorie.scrollIntoView({ behavior : "smooth", block : "start" })
                break;
            case 'groupeProduits' : 
                await showGroupeProduits(id)
                formAddModifyGroupeProduits.scrollIntoView({ behavior : "smooth", block : "start" })
                break;
            case 'produit' : 
                await showProduit(id)
                formAddModifyProduit.scrollIntoView({ behavior : "smooth", block : "start" })
                break;
        }
    }
}

function closeAllBoxes() {
    // ferme les boxes ouvertes s'il y en a, pour lors de l'ouverture charger le bon contenu
    if(document.querySelector('.ajouter_categorie').classList.contains(SVGMOINS)) {
        hideAddCategorie()
        cancelCategorie()
    }
    if(document.querySelector('.ajouter_groupeProduits').classList.contains(SVGMOINS)) {
        hideAddGroupeProduits()
        cancelGroupeProduits()
    }
    if(document.querySelector('.ajouter_produit').classList.contains(SVGMOINS)) {
        hideAddProduit()
        cancelProduit()
    }
}

function remove(elt) {
    const [type, id] = elt.closest('tr').getAttribute('id').split('_')

    if(id && type) {
        switch(type) {
            case 'categorie' : 
                removeCategorie(id)
                break;
            case 'groupeProduits' : 
                removeGroupeProduits(id)
                break;
            case 'produit' : 
                removeProduit(id)
                break;
        }
    }
}

async function loadCategories() {
    let infos = undefined
    let categories = undefined

    try {
        const response = await fetch('/adv/categories')
        if(!response.ok) throw generalError

        const data = await response.json()
        infos = data.infos
        categories = data.categories
    }
    catch(e) {
        categories = undefined
        infos = { error : e }
    }

    return {
        infos,
        categories
    }
}

async function afficheCategories(infos, categories) {
    try {
        if(infos && infos.error) throw infos.error

        const table = document.getElementById('tableCategories')
        table.innerHTML = ''

        if(infos && infos.message) {
            trEmptyTableCategories.getElementsByTagName('td')[0].innerText = infos.message
            table.appendChild(trEmptyTableCategories)
        }
        else if(categories && categories.length) {        
            for(const categorie of categories) {
                table.innerHTML += `
                    <tr id="categorie_${categorie.id}" data-agences="${categorie.Structure.nom}" class="">
                        <td>${categorie.nom}</td>
                        <td>${categorie.nbProduits}</td>
                        <td class="textFormated">${categorie.description}</td>
                        <td>
                            <i class="fas fa-cog btn_item hover_btn3 btnModify" onclick="showElt(this);" title="Modifier"></i>
                            <i class="fas fa-trash-alt btn_item hover_btn3 btnRemove" onclick="remove(this);" title="Supprimer"></i>
                        </td>
                    </tr>
                `
            }
        }
        else {
            trEmptyTableCategories.getElementsByTagName('td')[0].innerText = "Aucune catégorie disponible"
            table.appendChild(trEmptyTableCategories)
        }
    }
    catch(e) {
        setErrorMessage('categories', e)
    }
}

async function removeCategorie(IdCategorie) {
    if(IdCategorie && confirm("Êtes-vous sûr de vouloir supprimer cette catégorie?")) {
        $('.loadingbackground').show()
        removeErrorMessage('categories')

        try {
            const url = `${BASE_URL}/categories/${IdCategorie}`
            const options = {
                headers: {
                    'Content-Type': 'application/json'
                },
                method : 'DELETE'
            }

            const response = await fetch(url, options)
            if(!response.ok) throw generalError
            else if(response.status === 401) {
                alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
                location.reload()
            }
            else {
                const { infos } = await response.json()

                if(infos && infos.error) throw infos.error
                if(infos && infos.message) {
                    setInformationMessage('categories', infos.message)

                    const reqCategories = await loadCategories()
                    afficheCategories(reqCategories.infos, reqCategories.categories)
                }
            }
        }
        catch(e) {
            setErrorMessage('categories', e)
        }
        finally {
            $('.loadingbackground').hide()
        }
    }
}

async function loadGroupesProduits() {
    let infos = undefined
    let produits = undefined

    try {
        const response = await fetch('/adv/produits/groupesProduits')
        if(!response.ok) throw generalError

        const data = await response.json()
        infos = data.infos
        produits = data.produits
    }
    catch(e) {
        produits = undefined
        infos = { error : e }
    }

    return {
        infos,
        produits
    }
}

function afficheGroupesProduits(infos, produits) {
    try {
        if(infos && infos.error) throw infos.error

        const table = document.getElementById('tableGroupesProduits')
        table.innerHTML = ''

        if(infos && infos.message) {
            trEmptyTableGroupeProduits.getElementsByTagName('td')[0].innerText = infos.message
            table.appendChild(trEmptyTableGroupeProduits)
        }
        else if(produits && produits.length) {
            for(const produit of produits) {
                let affichageListeProduit = '<ul>'
                produit.listeProduits.forEach(produit => affichageListeProduit += `<li>${produit.quantite} ${produit.designation !== '' ? produit.designation : produit.nom}</li>`)
                affichageListeProduit += '</ul>'

                table.innerHTML += `
                    <tr id="groupeProduits_${produit.id}" data-agences="${produit.Structure.nom}" class="">
                        <td><p>${produit.categories.length ? produit.categories.map(categorie => categorie.nom).toString() : '-' }</p></td>
                        <td>${produit.ref ? produit.ref : '-'}</td>
                        <td>${produit.nom}</td>
                        <td class="textFormated">${produit.designation}</td>                        
                        <td class="textFormated">${produit.description}</td>
                        <td>${affichageListeProduit}</td>
                        <td>${produit.prixUnitaireHT}</td>
                        <td>${produit.prixUnitaireTTC}</td>
                        <td>${produit.montantTVA}</td>       
                        <td>
                            <i class="fas fa-cog btn_item hover_btn3 btnModify" onclick="showElt(this);" title="Modifier"></i>
                            <i class="fas fa-trash-alt btn_item hover_btn3 btnRemove" onclick="remove(this);" title="Supprimer"></i>
                        </td>                 
                    </tr>
                `
            }
        }
        else {
            trEmptyTableGroupeProduits.getElementsByTagName('td')[0].innerText = "Aucun groupement de produits disponible"
            table.appendChild(trEmptyTableGroupeProduits)
        }
    }
    catch(e) {
        setErrorMessage('groupesProduits', e)
    }
}

async function removeGroupeProduits(IdGroupeProduits) {
    if(IdGroupeProduits) {
        $('.loadingbackground').show()
        removeErrorMessage('groupesProduits')

        try {
            let inGroup = false

            const responseProduitInGroup = await fetch(`${BASE_URL}/produits/inGroup/${IdGroupeProduits}`)
            if(!responseProduitInGroup.ok) throw generalError
            else if(responseProduitInGroup.status === 401) {
                alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
                location.reload()
            }
            else {
                const data = await responseProduitInGroup.json()

                if(data.infos && data.infos.error) throw data.infos.error
                inGroup = data.inGroup
            }

            $('.loadingbackground').hide()

            if(confirm(`Êtes-vous sûr de vouloir supprimer ce groupe de produits${inGroup ? " alors qu'il fait partie d'au moins un groupe" : ''}?`)) {
                $('.loadingbackground').show()
                
                const url = `${BASE_URL}/produits/${IdGroupeProduits}`
                const options = {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    method : 'DELETE'
                }

                const response = await fetch(url, options)
                if(!response.ok) throw generalError
                else if(response.status === 401) {
                    alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
                    location.reload()
                }
                else {
                    const { infos } = await response.json()

                    if(infos && infos.error) throw infos.error
                    if(infos && infos.message) {
                        setInformationMessage('groupesProduits', infos.message)

                        const reqGroupesProduits = await loadGroupesProduits()
                        afficheGroupesProduits(reqGroupesProduits.infos, reqGroupesProduits.produits)
                    }
                }
            }
        }
        catch(e) {
            setErrorMessage('groupesProduits', e)
        }
        finally {
            $('.loadingbackground').hide()
        }
    }
}

async function loadProduits() {
    let infos = undefined
    let produits = undefined

    try {
        const response = await fetch('/adv/produits/produits')
        if(!response.ok) throw generalError

        const data = await response.json()
        infos = data.infos
        produits = data.produits
    }
    catch(e) {
        produits = undefined
        infos = { error : e }
    }

    return {
        infos,
        produits
    }
}

function afficheProduits(infos, produits) {
    try {
        if(infos && infos.error) throw infos.error

        const table = document.getElementById('tableProduits')
        table.innerHTML = ''

        if(infos && infos.message) {
            trEmptyTableProduits.getElementsByTagName('td').innerText = infos.message
            table.appendChild(trEmptyTableProduits)
        }
        else if(produits && produits.length) {
            for(const produit of produits) {
                table.innerHTML += `
                    <tr id="produit_${produit.id}" data-agences="${produit.Structure.nom}" class="">
                        <td><p>${produit.categories.length ? produit.categories.map(categorie => categorie.nom).toString() : '-' }</p></td>
                        <td>${produit.ref ? produit.ref : '-'}</td>
                        <td>${produit.nom}</td>
                        <td class="textFormated">${produit.designation}</td>                        
                        <td class="textFormated">${produit.description}</td>
                        <td>${(produit.caracteristique && produit.uniteCaracteristique) ? `${produit.caracteristique} ${produit.uniteCaracteristique}` : '-'}</td>
                        <td>${produit.prixUnitaireHT}</td>
                        <td>${produit.prixUnitaireTTC}</td>
                        <td>${produit.tauxTVA}</td>
                        <td>
                            <i class="fas fa-cog btn_item hover_btn3 btnModify" onclick="showElt(this);" title="Modifier"></i>
                            <i class="fas fa-trash-alt btn_item hover_btn3 btnRemove" onclick="remove(this);" title="Supprimer"></i>
                        </td>                        
                    </tr>
                `
            }
        }
        else {
            trEmptyTableProduits.getElementsByTagName('td').innerText = "Aucun produit disponible"
            table.appendChild(trEmptyTableProduits)
        }
    }
    catch(e) {
        setErrorMessage('produits', e)
        console.log(e)
    }
}

async function removeProduit(IdProduit) {
    if(IdProduit) {
        $('.loadingbackground').show()
        removeErrorMessage('produits')

        try {
            let inGroup = false

            const responseProduitInGroup = await fetch(`${BASE_URL}/produits/inGroup/${IdProduit}`)
            if(!responseProduitInGroup.ok) throw generalError
            else if(responseProduitInGroup.status === 401) {
                alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
                location.reload()
            }
            else {
                const data = await responseProduitInGroup.json()

                if(data.infos && data.infos.error) throw data.infos.error
                inGroup = data.inGroup
            }

            $('.loadingbackground').hide()

            if(confirm(`Êtes-vous sûr de vouloir supprimer ce produit${inGroup ? " sachant qu'il fait partie d'au moins un groupe" : ''}?`)) {
                $('.loadingbackground').show()

                const url = `${BASE_URL}/produits/${IdProduit}`
                const options = {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    method : 'DELETE'
                }

                const response = await fetch(url, options)
                if(!response.ok) throw generalError
                else if(response.status === 401) {
                    alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
                    location.reload()
                }
                else {
                    const { infos } = await response.json()

                    if(infos && infos.error) throw infos.error
                    if(infos && infos.message) {
                        setInformationMessage('produits', infos.message)

                        const [reqProduits, reqGroupesProduits] = await Promise.all([
                            loadProduits(),
                            loadGroupesProduits()
                        ])
                        afficheProduits(reqProduits.infos, reqProduits.produits)
                        afficheGroupesProduits(reqGroupesProduits.infos, reqGroupesProduits.produits)
                    }
                }
            }
        }
        catch(e) {
            setErrorMessage('produits', e)
            console.log(e)
        }
        finally {
            $('.loadingbackground').hide()
        }
    }
}

async function filterByAgency({ target }) {
    $('.loadingbackground').show()

    // gestion de la durée du timeout
    const defaultTimeoutDuration = 10
    let timeoutDuration = 0

    // retrait et ajout des classes aux boutons
    document.querySelector('.btnAgence.active').classList.remove('active')
    target.classList.add('active')

    const tableCategories = document.getElementById('tableCategories')
    const tableGroupesProduits = document.getElementById('tableGroupesProduits')
    const tableProduits = document.getElementById('tableProduits')

    // retrait de la tr pour tableau vide
    if(tableCategories.querySelector('tr[id=trEmptyTableCategories]')) tableCategories.removeChild(trEmptyTableCategories)
    if(tableGroupesProduits.querySelector('tr[id=trEmptyTableGroupeProduits]')) tableGroupesProduits.removeChild(trEmptyTableGroupeProduits)
    if(tableProduits.querySelector('tr[id=trEmptyTableProduits]')) tableProduits.removeChild(trEmptyTableProduits)

    // affiche les éléments cachés
    const hiddenElements = document.querySelectorAll('tr.hidden[data-agences]')
    timeoutDuration += (hiddenElements.length * 5)
    hiddenElements.forEach(tr => tr.classList.remove('hidden'))

    await pause(timeoutDuration > defaultTimeoutDuration ? timeoutDuration : defaultTimeoutDuration)
    timeoutDuration = 0

    const agence = target.getAttribute('data-for')
    // si une agence est sélectionnée, n'afficher que les éléments de celle-ci
    if(agence) {
        const elementsToHide = document.querySelectorAll('tr[data-agences]')
        timeoutDuration += (elementsToHide.length * 5)
        elementsToHide.forEach(tr => {
            // si l'élément ne contient pas le nom de l'agence on le cache
            if(tr.getAttribute('data-agences').indexOf(agence) < 0) {
                tr.classList.add('hidden')
            }
        })
    }

    // ajout tr pour tableau vide si rien à afficher
    if(!tableCategories.querySelector('tr[class=""]')) tableCategories.appendChild(trEmptyTableCategories)
    if(!tableGroupesProduits.querySelector('tr[class=""]')) tableGroupesProduits.appendChild(trEmptyTableGroupeProduits)
    if(!tableProduits.querySelector('tr[class=""]')) tableProduits.appendChild(trEmptyTableProduits)

    await pause(timeoutDuration > defaultTimeoutDuration ? timeoutDuration : defaultTimeoutDuration)

    $('.loadingbackground').hide()
}

function textarea_auto_height(elem) {
    elem.style.height = "1px";
    elem.style.height = (elem.scrollHeight + 5)+"px";
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

async function fillSelectCategories(form) {
    const select = form.querySelector('.selectCategories')
    emptySelect(select.getAttribute('id'))

    const response = await fetch(`${BASE_URL}/categories?idStructure=${document.querySelector('.btnAgence.active').getAttribute('data-id')}`)
    if(!response.ok) throw generalError
    else if(response.status === 401) {
        alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
        location.reload()
    }
    else {
        const { infos, categories } = await response.json()

        if(infos && infos.error) throw infos.error

        if(categories && categories.length) {
            for(const categorie of categories) {
                const opt = document.createElement('option')
                opt.value = `categorie_${categorie.id}`
                opt.text = categorie.nom

                select.append(opt)
            }
        }
        else {
            const opt = document.createElement("option")
            opt.text = "Aucune catégorie"

            select.append(opt)
        }
    }
}

function addSelectedCategorie(form) {
    const select = form.querySelector('.selectCategories')
    const selectedCategorie = select.querySelector('option:checked:enabled')

    if(selectedCategorie) {
        const idCategorie = selectedCategorie.value.split('_')[1]
        
        selectCategorie(form, idCategorie)
        select.querySelector('option:disabled').selected = true
    }
}

function selectCategorie(form, idCategorie) {
    const select = form.querySelector('.selectCategories')
    const selectedCategorie = select.querySelector(`option[value="categorie_${idCategorie}"]`)
    
    if(selectedCategorie) {
        const listeCategories = form.querySelector('.listeCategories')
        const nomCategorie = selectedCategorie.text

        let div = form.getAttribute('id').replace('formAddModify', '')
        div = div.charAt(0).toLowerCase() + div.slice(1)

        listeCategories.innerHTML += `
            <li id="${div}_categorie_${idCategorie}">
                <span class="badge badge-secondary cardUnite">
                    <span>${nomCategorie}</span>
                    <button type="button" onclick="removeFromListe(this);" title="Retirer">&#10006</button>
                </span>
            </li>
        `

        selectedCategorie.classList.add('hidden')
    }
}

async function fillSelectProduits(form) {
    const select = form.querySelector('.selectProduits')
    emptySelect(select.getAttribute('id'))

    const idStructure = document.querySelector('.btnAgence.active').getAttribute('data-id')
    const responseProduits = await fetch(`${BASE_URL}/produits/produits?idStructure=${idStructure}`)
    if(!responseProduits.ok) throw generalError
    else if(responseProduits.status === 401) {
        alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
        location.reload()
    }
    else {
        const dataProduits = await responseProduits.json()

        if(dataProduits.infos && dataProduits.infos.error) throw dataProduits.infos.error

        if(dataProduits.produits && dataProduits.produits.length) {            
            for(const produit of dataProduits.produits) {
                const opt = document.createElement('option')
                opt.value = `produit_${produit.id}`
                opt.setAttribute('data-prixUnitaireHT', produit.prixUnitaireHT)
                opt.setAttribute('data-prixUnitaireTTC', produit.prixUnitaireTTC)
                opt.setAttribute('data-tauxTVA', produit.tauxTVA)
                opt.text = (produit.ref ? `${produit.ref} : ${produit.nom}` : produit.nom)

                select.append(opt)
            }
        }
        else {
            const opt = document.createElement("option")
            opt.text = "Aucun produit"

            select.append(opt)
        }
    }
}

function addSelectedProduit(form) {
    const select = form.querySelector('.selectProduits')
    const selectedProduit = select.querySelector('option:checked:enabled')

    if(selectedProduit) {
        const idProduit = selectedProduit.value.split('_')[1]
        
        selectProduit(form, idProduit)
        select.querySelector('option:disabled').selected = true
    }
}

function selectProduit(form, idProduit, quantite = undefined, prixUnitaireHTSent = undefined, prixUnitaireTTCSent = undefined) {
    const select = form.querySelector('.selectProduits')
    const selectedProduit = select.querySelector(`option[value="produit_${idProduit}"]`)
    
    if(selectedProduit) {
        const listeProduits = form.querySelector('.listeProduits')
        const nomProduit = selectedProduit.text.replace('(groupe)', '').replace('(produit simple)', '')
        const prixUnitaireHT = selectedProduit.getAttribute('data-prixUnitaireHT')
        const prixUnitaireTTC = selectedProduit.getAttribute('data-prixUnitaireTTC')
        const tauxTVA = selectedProduit.getAttribute('data-tauxTVA')
        const isFromTTC = form.querySelector('input[id^=isFromTTC]').checked

        let div = form.getAttribute('id').replace('formAddModify', '')
        div = div.charAt(0).toLowerCase() + div.slice(1)

        const tr = document.createElement('tr')
        tr.setAttribute('data-id', `${div}_produit_${idProduit}`)
        tr.setAttribute('data-prixUnitaireHT', prixUnitaireHT)
        tr.setAttribute('data-prixUnitaireTTC', prixUnitaireTTC)
        tr.innerHTML = `
            <td class="td_nom">${nomProduit}</td>
            <td class="td_quantite"><input value="${quantite ? quantite : ''}" onblur="calculePrixGroupeProduits(this);" class="groupeProduitsQuantiteProduit" type="number" step="1" min="1" required></td>
            <td class="td_prix"><input type="number" class="groupeProduitsPrixUnitaireHTProduit ${isFromTTC ? 'inputDisabled' : ''}" value="${prixUnitaireHTSent ? prixUnitaireHTSent : prixUnitaireHT}" onblur="calculePrixGroupeProduits(this);" min="0" step=".01" required ${isFromTTC ? 'disabled' : ''}></td>
            <td class="td_tva">${tauxTVA}</td>
            <td class="td_prix"><input type="number" class="groupeProduitsPrixUnitaireTTCProduit ${isFromTTC ? '' : 'inputDisabled'}" value="${prixUnitaireTTCSent ? prixUnitaireTTCSent : prixUnitaireTTC}" onblur="calculePrixGroupeProduits(this);" min="0" step=".01" required ${isFromTTC ? '' : 'disabled'}></td>
            <td class="td_prix prixTotalHT">0</td>
            <td class="td_prix prixTotalTTC">0</td>
            <td class="td_option"><button onclick="removeFromTab(this);" class="btnRemoveFromListeProduits" type="button" title="Retirer"><i class="fas fa-minus btn_item2 hover_btn3"></i></button></td>
        `

        listeProduits.appendChild(tr)
        selectedProduit.classList.add('hidden')
        return tr
    }
}

function removeFromListe(elt) {
    const li = elt.closest('li')

    if(li) {
        const [div, type, id] = li.getAttribute('id').split('_')
        
        const form = document.getElementById(`formAddModify${div.charAt(0).toUpperCase()}${div.slice(1)}`)
        const select = form.querySelector(`.select${type.charAt(0).toUpperCase()}${type.slice(1)}s`)

        select.querySelector(`option[value="${type}_${id}"]`).classList.remove('hidden')
        li.parentNode.removeChild(li)
    }
}

function removeFromTab(elt) {
    const tr = elt.closest('tr')

    if(tr) {
        const [div, type, id] = tr.getAttribute('data-id').split('_')

        const form = document.getElementById(`formAddModify${div.charAt(0).toUpperCase()}${div.slice(1)}`)
        const select = form.querySelector('.selectProduits')
        const option = select.querySelector(`option[value=${type}_${id}]`)
        
        option.classList.remove('hidden')      
        tr.parentNode.removeChild(tr)
        calculePrixGroupeProduits(tr.querySelector('input'))
    }
}

function calculeMontantTVA(prixHT, prixTTC) {
    prixHT = Number(prixHT)
    prixTTC = Number(prixTTC)

    return Number(prixTTC - prixHT).toFixed(2)
}

function calculePrixHT(tauxTVA, prixTTC) {
    tauxTVA = Number(tauxTVA / 100)
    prixTTC = Number(prixTTC)

    return Number(prixTTC / Number(1 + tauxTVA))
}

function calculePrixTTC(tauxTVA, prixHT) {
    tauxTVA = Number(tauxTVA / 100)
    prixHT = Number(prixHT)

    return Number(prixHT * Number(1 + tauxTVA))
}

function calculePrixGroupeProduits(input) {
    const ligneProduit = input.closest('tr')
    const type = ligneProduit.getAttribute('data-id').split('_')[0]
    const typeWithUpperCase = type.charAt(0).toUpperCase() + type.slice(1) 

    // mets à jour la ligne du produit qui vient d'être modifié
    calculePrixProduitModifie(ligneProduit, type, typeWithUpperCase)

    // mets à jour les prix totaux      
    const listeProduits = document.getElementById(`${type}ListeProduits`).querySelectorAll('tr')

    let totalHT = 0
    let totalTTC = 0
    if(listeProduits.length) {
        for(const tr of listeProduits) {
            const totalHTProduit = Number(tr.querySelector('.prixTotalHT').innerText)
            const totalTTCProduit = Number(tr.querySelector('.prixTotalTTC').innerText)
            
            totalHT += totalHTProduit
            totalTTC += totalTTCProduit
        }

        totalHT = Number(totalHT).toFixed(2)
        totalTTC = Number(totalTTC).toFixed(2)
    }

    document.getElementById(`prixUnitaireHT${typeWithUpperCase}`).value = totalHT
    document.getElementById(`prixUnitaireTTC${typeWithUpperCase}`).value = totalTTC
    document.getElementById(`montantTVA${typeWithUpperCase}`).value = (totalHT > 0 && totalTTC > 0) ? calculeMontantTVA(totalHT, totalTTC) : '0.00'
}

function calculePrixProduitModifie(ligneProduit, type, typeWithUpperCase) {
    const isFromTTC = document.getElementById(`isFromTTC${typeWithUpperCase}`).checked

    // mets à jour les prix du produit modifié
    const quantite = Number(ligneProduit.querySelector(`.${type}QuantiteProduit`).value)
    const tauxTVA = Number(ligneProduit.querySelector('.td_tva').innerText)
    const inputPrixUnitaireHT = ligneProduit.querySelector(`.${type}PrixUnitaireHTProduit`)
    const inputPrixUnitaireTTC = ligneProduit.querySelector(`.${type}PrixUnitaireTTCProduit`)
    const contentPrixTotalHTProduit = ligneProduit.querySelector('.prixTotalHT')
    const contentPrixTotalTTCProduit = ligneProduit.querySelector('.prixTotalTTC')

    if(quantite > 0) {
        let prixHT = Number(inputPrixUnitaireHT.value)
        let prixTTC = Number(inputPrixUnitaireTTC.value)

        if(isFromTTC) {
            prixHT = calculePrixHT(tauxTVA, prixTTC)    
        }
        else {
            prixTTC = calculePrixTTC(tauxTVA, prixHT)
        }

        inputPrixUnitaireHT.value = Number(prixHT).toFixed(2)
        inputPrixUnitaireTTC.value = Number(prixTTC).toFixed(2)
        contentPrixTotalHTProduit.innerText = Number(quantite * Number(prixHT.toFixed(2))).toFixed(2)
        contentPrixTotalTTCProduit.innerText = Number(quantite * Number(prixTTC.toFixed(2))).toFixed(2)
    }
    else {
        contentPrixTotalHTProduit.innerText = 0
        contentPrixTotalTTCProduit.innerText = 0
    }
}