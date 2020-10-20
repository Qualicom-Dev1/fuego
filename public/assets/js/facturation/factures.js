const BASE_URL = '/facturation/factures'
const SVGPLUS = 'fa-plus'
const SVGMOINS = 'fa-minus'
const CREATION = 'Création'
const MODIFICATION = 'Modification'
const DEFAULT_TVA = 20
const DEFAULT_REMISE = 0
const formAddModify = document.getElementById('formAddModify')
const formPaiement = document.getElementById('formPaiement')
let modalPaiementAlreadyLoaded = false

window.addEventListener('load', async () => {
    initDocument()
    await prestationOrdDevisSent()
    $('.loadingbackground').hide()
})

function initDocument() {    
    formAddModify.addEventListener('submit', addModify)
    formPaiement.addEventListener('submit', paiementFacture)
    document.getElementById('btnCancel').onclick = cancel
    document.getElementById('btnCancelPaiement').onclick = closeModal
    
    const liste_btnModify = document.querySelectorAll('.btnModify')
    if(liste_btnModify && liste_btnModify.length > 0) {
        for(const btn of liste_btnModify) {
            btn.onclick = showElt
        }
    }

    const liste_btnPaiement = document.querySelectorAll('.btnPaiement')
    if(liste_btnPaiement && liste_btnPaiement.length > 0) {
        for(const btn of liste_btnPaiement) {
            btn.onclick = showPaiementFacture
        }
    }

    const liste_btnCancelFacture = document.querySelectorAll('.btnCancelFacture')
    if(liste_btnCancelFacture && liste_btnCancelFacture.length > 0) {
        for(const btn of liste_btnCancelFacture) {
            btn.onclick = cancelFacture
        }
    }

    document.getElementById('btnShowAddFacture').onclick = switchAddFacture

    document.getElementById('selectTypeFacture').onchange = switchType
    document.getElementById('checkPrestationOrDevis').onchange = switchPrestationOrDevis
    document.getElementById('selectFactureFacture').onchange = selectFacture
    document.getElementById('selectPrestationFacture').onchange = selectPrestation
    document.getElementById('selectDevisFacture').onchange = selectDevis

    document.getElementById('remiseFacture').onblur = calculPrix
    document.getElementById('valeurAcompteFacture').onblur = calculPrix
    document.getElementById('tvaFacture').onblur = calculPrix
    document.getElementById('prixHTFacture').onblur = calculPrix
    document.querySelectorAll('input[name=isAcomptePourcentageFacture]').forEach(input => input.onclick = calculPrix)

    window.onclick = (event) => {
        if(event.target == document.querySelector('div.jquery-modal.blocker.current')) {
            initModal()
        }
    }
}

// création d'une facture depuis une prestation ou un devis déjà défnie
async function prestationOrdDevisSent() {
    const idPrestation = sessionStorage.getItem('idPrestation')
    const idDevis = sessionStorage.getItem('idDevis')
    sessionStorage.removeItem('idPrestation')
    sessionStorage.removeItem('idDevis')

    if(idPrestation !== null || idDevis !== null) {
        await showAddFacture()

        try {
            if(idPrestation) {
                document.getElementById('checkPrestationOrDevis').checked = false
                await document.getElementById('checkPrestationOrDevis').onchange()

                const option = document.querySelector(`#selectPrestationFacture option[value="select_prestation_${idPrestation}"]`)
                if(option === null) throw "Une erreur est survenue, la prestation demandée n'existe pas."

                option.selected = true
                await document.getElementById('selectPrestationFacture').onchange()
            }
            if(idDevis) {
                document.getElementById('checkPrestationOrDevis').checked = true
                await document.getElementById('checkPrestationOrDevis').onchange()

                const option = document.querySelector(`#selectDevisFacture option[value="select_devis_${idDevis}"]`)
                if(option === null) throw "Une erreur est survenue, le devis demandé n'existe pas."

                option.selected = true
                await document.getElementById('selectDevisFacture').onchange()
            }
        }
        catch(e) {
            fillTextInfos({ error : e })
        }     
    }
}

async function showAddFacture() {
    const boxCreateModify = document.querySelector('.boxCreateModify')
    const btnShowAddFacture = document.querySelector('#btnShowAddFacture svg')

    await loadContentBox()

    boxCreateModify.style.display = 'flex'
    btnShowAddFacture.classList.remove(SVGPLUS)
    btnShowAddFacture.classList.add(SVGMOINS) 
    btnShowAddFacture.setAttribute('title', "Fermer le volet de création")
}

