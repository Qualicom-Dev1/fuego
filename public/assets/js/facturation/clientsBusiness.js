const BASE_URL = '/facturation/clientsBusiness'
const SVGPLUS = 'fa-plus'
const SVGMOINS = 'fa-minus'
const CREATION = 'Création'
const MODIFICATION = 'Modification'
const formAddModify = document.getElementById('formAddModify')

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

    document.getElementById('btnShowAddClient').onclick = switchAddClient
}

function showAddClient() {
    const boxCreateModify = document.querySelector('.boxCreateModify')
    const btnShowAddClient = document.querySelector('#btnShowAddClient svg')

    boxCreateModify.style.display = 'flex'
    btnShowAddClient.classList.remove(SVGPLUS)
    btnShowAddClient.classList.add(SVGMOINS) 
}

function hideAddClient() {
    const boxCreateModify = document.querySelector('.boxCreateModify')
    const btnShowAddClient = document.querySelector('#btnShowAddClient svg')

    boxCreateModify.style.display = 'none'
    btnShowAddClient.classList.remove(SVGMOINS)
    btnShowAddClient.classList.add(SVGPLUS)   
}

function switchAddClient() {
    if(document.querySelector('.boxCreateModify').style.display === 'none') {
        showAddClient()
    }
    else {
        hideAddClient()
    }
}

function fillBoxAddModify(infos = undefined, client = undefined) {
    initTextInfos()

    const title = document.querySelector('#formAddModify .title')

    if(infos) {
        fillTextInfos(infos)
    }

    if(client) {
        title.innerText = MODIFICATION

        document.getElementById('idClient').value = client.id
        document.getElementById('nomClient').value = client.nom
        document.getElementById('adresseClient').value = client.adresse
        document.getElementById('adresseClientComplement1').value = client.adresseComplement1
        document.getElementById('adresseClientComplement2').value = client.adresseComplement2
        document.getElementById('cpClient').value = client.cp
        document.getElementById('villeClient').value = client.ville
        document.getElementById('emailClient').value = client.email
        document.getElementById('telephoneClient').value = client.telephone
        document.getElementById('numeroTVAClient').value = client.numeroTVA
    }
    
    if(!infos && !client) {
        title.innerText = CREATION
    }

    $('.loadingbackground').hide()
}

function cancel() {
    isUpdated = false
    document.querySelector('#formAddModify .title').innerText = CREATION
    document.getElementById('idClient').value = ''
    document.getElementById('nomClient').value = ''
    document.getElementById('adresseClient').value = ''
    document.getElementById('adresseClientComplement1').value = ''
    document.getElementById('adresseClientComplement2').value = ''
    document.getElementById('cpClient').value = ''
    document.getElementById('villeClient').value = ''
    document.getElementById('emailClient').value = ''
    document.getElementById('telephoneClient').value = ''
    document.getElementById('numeroTVAClient').value = ''
}

async function addModify(event) {
    event.preventDefault()

    if(formAddModify.checkValidity()) {
        $('.loadingbackground').show()

        let url = BASE_URL
        let options = undefined

        const params = {
            nom : document.getElementById('nomClient').value,
            adresse : document.getElementById('adresseClient').value,
            adresseComplement1 : document.getElementById('adresseClientComplement1').value,
            adresseComplement2 : document.getElementById('adresseClientComplement2').value,
            cp : document.getElementById('cpClient').value,
            ville : document.getElementById('villeClient').value,
            email : document.getElementById('emailClient').value,
            telephone : document.getElementById('telephoneClient').value,
            numeroTVA : document.getElementById('numeroTVAClient').value,
        }

        const id = document.getElementById('idClient').value

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

        try {
            const response = await fetch(url, options)
            if(!response.ok) throw "Une erreur est survenue lors de l'envoie du formulaire."
            else if(response.status === 401) {
                alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
                location.reload()
            }
            else {
                const { infos, client } = await response.json()

                if(infos.message) {
                    isUpdated = true
                }

                fillBoxAddModify(infos, client)
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
        showAddClient()
        try {
            const response = await fetch(`${BASE_URL}/${id}`)
            if(!response.ok) throw "Une erreur est survenue lors de la récupération du client."
            else if(response.status === 401) {
                alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
                location.reload()
            }
            else {
                const { infos, client } = await response.json()

                fillBoxAddModify(infos, client)
            }
        }
        catch(e) {
            fillBoxAddModify({ error : e })
        }
    }
}

async function remove({ target }) {
    const id = target.closest('tr').getAttribute('id').split('_')[1]
    
    if(id && confirm("Êtes-vous sûr de vouloir supprimer le client?")) {
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
            if(!response.ok) throw "Une erreur est survenue lors de la récupération du client."
            else if(response.status === 401) {
                alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
                location.reload()
            }
            else {
                const { infos, client } = await response.json()

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