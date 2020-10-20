const BASE_URL = '/facturation/prestations'
const SVGPLUS = 'fa-plus'
const SVGMOINS = 'fa-minus'
const CREATION = 'Création'
const MODIFICATION = 'Modification'
const formAddModify = document.getElementById('formAddModify')
const clonesTrProduits = document.getElementById('clonesTrProduits')

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

    const liste_btnToDevis = document.querySelectorAll('.btnToDevis')
    if(liste_btnToDevis && liste_btnToDevis.length > 0) {
        for(const btn of liste_btnToDevis) {
            btn.onclick = toDevis
        }
    }

    const liste_btnToFacture = document.querySelectorAll('.btnToFacture')
    if(liste_btnToFacture && liste_btnToFacture.length > 0) {
        for(const btn of liste_btnToFacture) {
            btn.onclick = toFacture
        }
    }

    const liste_btnRemove = document.querySelectorAll('.btnRemove')
    if(liste_btnRemove && liste_btnRemove.length > 0) {
        for(const btn of liste_btnRemove) {
            btn.onclick = remove
        }
    }

    document.getElementById('btnShowAddPrestation').onclick = switchAddPrestation

    document.getElementById('checkPrestationAuto').onclick = toggleIsPrestationAuto

    document.getElementById('btnAddToListeProduits').onclick = addSelectedProduit

    document.getElementById('generatePrestationAuto').onclick = generatePrestationAuto
}

async function showAddPrestation() {
    const boxCreateModify = document.querySelector('.boxCreateModify')
    const btnShowAddPrestation = document.querySelector('#btnShowAddPrestation svg')

    await loadContentBox()

    boxCreateModify.style.display = 'flex'
    btnShowAddPrestation.classList.remove(SVGPLUS)
    btnShowAddPrestation.classList.add(SVGMOINS) 
    btnShowAddPrestation.setAttribute('title', "Fermer le volet de création")
}

function hideAddPrestation() {
    const boxCreateModify = document.querySelector('.boxCreateModify')
    const btnShowAddPrestation = document.querySelector('#btnShowAddPrestation svg')

    boxCreateModify.style.display = 'none'
    btnShowAddPrestation.classList.remove(SVGMOINS)
    btnShowAddPrestation.classList.add(SVGPLUS)   
    btnShowAddPrestation.setAttribute('title', "Ouvrir le volet de création")    
}

function switchAddPrestation() {
    if(document.querySelector('.boxCreateModify').style.display === 'none') {
        showAddPrestation()
    }
    else {
        hideAddPrestation()
    }
}

async function loadContentBox() {
    $('.loadingbackground').show()

    await Promise.all([
        fillSelectClients(),
        fillSelectPoles(),
        fillSelectProduits()
    ])    

    $('.loadingbackground').hide()
}