function hideAddFacture() {
    const boxCreateModify = document.querySelector('.boxCreateModify')
    const btnShowAddFacture = document.querySelector('#btnShowAddFacture svg')

    boxCreateModify.style.display = 'none'
    btnShowAddFacture.classList.remove(SVGMOINS)
    btnShowAddFacture.classList.add(SVGPLUS)   
    btnShowAddFacture.setAttribute('title', "Ouvrir le volet de création")    
}

function switchAddFacture() {
    if(document.querySelector('.boxCreateModify').style.display === 'none') {
        showAddFacture()
    }
    else {
        hideAddFacture()
    }
}

async function loadContentBox() {
    $('.loadingbackground').show()

    await Promise.all([
        fillSelectPrestations(),
        fillSelectDevis()
    ])    

    $('.loadingbackground').hide()
}

function switchType() {
    resetProduits()
    resetContent()
    const type = document.querySelector('#selectTypeFacture option:checked').value

    if(type === 'solde') {
        document.getElementById('divSelectFacture').style.display = 'none'
        document.getElementById('divChoixNormal').style.display = 'block'

        document.getElementById('divRemise').style.display = "flex"
    }
    else if(type === 'acompte') {
        document.querySelectorAll('#selectFactureFacture option[data-type="acompte"]').forEach(option => option.style.display = 'none')

        document.getElementById('divAcompte').style.display = 'flex'
    }
    else if(type === 'avoir') {
        document.querySelectorAll('#selectFactureFacture option[data-type="acompte"]').forEach(option => option.style.display = 'block')        

        document.getElementById('tvaFacture').disabled = true
    }

    if(type !== 'solde') {
        document.getElementById('divChoixNormal').style.display = 'none'
        document.getElementById('divSelectFacture').style.display = 'flex'

        document.getElementById('divRemise').style.display = "none"
    }
    if(type !== 'acompte') {
        document.getElementById('divAcompte').style.display = 'none'
    }
    if(type !== 'avoir') {
        document.getElementById('tvaFacture').disabled = false

        
    }
}

function switchPrestationOrDevis() {
    resetProduits()
    resetContent()

    if(document.getElementById('checkPrestationOrDevis').checked) {
        document.getElementById('divSelectPrestationFacture').style.display = 'none'
        document.getElementById('divSelectDevisFacture').style.display = 'flex'
    }
    else {
        document.getElementById('divSelectDevisFacture').style.display = 'none'
        document.getElementById('divSelectPrestationFacture').style.display = 'flex'
    }
}

