const BASE_URL = '/facturation/typesPaiement'
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
}

function fillBoxAddModify(infos = undefined, typePaiement = undefined) {
    initTextInfos()

    const title = document.querySelector('#formAddModify .title')

    if(infos) {
        fillTextInfos(infos)
    }

    if(typePaiement) {
        title.innerText = MODIFICATION

        document.getElementById('idTypePaiement').value = typePaiement.id
        document.getElementById('nomTypePaiement').value = typePaiement.nom
    }
    
    if(!infos && !typePaiement) {
        title.innerText = CREATION
    }

    $('.loadingbackground').hide()
}

function cancel() {
    isUpdated = false
    document.querySelector('#formAddModify .title').innerText = CREATION
    document.getElementById('idTypePaiement').value = ''
    document.getElementById('nomTypePaiement').value = ''
}

async function addModify(event) {
    event.preventDefault()

    if(formAddModify.checkValidity()) {
        $('.loadingbackground').show()

        let url = BASE_URL
        let options = undefined

        const params = {
            nom : document.getElementById('nomTypePaiement').value
        }

        const id = document.getElementById('idTypePaiement').value

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
                const { infos, typePaiement } = await response.json()

                if(infos.message) {
                    isUpdated = true
                }

                fillBoxAddModify(infos, typePaiement)
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
        try {
            const response = await fetch(`${BASE_URL}/${id}`)
            if(!response.ok) throw "Une erreur est survenue lors de la récupération du moyen de paiement."
            else if(response.status === 401) {
                alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
                location.reload()
            }
            else {
                const { infos, typePaiement } = await response.json()

                fillBoxAddModify(infos, typePaiement)
            }
        }
        catch(e) {
            fillBoxAddModify({ error : e })
        }
    }
}

async function remove({ target }) {
    const id = target.closest('tr').getAttribute('id').split('_')[1]
    
    if(id && confirm("Êtes-vous sûr de vouloir supprimer le moyen de paiement?")) {
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
            if(!response.ok) throw "Une erreur est survenue lors de la récupération du moyen de paiement."
            else if(response.status === 401) {
                alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
                location.reload()
            }
            else {
                const { infos, typePaiement } = await response.json()

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