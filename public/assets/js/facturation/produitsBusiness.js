const BASE_URL = '/facturation/produitsBusiness'
const SVGPLUS = 'fa-plus'
const SVGMOINS = 'fa-minus'
const CREATION = 'Création'
const MODIFICATION = 'Modification'
const formAddModify = document.getElementById('formAddModify')
const clonesLiProduits = document.getElementById('clonesLiProduits')

window.addEventListener('load', async () => {
    initDocument()
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

    const liste_btnRemove = document.querySelectorAll('.btnRemove')
    if(liste_btnRemove && liste_btnRemove.length > 0) {
        for(const btn of liste_btnRemove) {
            btn.onclick = remove
        }
    }

    document.getElementById('btnShowAddProduit').onclick = switchAddProduit

    document.getElementById('isGroupeProduit').onclick = toggleIsGroupe

    document.getElementById('btnAddToListeProduits').onclick = addSelectedProduit
}

function showAddProduit() {
    const boxCreateModify = document.querySelector('.boxCreateModify')
    const btnShowAddProduit = document.querySelector('#btnShowAddProduit svg')

    boxCreateModify.style.display = 'flex'
    btnShowAddProduit.classList.remove(SVGPLUS)
    btnShowAddProduit.classList.add(SVGMOINS) 
}

function hideAddProduit() {
    const boxCreateModify = document.querySelector('.boxCreateModify')
    const btnShowAddProduit = document.querySelector('#btnShowAddProduit svg')

    boxCreateModify.style.display = 'none'
    btnShowAddProduit.classList.remove(SVGMOINS)
    btnShowAddProduit.classList.add(SVGPLUS)   
}

function switchAddProduit() {
    if(document.querySelector('.boxCreateModify').style.display === 'none') {
        showAddProduit()
    }
    else {
        hideAddProduit()
    }
}

async function fillBoxAddModify(infos = undefined, produit = undefined) {
    initTextInfos()

    const title = document.querySelector('#formAddModify .title')

    if(infos) {
        fillTextInfos(infos)
    }

    if(produit) {
        title.innerText = MODIFICATION

        document.getElementById('idProduit').value = produit.id
        document.getElementById('nomProduit').value = produit.nom
        document.getElementById('designationProduit').value = produit.designation
        document.getElementById('prixUnitaireProduit').value = produit.prixUnitaire

        // remplissage de la liste des sous produits
        if(produit.isGroupe) {
            document.getElementById('isGroupeProduit').checked = true
            await toggleIsGroupe()

            for(const sousProduit of produit.listeProduits) {
                const listeProduits = document.getElementById('listeProduits')
                const li = clonesLiProduits.querySelector(`li[data-value="${sousProduit.id}"]`).cloneNode(true)

                listeProduits.appendChild(li)
                btnRemoveFromListeProduitsAddEventListener(true)
            }
        }
    }
    
    if(!infos && !produit) {
        title.innerText = CREATION
    }

    $('.loadingbackground').hide()
}

function emptySelectProduits() {
    const listeOptions = document.querySelectorAll('#selectProduit  > option:enabled')
    if(listeOptions && listeOptions.length > 0) {
        for(const option of listeOptions) {
            option.parentNode.removeChild(option)
        }
    }

    document.querySelector('#selectProduit option').selected = true
}

function createListeClonesLi(produits) {
    if(produits && produits.length > 0) {
        for(const produit of produits) {
            const li = document.createElement('li')
            li.innerHTML = `<li data-value="${produit.id}">${produit.nom} (${produit.isGroupe ? 'groupe' : 'seul'}) - ${produit.prixUnitaire} € <button class="btnRemoveFromListeProduits" type="button"><i class="fas fa-minus btn_item2 hover_btn3"></i></button></li>`
            clonesLiProduits.appendChild(li)
        }
    }
}

function emptyListeClonesLi() {
    document.getElementById('clonesLiProduits').innerHTML = ''
}

async function fillSelectProduits() {
    $('.loadingbackground').show()

    const selectProduit = document.getElementById('selectProduit')
    emptySelectProduits()
    emptyListeClonesLi()

    try {
        const response = await fetch(`${BASE_URL}/all`)
        if(!response.ok) throw "Une erreur est survenue lors de la récupération des produits."
            else if(response.status === 401) {
                alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
                location.reload()
            }
            else {
                const { infos, produits } = await response.json()

                if(infos && infos.error) throw infos.error

                for(const produit of produits) {
                    const opt = document.createElement("option")
                    opt.value = `select_produit_${produit.id}`
                    opt.text = `${produit.nom} (${produit.isGroupe ? 'groupe' : 'seul'}) - ${produit.prixUnitaire} €`

                    selectProduit.append(opt)
                }

                createListeClonesLi(produits)
            }
    }
    catch(e) {
        fillBoxAddModify({ error : e })
    }

    $('.loadingbackground').hide()
}

async function toggleIsGroupe() {
    const divAddListeProduits = document.getElementById('divAddListeProduits')

    if(divAddListeProduits.style.display === 'none') {
        await fillSelectProduits()
        divAddListeProduits.style.display = 'block'
    }
    else {
        divAddListeProduits.style.display = 'none'
        const listeLi = document.querySelectorAll('#listeProduits li')
        if(listeLi && listeLi.length > 0) {
            for(const li of listeLi) {
                li.parentNode.removeChild(li)
            }
        }
    }
}

function addSelectedProduit() {
    const selectedProduit = document.querySelector('#selectProduit option:checked:enabled')
    
    if(selectedProduit) {
        const listeProduits = document.getElementById('listeProduits')

        const idProduit = selectedProduit.value.split('_')[2]
        const contentProduit = selectedProduit.innerText

        const li = clonesLiProduits.querySelector(`li[data-value="${idProduit}"]`).cloneNode(true)

        listeProduits.appendChild(li)
        btnRemoveFromListeProduitsAddEventListener(true)
        document.querySelector('#selectProduit option').selected = true
    }
}

function btnRemoveFromListeProduitsAddEventListener(last = false) {
    const listeBtn = document.querySelectorAll('#listeProduits .btnRemoveFromListeProduits')

    if(listeBtn && listeBtn.length > 0) {
        // ajout de l'event au dernier élément ajouté, ex : ajout d'une nouvelle li donc seul celui-ci n'a pas encore le listener
        if(last) {
            listeBtn[listeBtn.length - 1].onclick = removeSelectedproduit
        }
        // ajout pour tous, ex : chargement d'un produit qui est un groupe
        else {
            for(const btn of listeBtn) {
                btn.onclick = removeSelectedproduit
            }
        }
    }
}

function removeSelectedproduit({ target }) {
    const li = target.closest('li')

    if(li) {
        li.parentNode.removeChild(li)
    }
}

function cancel() {
    isUpdated = false
    document.querySelector('#formAddModify .title').innerText = CREATION
    document.getElementById('idProduit').value = ''
    document.getElementById('nomProduit').value = ''
    document.getElementById('designationProduit').value = ''
    document.getElementById('prixUnitaireProduit').value = ''

    if(document.getElementById('isGroupeProduit').checked) document.getElementById('isGroupeProduit').click()
    initTextInfos()
}

async function addModify(event) {
    event.preventDefault()

    if(formAddModify.checkValidity()) {
        $('.loadingbackground').show()

        try {
            let url = BASE_URL
            let options = undefined

            const params = {
                nom : document.getElementById('nomProduit').value,
                designation : document.getElementById('designationProduit').value,
                isGroupe : document.getElementById('isGroupeProduit').checked,
                prixUnitaire : document.getElementById('prixUnitaireProduit').value
            }

            if(document.getElementById('isGroupeProduit').checked) {
                let li_listeProduits = document.querySelectorAll('#listeProduits li')
                if(li_listeProduits.length < 1) throw "Les produits du groupe doivent être indiqués."

                li_listeProduits = Array.from(li_listeProduits)
                params.listeIdsProduits = li_listeProduits.map(li => li.getAttribute("data-value")).toString()
            }

            const id = document.getElementById('idProduit').value

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
                const { infos, produit } = await response.json()

                if(infos.message) {
                    isUpdated = true
                }

                // fillBoxAddModify(infos, produit)
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
        $('.loadingbackground').show()
        showAddProduit()
        try {
            const response = await fetch(`${BASE_URL}/${id}`)
            if(!response.ok) throw "Une erreur est survenue lors de la récupération du produit."
            else if(response.status === 401) {
                alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
                location.reload()
            }
            else {
                const { infos, produit } = await response.json()

                fillBoxAddModify(infos, produit)
            }
        }
        catch(e) {
            fillBoxAddModify({ error : e })
        }
    }
}

async function remove({ target }) {
    const id = target.closest('tr').getAttribute('id').split('_')[1]
    
    if(id && confirm("Êtes-vous sûr de vouloir supprimer le produit?")) {
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
            if(!response.ok) throw "Une erreur est survenue lors de la demande de suppression du produit."
            else if(response.status === 401) {
                alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
                location.reload()
            }
            else {
                const { infos, produit } = await response.json()

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