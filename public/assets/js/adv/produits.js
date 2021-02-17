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
    document.querySelectorAll('.btnAgence').forEach(btn => btn.onclick = filterByAgency)

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

function showElt(elt) {
    const [type, id] = elt.closest('tr').getAttribute('id').split('_')

    if(id && type) {
        switch(type) {
            case 'categorie' : 
                showCategorie(id)
                break;
            case 'groupeProduits' : 
                showGroupeProduits(id)
                break;
            case 'produit' : 
                showProduit(id)
                break;
        }
    }
}

function addModify(elt) {

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
                            <i class="fas fa-cog btn_item hover_btn3 btnModify" onclick="showElt(this);"></i>
                            <i class="fas fa-trash-alt btn_item hover_btn3 btnRemove" onclick="remove(this);"></i>
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

        const table = document.getElementById('tableGroupeProduits')
        table.innerHTML = ''

        if(infos && infos.message) {
            trEmptyTableGroupeProduits.getElementsByTagName('td')[0].innerText = infos.message
            table.appendChild(trEmptyTableGroupeProduits)
        }
        else if(produits && produits.length) {
            for(const produit of produits) {
                let affichageListeProduit = '<ul>'
                produit.listeProduits.forEach(produit => affichageListeProduit += `<li>${produit.nom}</li>`)
                affichageListeProduit += '</ul>'

                table.innerHTML += `
                    <tr id="groupeProduits_${produit.id}" data-agences="${produit.Structure.nom}">
                        <td><p>${produit.ADV_categories.length ? produit.ADV_categories.map(categorie => categorie.nom).toString() : '-' }</p></td>
                        <td>${produit.ref ? produit.ref : '-'}</td>
                        <td>${produit.nom}</td>
                        <td class="textFormated">${produit.designation}</td>                        
                        <td class="textFormated">${produit.description}</td>
                        <td>${affichageListeProduit}</td>
                        <td>${produit.prixUnitaireHT}</td>
                        <td>${produit.prixUnitaireTTC}</td>
                        <td>${produit.tauxTVA}</td>       
                        <td>
                            <i class="fas fa-cog btn_item hover_btn3 btnModify" onclick="showElt(this);"></i>
                            <i class="fas fa-trash-alt btn_item hover_btn3 btnRemove" onclick="remove(this);"></i>
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
                    <tr id="produit_${produit.id}" data-agences="${produit.Structure.nom}">
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
                            <i class="fas fa-cog btn_item hover_btn3 btnModify" onclick="showElt(this);"></i>
                            <i class="fas fa-trash-alt btn_item hover_btn3 btnRemove" onclick="remove(this);"></i>
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

function filterByAgency({ target }) {
    $('.loadingbackground').show()

    // gestion de la durée du timeout
    const defaultTimeoutDuration = 10
    let timeoutDuration = 0

    // retrait et ajout des classes aux boutons
    document.querySelector('.btnAgence.active').classList.remove('active')
    target.classList.add('active')

    const tableCategories = document.getElementById('tableCategories')
    const tableGroupeProduits = document.getElementById('tableGroupeProduits')
    const tableProduits = document.getElementById('tableProduits')

    // retrait de la tr pour tableau vide
    if(tableCategories.querySelector('tr[id=trEmptyTableCategories]')) tableCategories.removeChild(trEmptyTableCategories)
    if(tableGroupeProduits.querySelector('tr[id=trEmptyTableGroupeProduits]')) tableGroupeProduits.removeChild(trEmptyTableGroupeProduits)
    if(tableProduits.querySelector('tr[id=trEmptyTableProduits]')) tableProduits.removeChild(trEmptyTableProduits)

    // affiche les éléments cachés
    const hiddenElements = document.querySelectorAll('tr.hidden[data-agences]')
    timeoutDuration += (hiddenElements.length * 2)
    hiddenElements.forEach(tr => tr.classList.remove('hidden'))

    const agence = target.getAttribute('data-for')
    // si une agence est sélectionnée, n'afficher que les éléments de celle-ci
    if(agence) {
        const elementsToHide = document.querySelectorAll('tr[data-agences]')
        timeoutDuration += (elementsToHide.length * 10)
        elementsToHide.forEach(tr => {
            // si l'élément ne contient pas le nom de l'agence on le cache
            if(tr.getAttribute('data-agences').indexOf(agence) < 0) {
                tr.classList.add('hidden')
            }
        })
    }

    // ajout tr pour tableau vide si rien à afficher
    if(!tableCategories.querySelector('tr[class=""]')) tableCategories.appendChild(trEmptyTableCategories)
    if(!tableGroupeProduits.querySelector('tr[class=""]')) tableGroupeProduits.appendChild(trEmptyTableGroupeProduits)
    if(!tableProduits.querySelector('tr[class=""]')) tableProduits.appendChild(trEmptyTableProduits)

    console.log(`Durée timeout : ${timeoutDuration}`)
    setTimeout(() => $('.loadingbackground').hide(), (timeoutDuration > defaultTimeoutDuration ? timeoutDuration : defaultTimeoutDuration))
}

function textarea_auto_height(elem) {
    elem.style.height = "1px";
    elem.style.height = (elem.scrollHeight)+"px";
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

    const response = await fetch(`${BASE_URL}/categories/`)
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