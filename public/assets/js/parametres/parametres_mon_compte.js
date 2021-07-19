let formMonCompte = undefined

window.addEventListener('load', async () => {
    formMonCompte = document.getElementById('formMonCompte')
    formMonCompte.addEventListener('submit', updateInformations)
    $('.loadingbackground').hide()
})

async function updateInformations(event) {
    event.preventDefault()

    if(formMonCompte.checkValidity()) {
        $('.loadingbackground').show()
        removeErrorMessage()

        try {
            const url = '/parametres/mon_compte/update'
            const option = {
                method : 'POST',
                headers : new Headers({
                    "Content-type" : "application/json"
                }),
                body : JSON.stringify({
                    nom : document.querySelector('input[name=nom]').value,
                    prenom : document.querySelector('input[name=prenom]').value,
                    tel1 : document.querySelector('input[name=tel1]').value,
                    tel2 : document.querySelector('input[name=tel2]').value,
                    mail : document.querySelector('input[name=mail]').value,
                    adresse : document.querySelector('input[name=adresse]').value,
                    dep : document.querySelector('input[name=dep]').value,
                    telcall : document.querySelector('input[name=telcall]').value,
                    billing : document.querySelector('input[name=billing]').value,
                })
            }

            const response = await fetch(url, option)
            if(!response.ok) throw generalError
            else if(response.status === 401) {
                alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
                location.reload()
            }
            else {
                const { infos } = await response.json()
                if(infos && infos.error) throw infos.error
                if(infos && infos.message) setInformationMessage(infos.message)
            }
        }
        catch(e) {
            setErrorMessage(e)
        }
        finally {
            $('.loadingbackground').hide()
        }
    }
    else {
        formMonCompte.reportValidity()
    }
}

function setErrorMessage(message) {
    const div = document.getElementById(`div_info`)
    const p = div.getElementsByTagName('p')[0]

    p.classList.add('error_message')
    p.innerText = message
    div.style.display = 'block'
}

function setInformationMessage(message) {
    const div = document.getElementById(`div_info`)
    const p = div.getElementsByTagName('p')[0]

    p.classList.add('info_message')
    p.innerText = message
    div.style.display = 'block'
}

function removeErrorMessage() {
    const div = document.getElementById(`div_info`)
    const p = div.getElementsByTagName('p')[0]

    p.innerText = ''
    p.classList.remove('error_message')
    p.classList.remove('info_message')
    div.style.display = 'none'
}