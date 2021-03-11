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
            // loadBDCs()
        ])

        afficheVentes(reqVentes.infos, reqVentes.ventes)
        // afficheBDCs(reqBDCs.infos, reqBDCs.bdcs)
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
                        <td></td>
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
    let bdcs = undefined

    try {
        const response = await fetch('/adv/bdc/all')
        if(!response.ok) throw generalError

        const data = await response.json()
        infos = data.infos
        bdcs = data.bdcs
    }
    catch(e) {
        bdcs = undefined
        infos = { error : e }
    }

    return {
        infos,
        bdcs
    }
}

function afficheBDCs(infos, bdcs) {
    try {
        if(infos && infos.error) throw infos.error

        const table = document.getElementById('tableBDCs')
        table.innerHTML = ''

        if(infos && infos.message) {
            trEmptyTableVentes.getElementsByTagName('td')[0].innerText = infos.message
            table.appendChild(trEmptyTableVentes)
        }
        else if(bdcs && bdcs.length) {
            for(const bdc of bdcs) {
                table.innerHTML += `
                    <tr id="bdc_${bdc.id}">
                        <td>${moment(bdc.createdAt).format('DD/MM/YYYY')}</td>
                        <td>${bdc.ref}</td>
                        <td>${bdc.prixHT}</td>
                        <td>${bdc.User.prenom} ${bdc.User.nom}</td>
                        <td>${bdc.Client.prenom} ${bdc.Client.nom}</td>
                        <td>${bdc.Client.cp}</td>
                        <td>${bdc.Client.ville}</td>
                        <td></td>
                    </tr>
                `
            }
        }
        else {
            trEmptyTableVentes.getElementsByTagName('td')[0].innerText = "Aucune bon de commande disponible."
            table.appendChild(trEmptyTableVentes)
        }
    }
    catch(e) {
        setErrorMessage('BDCs', e)
    }
}