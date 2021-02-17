const formAddModifyCategorie = document.getElementById('formAddModifyCategorie')
let isCategorieUpdated = false

async function initBoxCategories() {
    document.getElementById('btnShowAddCategorie').onclick = switchAddCategorie
    formAddModifyCategorie.addEventListener('submit', addModifyCategorie)
    document.getElementById('btnCancelCategorie').onclick = cancelCategorie
}

function initTextInfosCategorie() {
    const textInfos = formAddModifyCategorie.querySelector('.boxInfos p')
    textInfos.style.display = 'none'
    textInfos.classList.remove('error_message')
    textInfos.classList.remove('info_message')
    textInfos.innerText = ''
}

async function fillTextInfosCategorie(infos) {
    const textInfos = formAddModifyCategorie.querySelector('.boxInfos p')

    if(infos) {
        if(infos.error) {
            textInfos.innerText = infos.error
            textInfos.classList.add('error_message')
        }
        else if(infos.message) {
            textInfos.innerText = infos.message
            textInfos.classList.add('info_message')
            if(isCategorieUpdated) {
                $('.loadingbackground').show()
                await refreshPageContent()
                $('.loadingbackground').hide()
            }
        }

        textInfos.style.display = 'flex'
    }
}

function switchAddCategorie() {
    if(formAddModifyCategorie.parentNode.style.display === 'none') {        
        hideAddGroupeProduits()
        hideAddProduit()
        showAddCategorie()
    }
    else {
        hideAddCategorie()
        cancelCategorie()
    }
}

function showAddCategorie() {
    const boxCreateModify = formAddModifyCategorie.parentNode
    const btnShowAddCategorie = document.querySelector('#btnShowAddCategorie svg')

    boxCreateModify.style.display = 'flex'
    btnShowAddCategorie.classList.remove(SVGPLUS)
    btnShowAddCategorie.classList.add(SVGMOINS)
}

function hideAddCategorie() {    
    const boxCreateModify = formAddModifyCategorie.parentNode
    const btnShowAddCategorie = document.querySelector('#btnShowAddCategorie svg')

    boxCreateModify.style.display = 'none'
    btnShowAddCategorie.classList.remove(SVGMOINS)
    btnShowAddCategorie.classList.add(SVGPLUS)

    cancelCategorie()
}

async function fillBoxAddModifyCategorie(infos = undefined, categorie = undefined) {
    initTextInfosCategorie()

    const title = formAddModifyCategorie.querySelector('.title')

    if(infos) await fillTextInfosCategorie(infos)

    if(categorie) {
        title.innerText = `${MODIFICATION} Catégorie`

        document.getElementById('idCategorie').value = categorie.id
        document.getElementById('nomCategorie').value = categorie.nom
        document.getElementById('descriptionCategorie').value = categorie.description
        textarea_auto_height(document.getElementById('descriptionCategorie'))
    }

    if(!infos && !categorie) title.innerText = `${CREATION} Catégorie`

    $('.loadingbackground').hide()
}

function cancelCategorie() {
    isCategorieUpdated = false
    formAddModifyCategorie.querySelector('.title').innerText = `${CREATION} Catégorie`
    document.getElementById('idCategorie').value = ''
    document.getElementById('nomCategorie').value = ''
    document.getElementById('descriptionCategorie').value = ''
    textarea_auto_height(document.getElementById('descriptionCategorie'))
    initTextInfosCategorie()
}

async function addModifyCategorie(event) {
    event.preventDefault()

    if(formAddModifyCategorie.checkValidity()) {
        $('.loadingbackground').show()

        try {
            let url = `${BASE_URL}/categories/`
            let option = undefined

            const idStructure = document.querySelector('.btnAgence.active').getAttribute('data-id')
            if(idStructure === '') throw "Une agence doit être sélectionnée."

            const params = {
                idStructure : Number(idStructure),
                nom : document.getElementById('nomCategorie').value,
                description : document.getElementById('descriptionCategorie').value
            }

            const id = document.getElementById('idCategorie').value

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
                const { infos, categorie } = await response.json()

                if(infos && infos.message) isCategorieUpdated = true
                fillBoxAddModifyCategorie(infos, categorie)
            }
        }
        catch(e) {
            fillBoxAddModifyCategorie({ error : e })
        }
    }
    else {
        formAddModifyCategorie.reportValidity()
    }
}

async function showCategorie(id) {
    $('.loadingbackground').show()
    showAddCategorie()

    try {
        const response = await fetch(`${BASE_URL}/categories/${id}`)
        if(!response.ok) throw generalError
        else if(response.status === 401) {
            alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
            location.reload()
        }
        else {
            const { infos, categorie } = await response.json()

            fillBoxAddModifyCategorie(infos, categorie)
        }
    }
    catch(e) {
        fillBoxAddModifyCategorie({ error : e })
    }
}