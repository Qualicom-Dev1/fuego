let trEmptyTableCategories = undefined
let trEmptyTableGroupeProduits = undefined
let trEmptyTableProduits = undefined

window.addEventListener('load', async () => {
    await initDocument()

    $('.loadingbackground').hide()
})

async function initDocument() {
    document.querySelectorAll('.btnAgence').forEach(btn => btn.onclick = filterByAgency)

    trEmptyTableCategories = document.getElementById('trEmptyTableCategories')
    trEmptyTableGroupeProduits = document.getElementById('trEmptyTableGroupeProduits')
    trEmptyTableProduits = document.getElementById('trEmptyTableProduits')

    // charge le contenu
    try {
        const [reqCategories, reqGroupesProduits, reqProduits] = await Promise.all([
            loadCategories(),
            loadGroupesProduits(),
            loadProduits()
        ])

        afficheCategories(reqCategories.infos, reqCategories.categories)
    }
    catch(e) {
        console.error(e)
    }
}

function setErrorMessage(message) {
    const div = document.getElementById('div_info')
    const p = div.getElementsByTagName('p')[0]

    p.classList.add('error_message')
    p.innerText = message
    div.style.display = 'block'
}

function setInformationMessage(message) {
    const div = document.getElementById('div_info')
    const p = div.getElementsByTagName('p')[0]

    p.classList.add('info_message')
    p.innerText = message
    div.style.display = 'block'
}

function removeErrorMessage() {
    const div = document.getElementById('div_info')
    const p = div.getElementsByTagName('p')[0]

    p.innerText = ''
    p.classList.remove('error_message')
    p.classList.remove('info_message')
    div.style.display = 'none'
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

function afficheCategories(infos, categories) {
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
                        <td><p>${categorie.description}</p></td>
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
        setErrorMessage(e)
    }
}

async function loadGroupesProduits() {
    try {

    }
    catch(e) {
        
    }
}

async function loadProduits() {
    try {

    }
    catch(e) {
        
    }
}

function filterByAgency({ target }) {
    $('.loadingbackground').show()

    // retrait et ajout des classes aux boutons
    document.querySelector('.btnAgence.active').classList.remove('active')
    target.classList.add('active')

    const tableCategories = document.getElementById('tableCategories')
    const tableGroupeProduits = document.getElementById('tableGroupeProduits')
    const tableProduits = document.getElementById('tableProduits')

    // retrait de la tr pour tableau vide
    if(tableCategories.querySelector('tr[id=trEmptyTableCategories]')) tableCategories.removeChild(trEmptyTableCategories)
    if(tableGroupeProduits.querySelector('tr[id=trEmptyTableCategories]')) tableGroupeProduits.removeChild(trEmptyTableGroupeProduits)
    if(tableProduits.querySelector('tr[id=trEmptyTableCategories]')) tableProduits.removeChild(trEmptyTableProduits)

    // affiche les éléments cachés
    document.querySelectorAll('tr.hidden[data-agences]').forEach(tr => tr.classList.remove('hidden'))

    const agence = target.getAttribute('data-for')
    // si une agence est sélectionnée, n'afficher que les éléments de celle-ci
    if(agence) {
        document.querySelectorAll('tr[data-agences]').forEach(tr => {
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

    setTimeout(() => $('.loadingbackground').hide(), 2000)
}