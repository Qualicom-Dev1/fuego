let trEmptyTableVentes = undefined
let trEmptyTableBDCs = undefined

window.addEventListener('load', async () => {
    await initDocument()
    $('.loadingbackground').hide()
})

async function initDocument() {
    trEmptyTableVentes = document.getElementById('trEmptyTableVentes')
    trEmptyTableBDCs = document.getElementById('trEmptyTableBDCs')

    await refreshPageContent()
}

async function refreshPageContent() {
    $('.loadingbackground').show()

    try {
        const [reqVentes, reqBDCs] = await Promise.all([
            loadVentes(),
            loadBDCs()
        ])

        afficheVentes(reqVentes.infos, reqVentes.ventes)
        afficheBDCs(reqBDCs.infos, reqBDCs.listeBDCs)
    }
    catch(e) {
        console.error(e)
    }
    finally {
        $('.loadingbackground').hide()
    }
}

function setErrorMessage(element, message) {
    if(element === undefined || !['generale', 'ventes', 'BDCs'].includes(element)) element = 'generale'

    const div = document.getElementById(`div_info_${element}`)
    const p = div.getElementsByTagName('p')[0]

    p.classList.add('error_message')
    p.innerText = message
    div.style.display = 'block'
}

function setInformationMessage(element, message) {
    if(element === undefined || !['generale', 'ventes', 'BDCs'].includes(element)) element = 'generale'

    const div = document.getElementById(`div_info_${element}`)
    const p = div.getElementsByTagName('p')[0]

    p.classList.add('info_message')
    p.innerText = message
    div.style.display = 'block'
}

function removeErrorMessage(element) {
    if(element === undefined || !['generale', 'ventes', 'BDCs'].includes(element)) element = 'generale'

    const div = document.getElementById(`div_info_${element}`)
    const p = div.getElementsByTagName('p')[0]

    p.innerText = ''
    p.classList.remove('error_message')
    p.classList.remove('info_message')
    div.style.display = 'none'
}

async function loadVentes() {
    let infos = undefined
    let ventes = undefined

    try {
        const response = await fetch('/adv/ventes/all')
        if(!response.ok) throw generalError

        const data = await response.json()
        infos = data.infos
        ventes = data.ventes
    }
    catch(e) {
        ventes = undefined
        infos = { error : e }
    }

    return {
        infos,
        ventes
    }
}

function afficheVentes(infos, ventes) {
    try {
        if(infos && infos.error) throw infos.error

        const table = document.getElementById('tableVentes')
        table.innerHTML = ''

        if(infos && infos.message) {
            trEmptyTableVentes.getElementsByTagName('td')[0].innerText = infos.message
            table.appendChild(trEmptyTableVentes)
        }
        else if(ventes && ventes.length) {
            for(const vente of ventes) {
                table.innerHTML += `
                    <tr id="vente_${vente.id}">
                        <td>${vente.date}</td>
                        <td>${vente.montantVente ? vente.montantVente : '-'}</td>
                        <td>${vente.User.prenom} ${vente.User.nom}</td>
                        <td>${vente.Client.prenom} ${vente.Client.nom}</td>
                        <td>${vente.Client.cp}</td>
                        <td>${vente.Client.ville}</td>
                        <td class="td_options">
                            <a href="/adv/bdc/create/${vente.id}" title="Créer le bon de commande"><i class="fas fa-file-invoice-dollar btn_item2 hover_btn3"></i></a>                            
                            <button onclick="retireVente(this);" type="button" title="Retirer la vente"><i class="fas fa-times btn_item2 hover_btn3"></i></button>                            
                        </td>
                    </tr>
                `
            }
        }
        else {
            trEmptyTableVentes.getElementsByTagName('td')[0].innerText = "Aucune vente disponible."
            table.appendChild(trEmptyTableVentes)
        }
    }
    catch(e) {
        setErrorMessage('ventes', e)
    }
}

async function loadBDCs() {
    let infos = undefined
    let listeBDCs = undefined

    try {
        const response = await fetch('/adv/bdc/all')
        if(!response.ok) throw generalError

        const data = await response.json()
        infos = data.infos
        listeBDCs = data.listeBDCs
    }
    catch(e) {
        listeBDCs = undefined
        infos = { error : e }
    }

    return {
        infos,
        listeBDCs
    }
}