async function fillBoxAddModify(infos = undefined, prestation = undefined) {
    try {
        initTextInfos()

        const title = document.querySelector('#formAddModify .title')

        if(infos) {
            fillTextInfos(infos)
        }

        if(prestation) {
            title.innerText = MODIFICATION

            if(prestation.id) document.getElementById('idPrestation').value = prestation.id
            if(prestation.token) document.getElementById('token').value = prestation.token
            if(prestation.ClientBusiness) document.querySelector(`#selectClientPrestation option[value="select_client_${prestation.ClientBusiness.id}"]`).selected = true
            if(prestation.Pole) document.querySelector(`#selectPolePrestation option[value="select_pole_${prestation.Pole.id}"]`).selected = true

            if(prestation.RDVsFacturation_Prestation) {
                if(!document.getElementById('checkPrestationAuto').checked) document.getElementById('checkPrestationAuto').click()
                document.getElementById('dateDebut').value = prestation.RDVsFacturation_Prestation.dateDebut
                document.getElementById('dateFin').value = prestation.RDVsFacturation_Prestation.dateFin
            }

            const listeProduits = prestation.ProduitsBusiness ? prestation.ProduitsBusiness : (prestation.listeProduits ? prestation.listeProduits : [])

            for(const produit of listeProduits) {
                const listeProduits = document.getElementById('listeProduits')

                const tr = clonesTrProduits.querySelector(`tr[data-value="${produit.id}"]`).cloneNode(true)

                const { designation, quantite, prixUnitaire } = produit.ProduitBusiness_Prestation ? produit.ProduitBusiness_Prestation : produit

                if(designation) tr.querySelector('.td_designation input').value = designation
                if(quantite) tr.querySelector('.td_quantite input').value = quantite
                if(prixUnitaire) tr.querySelector('.td_prixUnitaire input').value = prixUnitaire

                listeProduits.appendChild(tr)
                btnRemoveFromListeProduitsAddEventListener(true)
            }
        }
        
        if(!infos && !prestation) {
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

function createListeClonesTr(produits) {
    if(produits && produits.length > 0) {
        for(const produit of produits) {
            const tr = document.createElement('tr')
            tr.setAttribute('data-value', produit.id)
            tr.innerHTML = `
                <td class="td_nom"><a href="/facturation/ProduitsBusiness#produit_${produit.id}" target="_blank">${produit.nom}</a></td>
                <td class="td_designation"><input type="text" placeholder="SMS de confirmation 140 caractères - Envoi le jour du RDV" value="${produit.designation ? produit.designation : ''}"></td>
                <td class="td_quantite"><input type="number" placeholder="1" step="1" min="1" value="" required></td>
                <td class="td_prixUnitaire"><input type="number" placeholder="0.5" step=".01" min=".01" value="${produit.prixUnitaire}"></td>
                <td class="td_option"><button class="btnRemoveFromListeProduits" type="button" title="Retirer"><i class="fas fa-minus btn_item2 hover_btn3"></i></button></td>
            `
            clonesTrProduits.appendChild(tr)
        }
    }
}

function emptyListeClonesTr() {
    document.getElementById('clonesTrProduits').innerHTML = ''
}

async function fillSelectClients() {
    const selectClient = document.getElementById('selectClientPrestation')
    emptySelect('selectClientPrestation')

    try {
        const response = await fetch(`/facturation/clientsBusiness/all`)
        if(!response.ok) throw "Une erreur est survenue lors de la récupération des clients."
            else if(response.status === 401) {
                alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
                location.reload()
            }
            else {
                const { infos, clients } = await response.json()

                if(infos && infos.error) throw infos.error

                for(const client of clients) {
                    const opt = document.createElement("option")
                    opt.value = `select_client_${client.id}`
                    opt.text = client.nom

                    selectClient.append(opt)
                }
            }
    }
    catch(e) {
        fillBoxAddModify({ error : e })
    }
}

async function fillSelectPoles() {
    const selectPole = document.getElementById('selectPolePrestation')
    emptySelect('selectPolePrestation')

    try {
        const response = await fetch(`/facturation/poles/all`)
        if(!response.ok) throw "Une erreur est survenue lors de la récupération des pôles."
            else if(response.status === 401) {
                alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
                location.reload()
            }
            else {
                const { infos, poles } = await response.json()

                if(infos && infos.error) throw infos.error

                for(const pole of poles) {
                    const opt = document.createElement("option")
                    opt.value = `select_pole_${pole.id}`
                    opt.text = pole.nom

                    selectPole.append(opt)
                }
            }
    }
    catch(e) {
        fillBoxAddModify({ error : e })
    }
}

async function fillSelectProduits() {
    const selectProduit = document.getElementById('selectProduit')
    emptySelect('selectProduit')
    emptyListeClonesTr()

    try {
        const response = await fetch(`/facturation/produitsBusiness/all`)
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

                createListeClonesTr(produits)
            }
    }
    catch(e) {
        fillBoxAddModify({ error : e })
    }
}

async function toggleIsPrestationAuto() {
    const divSelectDatePrestationAuto = document.getElementById('divSelectDatePrestationAuto')

    if(divSelectDatePrestationAuto.style.display === 'none') {
        divSelectDatePrestationAuto.style.display = 'flex'
    }
    else {
        divSelectDatePrestationAuto.style.display = 'none'
    }
}

async function generatePrestationAuto() {
    $('.loadingbackground').show()

    const dateDebut = document.getElementById('dateDebut').value
    const dateFin = document.getElementById('dateFin').value

    try {
        if(dateDebut === "" || dateFin === "") throw "Les dates de début et de fin doivent être fournies."

        const response = await fetch(`${BASE_URL}/generate-auto?dateDebut=${dateDebut}&dateFin=${dateFin}`)
        if(!response.ok) throw "Une erreur est survenue lors de la récupération des produits de la prestation automatique TMK."
            else if(response.status === 401) {
                alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
                location.reload()
            }
            else {
                const { infos, prestation, token } = await response.json()

                if(infos && infos.error) throw infos.error

                prestation.token = token
                fillBoxAddModify(infos, prestation)
            }
    }
    catch(e) {
        fillBoxAddModify({ error : e })
    }
}

function addSelectedProduit() {
    const selectedProduit = document.querySelector('#selectProduit option:checked:enabled')
    
    if(selectedProduit) {
        const listeProduits = document.getElementById('listeProduits')

        const idProduit = selectedProduit.value.split('_')[2]

        const tr = clonesTrProduits.querySelector(`tr[data-value="${idProduit}"]`).cloneNode(true)

        listeProduits.appendChild(tr)
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
    const tr = target.closest('tr')

    if(tr) {
        tr.parentNode.removeChild(tr)
    }
}

function cancel() {
    isUpdated = false
    document.querySelector('#formAddModify .title').innerText = CREATION
    document.getElementById('idPrestation').value = ''
    document.getElementById('token').value = ''
    document.querySelector('#selectClientPrestation option:disabled').selected = true
    document.querySelector('#selectPolePrestation option:disabled').selected = true
    document.querySelector('#selectProduit option:disabled').selected = true

    if(document.getElementById('checkPrestationAuto').checked) document.getElementById('checkPrestationAuto').click()
    document.getElementById('listeProduits').innerHTML = ""
    initTextInfos()
}

async function addModify(event) {
    event.preventDefault()

    if(formAddModify.checkValidity()) {
        $('.loadingbackground').show()

        try {
            let url = BASE_URL
            let options = undefined

            if(document.querySelector('#selectClientPrestation option:checked:enabled') === null) throw "Un client doit être sélectionné."
            if(document.querySelector('#selectPolePrestation option:checked:enabled') === null) throw "Un pôle doit être sélectionné."
            if(document.querySelectorAll('#listeProduits tr').length < 1) throw "La prestation ne peut pas être vide."

            const token = document.getElementById('token').value
            const idClient = document.querySelector('#selectClientPrestation option:checked:enabled').value.split('_')[2]
            const idPole = document.querySelector('#selectPolePrestation option:checked:enabled').value.split('_')[2]

            let listeProduits = Array.from(document.querySelectorAll('#listeProduits tr'))
            listeProduits = listeProduits.map(tr => {
                const id = tr.getAttribute('data-value')
                const designation = tr.querySelector('.td_designation input').value
                const quantite = tr.querySelector('.td_quantite input').value
                const prixUnitaire = tr.querySelector('.td_prixUnitaire input').value

                return {
                    id,
                    designation,
                    quantite,
                    prixUnitaire
                }
            })

            const params = {
                token,
                idClient,
                idPole,
                listeProduits
            }

            const id = document.getElementById('idPrestation').value

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
                const { infos, prestation } = await response.json()

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
        await showAddPrestation()
        $('.loadingbackground').show()
        try {
            const response = await fetch(`${BASE_URL}/${id}`)
            if(!response.ok) throw "Une erreur est survenue lors de la récupération de la prestation."
            else if(response.status === 401) {
                alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
                location.reload()
            }
            else {
                const { infos, prestation } = await response.json()

                fillBoxAddModify(infos, prestation)
            }
        }
        catch(e) {
            fillBoxAddModify({ error : e })
        }
    }
}

async function remove({ target }) {
    const id = target.closest('tr').getAttribute('id').split('_')[1]
    
    if(id && confirm("Êtes-vous sûr de vouloir supprimer la prestation?")) {
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
            if(!response.ok) throw "Une erreur est survenue lors de la demande de suppression de la prestation."
            else if(response.status === 401) {
                alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
                location.reload()
            }
            else {
                const { infos, prestation } = await response.json()

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

function toDevis({ target }) {
    const id = target.closest('tr').getAttribute('id').split('_')[1]
    sessionStorage.setItem('idPrestation', id)

    window.location = '/facturation/devis'
}

function toFacture({ target }) {
    const id = target.closest('tr').getAttribute('id').split('_')[1]
    sessionStorage.setItem('idPrestation', id)

    window.location = '/facturation/factures'
}