async function fillBoxAddModify(infos = undefined, facture = undefined) {
    try {
        initTextInfos()

        const title = document.querySelector('#formAddModify .title')

        if(infos) {
            fillTextInfos(infos)
        }

        if(facture) {
            title.innerText = MODIFICATION

            if(facture.id) document.getElementById('idFacture').value = facture.id            
            document.getElementById('tvaFacture').value = facture.tva ? facture.tva : DEFAULT_TVA
            document.getElementById('remiseFacture').value = facture.remise ? facture.remise : DEFAULT_REMISE
            document.getElementById('prixHTFacture').value = facture.prixHT
            document.getElementById('prixTTCFacture').value = facture.prixTTC

            // document.querySelector('#selectPrestationFacture option:enabled').selected = true
            // await document.getElementById('selectPrestationFacture').onchange()
        }
        
        if(!infos && !facture) {
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

async function fillSelectPrestations() {
    const selectPrestation = document.getElementById('selectPrestationFacture')
    emptySelect('selectPrestationFacture')

    try {
        const response = await fetch(`/facturation/prestations/all`)
        if(!response.ok) throw "Une erreur est survenue lors de la récupération des prestations."
        else if(response.status === 401) {
            alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
            location.reload()
        }
        else {
            const { infos, prestations } = await response.json()

            if(infos && infos.error) throw infos.error

            for(const prestation of prestations) {
                const opt = document.createElement("option")
                opt.value = `select_prestation_${prestation.id}`
                opt.text = `${moment(prestation.createdAt).format('DD/MM/YYYY')} - ${prestation.ClientBusiness.nom} (${prestation.Pole.nom})`

                selectPrestation.append(opt)
            }
        }
    }
    catch(e) {
        fillBoxAddModify({ error : e })
    }
}

async function fillSelectDevis() {
    const selectDevis = document.getElementById('selectDevisFacture')
    emptySelect('selectDevisFacture')

    try {
        const response = await fetch(`/facturation/devis/all`)
        if(!response.ok) throw "Une erreur est survenue lors de la récupération des devis."
        else if(response.status === 401) {
            alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
            location.reload()
        }
        else {
            const { infos, devis } = await response.json()

            if(infos && infos.error) throw infos.error

            for(const devisSimple of devis) {
                const opt = document.createElement("option")
                opt.value = `select_devis_${devisSimple.id}`
                opt.text = `${devisSimple.refDevis} du ${moment(devisSimple.createdAt).format('DD/MM/YYYY')} - ${devisSimple.Prestation.ClientBusiness.nom} - ${devisSimple.prixTTC} €`

                selectDevis.append(opt)
            }
        }
    }
    catch(e) {
        fillBoxAddModify({ error : e })
    }
}

async function selectPrestation() {
    if(document.querySelector('#selectPrestationFacture option:checked:enabled') !== null) {
        $('.loadingbackground').show()

        try {
            const idPrestation = document.querySelector('#selectPrestationFacture option:checked:enabled').value.split('_')[2]

            const response = await fetch(`/facturation/prestations/${idPrestation}`)
            if(!response.ok) throw "Une erreur est survenue lors de la récupération de la prestation."
            else if(response.status === 401) {
                alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
                location.reload()
            }
            else {
                const { infos, prestation } = await response.json()

                if(infos && infos.error) throw infos.error

                const responseResteAPayer = await fetch(`/facturation/prestations/${prestation.id}/reste-a-payer`)
                if(!response.ok) throw "Une erreur est survenue lors de la récupération du reste à payer."
                const data = await responseResteAPayer.json()
                
                if(data.infos && data.infos.error) throw data.infos.error

                document.getElementById('reste-a-payer').innerText = data.resteAPayer

                let total = 0
                document.getElementById('listeProduits').innerHTML = ""
                for(const produitsBusiness of prestation.ProduitsBusiness) {
                    const produit = produitsBusiness.ProduitBusiness_Prestation
                    
                    const sousTotal = Number(Math.round(((Number(produit.prixUnitaire) * Number(produit.quantite)) + Number.EPSILON) * 100) / 100)
                    total = Number(Math.round(((Number(total) + Number(sousTotal)) + Number.EPSILON) * 100) / 100)

                    const tr = document.createElement('tr')
                    tr.innerHTML = `
                        <td>${produit.designation}</td>
                        <td>${produit.quantite}</td>
                        <td>${produit.prixUnitaire}</td>
                        <td>${sousTotal.toFixed(2)}</td>
                    `

                    document.getElementById('listeProduits').appendChild(tr)                    
                }

                document.getElementById('estimationPrix').innerText = total.toFixed(2)
                document.getElementById('prixHTFacture').value = total.toFixed(2)
                calculPrix()
            }
        }
        catch(e) {
            fillTextInfos({ error : e })
        }        

        $('.loadingbackground').hide()
    }
}

async function selectDevis() {
    if(document.querySelector('#selectDevisFacture option:checked:enabled') !== null) {
        $('.loadingbackground').show()

        try {
            const idDevis = document.querySelector('#selectDevisFacture option:checked:enabled').value.split('_')[2]

            const response = await fetch(`/facturation/devis/${idDevis}`)
            if(!response.ok) throw "Une erreur est survenue lors de la récupération de la devis."
            else if(response.status === 401) {
                alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
                location.reload()
            }
            else {
                const { infos, devis } = await response.json()

                if(infos && infos.error) throw infos.error

                const option = document.querySelector(`#selectPrestationFacture option[value="select_prestation_${devis.Prestation.id}"]`)
                if(option === null) throw "Une erreur est survenue, la prestation correspondant à ce devis n'existe pas."

                option.selected = true
                await document.getElementById('selectPrestationFacture').onchange()

                document.getElementById('remiseFacture').value = devis.remise
                document.getElementById('tvaFacture').value = devis.tva
                document.getElementById('prixHTFacture').value = devis.prixHT
                document.getElementById('prixTTCFacture').value = devis.prixTTC
                calculPrix()
            }
        }
        catch(e) {
            fillTextInfos({ error : e })
        }        

        $('.loadingbackground').hide()
    }
}

async function selectFacture() {
    if(document.querySelector('#selectFactureFacture option:checked:enabled') !== null) {
        $('.loadingbackground').show()

        try {
            const idDevis = document.querySelector('#selectFactureFacture option:checked:enabled').value.split('_')[2]

            const response = await fetch(`${BASE_URL}/${idDevis}`)
            if(!response.ok) throw "Une erreur est survenue lors de la récupération de la facture."
            else if(response.status === 401) {
                alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
                location.reload()
            }
            else {
                const { infos, facture } = await response.json()

                if(infos && infos.error) throw infos.error                

                const option = document.querySelector(`#selectPrestationFacture option[value="select_prestation_${facture.Prestation.id}"]`)
                if(option === null) throw "Une erreur est survenue, la prestation correspondant à cette facture n'existe pas."

                option.selected = true
                await document.getElementById('selectPrestationFacture').onchange()

                // acompte
                if(document.querySelector('#selectTypeFacture option:checked').value === 'acompte') {
                    calculPrix()
                }
                // avoir
                else {
                    document.getElementById('prixHTFacture').value = facture.prixHT
                    document.getElementById('prixTTCFacture').value = facture.prixTTC
                }                
            }
        }
        catch(e) {
            fillTextInfos({ error : e })
        }        

        $('.loadingbackground').hide()
    }
}

function calculPrix() {
    const inputPrixHT = document.getElementById('prixHTFacture')
    const inputPrixTTC = document.getElementById('prixTTCFacture')
    // const estimationPrix = document.getElementById('estimationPrix').innerText
    const resteAPayer = document.getElementById('reste-a-payer').innerText

    if(document.querySelector('#selectPrestationFacture option:checked:enabled') !== null && resteAPayer !== "") {
        let prixHT = 0
        let prixTTC = 0

        const tva = document.getElementById('tvaFacture').value !== "" ? document.getElementById('tvaFacture').value : DEFAULT_TVA        

        if(document.querySelector('#selectTypeFacture option:checked').value === 'acompte') {
            const valeurAcompteFacture = document.getElementById('valeurAcompteFacture').value
            if(document.querySelector('input[name=isAcomptePourcentageFacture]:checked').value === 'true') {
                prixHT = Number(Math.round(((Number(resteAPayer) * (Number(valeurAcompteFacture) / 100)) + Number.EPSILON) * 100) / 100)
            }
            else {
                prixHT = Number(valeurAcompteFacture)
            }
        }
        else {
            const remise = document.getElementById('remiseFacture').value !== "" ? document.getElementById('remiseFacture').value : DEFAULT_REMISE
            prixHT = Number(Math.round(((Number(resteAPayer) - Number(remise)) + Number.EPSILON) * 100) / 100)
        }

        prixTTC = Number(Math.round(((Number(prixHT) * Number(1 + (Number(tva) / 100))) + Number.EPSILON) * 100) / 100)

        inputPrixHT.value = prixHT.toFixed(2)
        inputPrixTTC.value = prixTTC.toFixed(2)
    }
}

function resetType() {
    document.querySelector('#selectTypeFacture option').selected = true
    document.getElementById('selectTypeFacture').onchange()
}

function resetProduits() {
    document.getElementById('listeProduits').innerHTML = ""
    document.getElementById('estimationPrix').innerText = ""
    document.getElementById('reste-a-payer').innerText = ""
}

function resetContent() {
    document.querySelector('#selectPrestationFacture option:disabled').selected = true
    document.querySelector('#selectDevisFacture option:disabled').selected = true
    document.querySelector('#selectFactureFacture option:disabled').selected = true
    document.getElementById('remiseFacture').value = DEFAULT_REMISE
    document.getElementById('tvaFacture').value = DEFAULT_TVA
    document.getElementById('prixHTFacture').value = ""
    document.getElementById('prixTTCFacture').value = ""
    document.getElementById('dateEmissionFacture').value = moment().format('DD/MM/YYYY')
    document.getElementById('dateEcheanceFacture').value = moment().add(1, 'months').format('DD/MM/YYYY')
}

function cancel() {
    isUpdated = false
    document.querySelector('#formAddModify .title').innerText = CREATION
    document.getElementById('idFacture').value = ''
    document.getElementById('checkPrestationOrDevis').checked = true
    document.getElementById('checkPrestationOrDevis').onchange()
    
    resetType()
    resetProduits()
    resetContent()
    
    initTextInfos()
}

async function addModify(event) {
    event.preventDefault()

    if(formAddModify.checkValidity()) {
        $('.loadingbackground').show()

        try {
            let url = BASE_URL
            let options = undefined

            const type = document.querySelector('#selectTypeFacture option:checked').value
            if(type === 'solde') {
                // cas avec devis
                if(document.getElementById('checkPrestationOrDevis').checked) {
                    if(document.querySelector('#selectDevisFacture option:checked:enabled') === null) throw "Un devis doit être sélectionné."
                }
                // cas sans devis
                else {
                    if(document.querySelector('#selectPrestationFacture option:checked:enabled') === null) throw "Une prestation doit être sélectionnée."
                }
            }
            else if(type === 'acompte') {
                if(Number(document.getElementById('valeurAcompteFacture').value) === 0) throw "Le montant de l'acompte est incorrect."
            }
            else if(type === 'avoir') {
                
            }

            if(type !== 'solde') {
                if(document.querySelector('#selectFactureFacture option:checked:enabled') === null) throw "Une facture doit être sélectionnée."
                if(Number(document.getElementById('prixHTFacture').value) > Number(document.getElementById('reste-a-payer').innerText)) throw "Le prix ne peut pas dépasser le montant restant à payer."
            }
            if(type !== 'acompte') {

            }
            if(type !== 'avoir') {
                
            }

            if(Number(document.getElementById('prixHTFacture').value) === 0) throw "Le prix HT est incorrect."
            if(Number(document.getElementById('prixTTCFacture').value) === 0) throw "Le prix TTC est incorrect."        
            if(document.getElementById('dateEcheanceFacture').value === '')   throw "La date d'échéance doit être indiquée."

            const params = {
                type,
                idDevis : document.querySelector('#selectDevisFacture option:checked:enabled') ? document.querySelector('#selectDevisFacture option:checked:enabled').value.split('_')[2] : undefined,
                idPrestation : document.querySelector('#selectPrestationFacture option:checked:enabled') ? document.querySelector('#selectPrestationFacture option:checked:enabled').value.split('_')[2] : undefined,
                idFactureAnnulee : (type === 'avoir' && document.querySelector('#selectDevisFacture option:checked:enabled')) ? document.querySelector('#selectDevisFacture option:checked:enabled').value.split('_')[2] : undefined,
                valeurAcompte : (type === 'acompte' && document.getElementById('valeurAcompteFacture').value !== '') ? document.getElementById('valeurAcompteFacture').value : undefined,
                isAcomptePourcentage : type === 'acompte' ? document.querySelector('input[name=isAcomptePourcentageFacture]:checked').value === 'true' : undefined,
                remise : (type === 'solde' && document.getElementById('remiseFacture').value !== "") ? document.getElementById('remiseFacture').value : undefined,
                tva : document.getElementById('tvaFacture').value !== "" ? document.getElementById('tvaFacture').value : undefined     ,       
                prixHT : document.getElementById('prixHTFacture').value,
                prixTTC : document.getElementById('prixTTCFacture').value,
                dateEmission : document.getElementById('dateEmissionFacture').value !== '' ? document.getElementById('dateEmissionFacture').value  : undefined,
                dateEcheance : document.getElementById('dateEcheanceFacture').value !== '' ? document.getElementById('dateEcheanceFacture').value : undefined
            }

            const id = document.getElementById('idFacture').value

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
                const { infos, facture } = await response.json()

                if(infos.message) {
                    isUpdated = true
                }

                fillBoxAddModify(infos)
            }
        }
        catch(e) {
            fillBoxAddModify({ error : e })
            console.error(e)
        }
    }
    else {
        formAddModify.reportValidity()
    }
}

async function paiementFacture(event) {
    event.preventDefault()

    if(formAddModify.checkValidity()) {
        $.modal.close()
        $('.loadingbackground').show()

        try {
            if(document.querySelector('#selectTypePaiement option:enabled:checked') === null) throw "Un moyen de paiement doit être sélectionné."

            const id = document.getElementById('idFacturePaiement').value
            const url = `${BASE_URL}/${id}/paiement`
            const options = {
                headers: {
                    'Content-Type': 'application/json'
                },
                method : 'PATCH',
                body : JSON.stringify({
                    idTypePaiement : document.querySelector('#selectTypePaiement option:enabled:checked').value.split('_')[2],
                    datePaiement : document.getElementById('datePaiementFacture').value
                })
            }

            const response = await fetch(url, options)
            if(!response.ok) throw "Une erreur est survenue lors de l'envoie du formulaire."
            else if(response.status === 401) {
                alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
                location.reload()
            }
            else {
                const { infos, facture } = await response.json()

                if(infos.message) {
                    isUpdated = true
                }

                fillTextInfosModal(infos)
            }
        }
        catch(e) {
            fillTextInfosModal({ error : e })
            console.error(e)
        }

        openModal()
        $('.loadingbackground').hide()        
    }
    else {
        formAddModify.reportValidity()
    }
}

async function showElt({ target }) {
    const id = target.closest('tr').getAttribute('id').split('_')[1]
    
    if(id) {        
        await showAddFacture()
        $('.loadingbackground').show()
        try {
            const response = await fetch(`${BASE_URL}/${id}`)
            if(!response.ok) throw "Une erreur est survenue lors de la récupération de la facture."
            else if(response.status === 401) {
                alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
                location.reload()
            }
            else {
                const { infos, devis } = await response.json()

                fillBoxAddModify(infos, devis)
            }
        }
        catch(e) {
            fillBoxAddModify({ error : e })
        }
    }
}

async function showPaiementFacture({ target }) {
    const id = target.closest('tr').getAttribute('id').split('_')[1]

    if(id) {
        try {
            if(!modalPaiementAlreadyLoaded) {
                $('.loadingbackground').show()

                const response = await fetch('/facturation/typesPaiement/all')
                if(!response.ok) throw "Une erreur est survenue lors de la récupération des moyens de paiement."
                else if(response.status === 401) {
                    alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
                    location.reload()
                }
                else {
                    const { infos, typesPaiement } = await response.json()

                    if(infos && infos.error) throw infos.error

                    const selectTypePaiement = document.getElementById('selectTypePaiement')
                    for(const typePaiement of typesPaiement) {
                        const opt = document.createElement("option")
                        opt.value = `select_typePaiement_${typePaiement.id}`
                        opt.text = typePaiement.nom

                        selectTypePaiement.append(opt)
                    }

                    modalPaiementAlreadyLoaded = true
                }
            }

            document.getElementById('idFacturePaiement').value = id
        }
        catch(e) {
            fillTextInfosModal({ error : e })
        }

        $('.loadingbackground').hide()
        openModal()
    }
}

function openModal() {
    $('#modalPaiement').modal({
        fadeDuration: 100
    })
}

function initModal() {
    document.getElementById('modalPaiement').style.display = 'none'
    document.getElementById('idFacturePaiement').value = ""
    document.querySelector('#selectTypePaiement option:disabled').selected = true
    document.getElementById('datePaiementFacture').value = moment().format('DD/MM/YYYY')
    initTextInfosModal()
}

function closeModal() {
    $.modal.close()
    initModal()
}

function initTextInfosModal() {
    const textInfosModal = document.getElementById('textInfosModal')
    textInfosModal.style.display = 'none'
    textInfosModal.classList.remove('error_message')
    textInfosModal.classList.remove('info_message')
    textInfosModal.innerText = ''
}

function fillTextInfosModal(infos) {
    const textInfosModal = document.getElementById('textInfosModal')

    if(infos) {
        if(infos.message) {
            textInfosModal.innerText = infos.message
            textInfosModal.classList.add('info_message')
            if(isUpdated) {
                textInfosModal.innerText =  `${infos.message} La page va s'actualiser dans quelques instants...`
                setTimeout(() => {
                    window.location.reload()
                }, 2500)
            }
        }
        else if(infos.error) {
            textInfosModal.innerText = infos.error
            textInfosModal.classList.add('error_message')
        }
        
        textInfosModal.style.display = 'flex'
    }
}

async function cancelFacture({ target }) {
    const id = target.closest('tr').getAttribute('id').split('_')[1]
    
    if(id && confirm("Êtes-vous sûr de vouloir annuler la facture?")) {
        $('.loadingbackground').show()
        try {
            const url = `${BASE_URL}/${id}/cancel`
            const options = {
                headers: {
                    'Content-Type': 'application/json'
                },
                method : 'PATCH'
            }

            const response = await fetch(url, options)
            if(!response.ok) throw "Une erreur est survenue lors de la demande d'annulation de la facture."
            else if(response.status === 401) {
                alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
                location.reload()
            }
            else {
                const { infos, facture, avoir } = await response.json()

                if(infos && infos.error) throw infos.error
                if(infos && infos.message) {
                    let message = infos.message

                    if(avoir) message += ' Un avoir a été créé.'

                    alert(`${message} La page va s'actualiser dans quelques instants...`)
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