function afficheBDCs(infos, listeBDCs) {
    try {
        if(infos && infos.error) throw infos.error

        const table = document.getElementById('tableBDCs')
        table.innerHTML = ''

        if(infos && infos.message) {
            trEmptyTableBDCs.getElementsByTagName('td')[0].innerText = infos.message
            table.appendChild(trEmptyTableBDCs)
        }
        else if(listeBDCs && listeBDCs.length) {
            for(const bdc of listeBDCs) {
                let afficheEtat = 'En attente'
                if(bdc.isCanceled) afficheEtat = 'Annulé'
                else if(bdc.isValidated) afficheEtat = "Validé"

                let afficheClient = `${bdc.client.prenom1} ${bdc.client.nom1}`
                if(bdc.client.prenom2 && bdc.client.nom2) afficheClient += ` et ${bdc.client.prenom2} ${bdc.client.nom2}`

                let tdOptionContent = ''
                // récupération pdf
                if(bdc.isValidated && !bdc.isCanceled) {                        
                    tdOptionContent += `<a href="/adv/bdc/${bdc.id}/pdf" target="_blank" title="Ouvrir le pdf"><i class="fas fa-file-pdf btn_item2 hover_btn3"></i></a>`
                }
                // envoie relance
                if(!bdc.isValidated && !bdc.isCanceled) {
                    tdOptionContent += `<button onclick="relanceBDC(this);" type="button" title="Envoyer une relance"><i class="fas fa-redo btn_item2 hover_btn3"></i></button>`
                }
                // annule
                if(!bdc.isCanceled) {
                    tdOptionContent += `<button onclick="annuleBDC(this);" type="button" title="Annuler le bon de commande"><i class="fas fa-times btn_item2 hover_btn3"></i></button>`
                }
                if(tdOptionContent === '') tdOptionContent = '-'

                table.innerHTML += `
                    <tr id="bdc_${bdc.id}">
                        <td>${bdc.ficheAcceptation.date}</td>
                        <td>${bdc.ref}</td>
                        <td>${bdc.prixTTC}</td>
                        <td>${afficheEtat}</td>
                        <td>${bdc.vendeur.prenom} ${bdc.vendeur.nom}</td>
                        <td>${afficheClient}</td>
                        <td>${bdc.client.cp}</td>
                        <td>${bdc.client.ville}</td>
                        <td class="td_options">${tdOptionContent}</td>
                    </tr>
                `
            }
        }
        else {
            trEmptyTableBDCs.getElementsByTagName('td')[0].innerText = "Aucune bon de commande disponible."
            table.appendChild(trEmptyTableBDCs)
        }
    }
    catch(e) {
        setErrorMessage('BDCs', e)
    }
}

async function retireVente(elt) {
    const tr = elt.closest('tr')
    
    if(tr && tr.getAttribute('id')) {
        const Id_Vente = tr.getAttribute('id').split('_')[1]

        if(Id_Vente) {
            $('.loadingbackground').show()
            removeErrorMessage('ventes')

            try {
                const response = await fetch(`/adv/ventes/${Id_Vente}/retirer`, {
                    method : 'POST',
                    headers : new Headers({
                        "Content-type" : "application/json"
                    })
                })

                if(!response.ok) throw generalError
                else if(response.status === 401) {
                    alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
                    location.reload()
                }
                else {
                    const { infos } = await response.json()
                    if(infos && infos.error) throw infos.error

                    setInformationMessage('ventes', infos.message)
                    await refreshPageContent()
                }
            }
            catch(e) {
                setErrorMessage('ventes', e)
            }
            finally {
                $('.loadingbackground').hide()
            }
        }
    }
}

async function relanceBDC(elt) {
    const tr = elt.closest('tr')
    
    if(tr && tr.getAttribute('id')) {
        const Id_BDC = tr.getAttribute('id').split('_')[1]

        if(Id_BDC) {
            $('.loadingbackground').show()
            removeErrorMessage('BDCs')

            try {
                const response = await fetch(`/adv/bdc/${Id_BDC}/relance`, {
                    method : 'POST',
                    headers : new Headers({
                        "Content-type" : "application/json"
                    })
                })

                if(!response.ok) throw generalError
                else if(response.status === 401) {
                    alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
                    location.reload()
                }
                else {
                    const { infos } = await response.json()
                    if(infos && infos.error) throw infos.error

                    setInformationMessage('BDCs', infos.message)
                }
            }
            catch(e) {
                setErrorMessage('BDCs', e)
            }
            finally {
                $('.loadingbackground').hide()
            }
        }
    }
}

async function annuleBDC(elt) {
    const tr = elt.closest('tr')
    
    if(tr && tr.getAttribute('id')) {
        const Id_BDC = tr.getAttribute('id').split('_')[1]

        if(Id_BDC && confirm("Êtes-vous sûr de vouloir annuler ce bon de commande?")) {
            $('.loadingbackground').show()
            removeErrorMessage('BDCs')

            try {
                const response = await fetch(`/adv/bdc/${Id_BDC}/cancel`, {
                    method : 'PATCH',
                    headers : new Headers({
                        "Content-type" : "application/json"
                    })
                })

                if(!response.ok) throw generalError
                else if(response.status === 401) {
                    alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
                    location.reload()
                }
                else {
                    const { infos } = await response.json()
                    if(infos && infos.error) throw infos.error

                    setInformationMessage('BDCs', infos.message)
                    await refreshPageContent()
                }
            }
            catch(e) {
                setErrorMessage('BDCs', e)
            }
            finally {
                $('.loadingbackground').hide()
            }
        }
    }
}