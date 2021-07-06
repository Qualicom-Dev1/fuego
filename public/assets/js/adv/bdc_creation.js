let bdc = {
    client : undefined,
    vendeur : undefined,
    listeProduits : undefined,
    infosPaiement : undefined,
    observations : undefined,
    datePose : undefined,
    dateLimitePose : undefined,
    ficheAcceptation : undefined,
    prix : {
        HT : 0,
        TTC : 0,
        listeTauxTVA : []
    },
    idVente : undefined
}

window.addEventListener('load', async () => {
    await Promise.all([
        initDocument(),
        loadContent()
    ])

    $('.loadingbackground').hide()
})

async function initDocument() {
    if(document.getElementById('carouselBDC')) {
        // initialisation du caroussel
        $('#carouselBDC').carousel({
            interval : false,
            keyboard : false,
            ride : false,
            wrap : false,
            touch : false,
            cycle : false
        })

        // initialisation des listeners        
        document.getElementById('selectIntituleClient').onchange = changeSelectIntituleClient
        document.getElementById('selectIntituleClient').onblur = changeSelectIntituleClient
        document.getElementById('isFromTTC').onchange = switchIsFromTTC
        document.getElementById('btnAddProduit').onclick = addSelectedProduit
        document.getElementById('isAcompte').onclick = toggleDivsPaiement
        document.getElementById('isComptant').onclick = toggleDivsPaiement
        document.getElementById('isCredit').onclick = toggleDivsPaiement

        document.querySelectorAll('.btnCarouselPrev').forEach(btn => {
            btn.onclick = () => $('#carouselBDC').carousel('prev')
        })
        document.getElementById('validationClients').onclick = validationClients
        document.getElementById('validationCommande').onclick = validationCommande
        document.getElementById('validationPaiement').onclick = validationPaiement
        document.getElementById('validationRecapitulatif').onclick = validationRecapitulatif
        document.getElementById('validationAcceptation').onclick = validationAcceptation
    
        $('#modalInformation').modal({
            // fadeDuration: 100
            backdrop : 'static',
            keyboard : false,
            focus : true,
            show : true
        })

    }
}

function setErrorMessage(element, message) {
    if(element === undefined || !['generale', 'formRenseignementsClients', 'formFicheRenseignementsTechniques', 'formProduits', 'formObservations', 'formPose', 'formPaiement', 'formAcceptation', 'divRecapitulatif'].includes(element)) element = 'generale'

    const div = document.getElementById(`div_info_${element}`)
    const p = div.getElementsByTagName('p')[0]

    p.classList.add('error_message')
    p.innerText = message
    div.style.display = 'block'
}

function setInformationMessage(element, message) {
    if(element === undefined || !['generale', 'formRenseignementsClients', 'formFicheRenseignementsTechniques', 'formProduits', 'formObservations', 'formPose', 'formPaiement', 'formAcceptation', 'divRecapitulatif'].includes(element)) element = 'generale'

    const div = document.getElementById(`div_info_${element}`)
    const p = div.getElementsByTagName('p')[0]

    p.classList.add('info_message')
    p.innerText = message
    div.style.display = 'block'
}

function removeErrorMessage(element) {
    if(element === undefined || !['generale', 'formRenseignementsClients', 'formFicheRenseignementsTechniques', 'formProduits', 'formObservations', 'formPose', 'formPaiement', 'formAcceptation', 'divRecapitulatif'].includes(element)) element = 'generale'

    const div = document.getElementById(`div_info_${element}`)
    const p = div.getElementsByTagName('p')[0]

    p.innerText = ''
    p.classList.remove('error_message')
    p.classList.remove('info_message')
    div.style.display = 'none'
}

async function loadContent() {
    if(document.getElementById('carouselBDC')) {
        try {
            await Promise.all([
                loadClient(),
                loadvendeur(),
                loadProduits()
            ])
        }
        catch(e) {
            setErrorMessage('generale', e)
            console.error(e)
        }    
    }
}

async function loadClient() {
    const refIdClient = document.getElementById('refIdClient')
    if(refIdClient && refIdClient.value) {
        const response = await fetch(`/adv/bdc/clients/clientRDV/${refIdClient.value}`)
        if(!response.ok) throw generalError
        else if(response.status === 401) {
            alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
            location.reload()
        }
        else {
            const { infos, client } = await response.json()
            if(infos && infos.error) throw infos.error

            if(!client) throw "Une erreur est survenue lors du chargement des informations client."

            const selectIntituleClient = document.getElementById('selectIntituleClient')
            selectIntituleClient.querySelector(`option[value=${client.intitule}]`).checked = true
            selectIntituleClient.onchange()

            document.getElementById('nomClient1').value = client.nom ? client.nom : ''
            document.getElementById('prenomClient1').value = client.prenom ? client.prenom : ''
            document.getElementById('adresse').value = client.adresse ? client.adresse : ''
            document.getElementById('cp').value = client.cp ? client.cp : ''
            document.getElementById('ville').value = client.ville ? client.ville : ''
            document.getElementById('email').value = client.mail ? client.mail : ''
            document.getElementById('telephoneFixe').value = client.tel1 ? client.tel1 : ''
            document.getElementById('telephonePort').value = client.tel2 ? client.tel2 : ''
        }
    }
}

async function loadvendeur() {
    const response = await fetch(`/adv/bdc/currentVendeur`)
    if(!response.ok) throw generalError
    else if(response.status === 401) {
        alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
        location.reload()
    }
    else {
        const { infos, vendeur } = await response.json()
        if(infos && infos.error) throw infos.error

        if(!vendeur) throw "Une erreur est survenue lors du chargement des informations du commercial."

        bdc.vendeur = vendeur
    }
}

async function loadProduits() {
    const select = document.getElementById('selectProduit')

    // récupère les produits et groupements de produits
    const [responseProduits, responseGroupesProduits] = await Promise.all([
        fetch(`/adv/produits/produits`),
        fetch(`/adv/produits/groupesProduits`)
    ])
    if(!responseProduits.ok || !responseGroupesProduits.ok) throw generalError
    else if(responseProduits.status === 401 || responseGroupesProduits.status === 401) {
        alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
        location.reload()
    }
    else {
        const [dataProduits, dataGroupesProduits] = await Promise.all([
            responseProduits.json(),
            responseGroupesProduits.json()
        ])

        // en cas d'erreur celle-ci est remontée
        if(dataProduits.infos && dataProduits.infos.error) throw dataProduits.infos.error
        if(dataGroupesProduits.infos && dataGroupesProduits.infos.error) throw dataGroupesProduits.infos.error

        const listeProduits = []
        if(dataGroupesProduits.produits && dataGroupesProduits.produits.length) listeProduits.push(...dataGroupesProduits.produits)
        if(dataProduits.produits && dataProduits.produits.length) listeProduits.push(...dataProduits.produits)        

        if(listeProduits.length) {            
            for(const produit of listeProduits) {
                const opt = document.createElement('option')
                opt.value = `produit_${produit.id}`
                opt.setAttribute('data-isGroupe', Number(produit.isGroupe))
                opt.text = (produit.ref ? `${produit.ref} : ${produit.nom}` : produit.nom) + ` ${produit.isGroupe ? "(groupement)" : ""}`

                select.append(opt)
            }
        }
        else {
            const opt = document.createElement("option")
            opt.text = "Aucun produit"

            select.append(opt)
        }
    }
}

function changeSelectIntituleClient() {
    const divClient2 = document.getElementById('divClient2')

    if(!!Number(document.querySelector('#selectIntituleClient option:checked').getAttribute('data-multi'))) {
        divClient2.style.display = 'flex'
    }
    else {
        divClient2.style.display = 'none'
        divClient2.querySelectorAll('input').forEach(input => input.value = '')
    }
}

// vérifie les infos clients et la fiche de renseignements techniques
// si les informations sont correctes passe à l'étape suivante
async function validationClients() {
    const formRenseignementsClients = document.getElementById('formRenseignementsClients')
    const formFicheRenseignementsTechniques = document.getElementById('formFicheRenseignementsTechniques')

    if(formRenseignementsClients.checkValidity() && formFicheRenseignementsTechniques.checkValidity()) {
        $('.loadingbackground').show()
        removeErrorMessage('formFicheRenseignementsTechniques')
        
        try {
            bdc.idVente = document.getElementById('idVente').value || undefined

            // récupération des infos du client
            bdc.client = {
                refIdClient : document.getElementById('refIdClient').value || undefined,
                intitule : document.querySelector('#selectIntituleClient option:checked').value,
                nom1 : document.getElementById('nomClient1').value,
                prenom1 : document.getElementById('prenomClient1').value,
                nom2 : document.getElementById('nomClient2').value,
                prenom2 : document.getElementById('prenomClient2').value,
                adresse : document.getElementById('adresse').value,
                adresseComplement1 : document.getElementById('adresseComplement1').value,
                adresseComplement2 : document.getElementById('adresseComplement2').value,
                cp : document.getElementById('cp').value,
                ville : document.getElementById('ville').value,
                email : document.getElementById('email').value,
                telephonePort : document.getElementById('telephonePort').value,
                telephoneFixe : document.getElementById('telephoneFixe').value,
                // fiche infos techniques
                ficheRenseignementsTechniques : {
                    typeInstallationElectrique : document.querySelector('#typeInstallationElectrique option:checked').value,
                    puissanceKW : document.getElementById('puissanceKW').value || undefined,
                    puissanceA : document.getElementById('puissanceA').value || undefined,
                    anneeConstructionMaison : document.getElementById('anneeConstructionMaison').value || undefined,
                    dureeSupposeeConstructionMaison : document.getElementById('dureeSupposeeConstructionMaison').value || undefined,
                    dureeAcquisitionMaison : document.getElementById('dureeAcquisitionMaison').value || undefined,
                    typeResidence : document.querySelector('#typeResidence option:checked').value,
                    superficie : document.getElementById('superficie').value || undefined
                }
            }

            const url = `/adv/bdc/clients/checkClient`
            const option = {
                method : 'POST',
                headers : new Headers({
                    "Content-type" : "application/json"
                }),
                body : JSON.stringify(bdc.client)
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
            }

            $('#carouselBDC').carousel('next')
        }
        catch(e) {
            setErrorMessage('formFicheRenseignementsTechniques', e)
        }
        finally {
            $('.loadingbackground').hide()
        }
    }
    else {
        formRenseignementsClients.reportValidity()
        formFicheRenseignementsTechniques.reportValidity()
    }
}

function switchIsFromTTC() {
    const isFromTTC = document.getElementById('isFromTTC').checked
    const labelContent = document.getElementById('labelContentisFromTTC')

    // modification du texte affiché
    labelContent.innerText = isFromTTC ? 'TTC' : 'HT'

    // modification des inputs
    const tableListeProduits = document.getElementById('tableListeProduits')
    const listeInputsPrixHT = tableListeProduits.querySelectorAll('.prixUnitaireHTProduit ')
    const listeInputsPrixTTC = tableListeProduits.querySelectorAll('.prixUnitaireTTCProduit')

    if(isFromTTC) {
        for(const input of listeInputsPrixHT) {
            const isGroupe = !!Number((input.closest('tr').getAttribute('data-isGroupe')))
            if(!isGroupe) {
                input.disabled = true
                input.classList.add('inputDisabled')
            }
        }

        for(const input of listeInputsPrixTTC) {
            const isGroupe = !!Number((input.closest('tr').getAttribute('data-isGroupe')))
            if(!isGroupe) {
                input.disabled = false
                input.classList.remove('inputDisabled')
            }
        }
    }
    else {
        for(const input of listeInputsPrixTTC) {
            const isGroupe = !!Number((input.closest('tr').getAttribute('data-isGroupe')))
            if(!isGroupe) {
                input.disabled = true
                input.classList.add('inputDisabled')
            }
        }
        
        for(const input of listeInputsPrixHT) {
            const isGroupe = !!Number((input.closest('tr').getAttribute('data-isGroupe')))
            if(!isGroupe) {
                input.disabled = false
                input.classList.remove('inputDisabled')
            }
        }
    }
}

async function addSelectedProduit() {
    const optionSelected = document.querySelector('#selectProduit option:checked')

    if(optionSelected.value) {
        $('.loadingbackground').show()

        try {
            // sélection de la valeur par défaut du select
            document.querySelector('#selectProduit option[value=""]').selected = true

            const idProduit = optionSelected.value.split('_')[1]
            const isGroupe = !!Number(optionSelected.getAttribute('data-isGroupe'))

            const BASE_URL = '/adv/produits'
            const response = await fetch(`${BASE_URL}/${isGroupe ? 'groupesProduits' : 'produits'}/${idProduit}`)

            if(!response.ok) throw generalError
            else if(response.status === 401) {
                alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
                location.reload()
            }
            else {
                const { infos, produit } = await response.json()
                if(infos && infos.error) throw infos.error

                const table = document.getElementById('tableListeProduits')
                // chaque produit ou groupement ajouté a un identifiant unique pour le retrouver
                const uid = createID()
                const isFromTTC = document.getElementById('isFromTTC').checked

                const trProduit = document.createElement('tr')
                trProduit.setAttribute('data-idProduit', produit.id)
                trProduit.setAttribute('data-uid', uid)
                trProduit.setAttribute('data-isGroupe', Number(produit.isGroupe))

                let puissanceProduit = '-'
                if(produit.caracteristique && produit.uniteCaracteristique.trim().toUpperCase() === 'KW') puissanceProduit = produit.caracteristique
                
                trProduit.innerHTML = `
                    <td class="produitOption"><i class="fas fa-minus btn_item2 hover_btn3" onclick="removeProduit(this);"></i></td>
                    <td class="produitQuantite"><input type="number" step="1" min="1" value="1" onblur="inputProduit(this);" required></td>
                    <td class="produitDesignation"><textarea class="textarea_auto_height" oninput="textarea_auto_height(this);" placeholder="Désignation">${produit.designation ? produit.designation : produit.nom}</textarea></td>
                    <td class="produitPuissance">${puissanceProduit}</td>
                    <td class="produitPrix"><input type="number"  class="prixUnitaireHTProduit ${produit.isGroupe ? 'inputDisabled' : (isFromTTC ? 'inputDisabled' : '')}" value="${produit.prixUnitaireHT}" onblur="inputProduit(this);" step=".01" min="0.1" required  ${produit.isGroupe ? 'disabled' : (isFromTTC ? 'disabled' : '')}></td>
                    <td class="produitTVA">${produit.tauxTVA || ''}</td>
                    <td class="produitPrix"><input type="number" class="prixUnitaireTTCProduit ${produit.isGroupe ? 'inputDisabled' : (isFromTTC ? '' : 'inputDisabled')}" value="${produit.prixUnitaireTTC}" onblur="inputProduit(this);" step=".01" min="0.1" required  ${produit.isGroupe ? 'disabled' : (isFromTTC ? '' : 'disabled')}></td>
                    <td class="produitPrix produitPrixTotal prixTotalHT">${produit.prixUnitaireHT}</td>
                    <td class="produitPrix produitPrixTotal prixTotalTTC">${produit.prixUnitaireTTC}</td>
                `  
                table.append(trProduit)
                textarea_auto_height(trProduit.querySelector('.produitDesignation textarea'))

                // ajout du contenu du groupement
                if(produit.isGroupe) {
                    // const trContenu = document.createElement('tr')
                    // trContenu.setAttribute('data-for', uid)

                    // // entête du tableau de contenu s'il faut le rajouter pour plus de clarté
                    // // <thead>
                    // //     <tr>
                    // //         <th class="produitQuantite">Qté</th>
                    // //         <th class="produitDesignation">Désignation (Matériel - Pose - Garantie)</th>
                    // //         <th class="produitPuissance">Puissance Matériel (KW)</th>
                    // //         <th class="produitTVA">TVA (%)</th>
                    // //         <th class="produitPrix">Prix Unitaire HT (€)</th>
                    // //         <th class="produitPrix">Prix total HT (€)</th>
                    // //     </tr>
                    // // </thead>

                    // let contenuHTMLListeProduits = `
                    //     <td class="emptyTd"></td>
                    //     <td colspan="8" class="ctn_table sousProduit">
                    //         <table>
                    //             <thead>
                    //                 <tr>
                    //                     <td class="produitQuantite">Qté</td>
                    //                     <td class="produitDesignation">Désignation (Matériel - Pose - Garantie)</td>
                    //                     <td class="produitPuissance">Puissance Matériel (KW)</td>                                        
                    //                     <td class="produitPrix">Prix HT (€)</td>
                    //                     <td class="produitTVA">TVA (%)</td>
                    //                     <td class="produitPrix">Prix TTC (€)</td>
                    //                     <td class="produitPrix">Total HT (€)</td>
                    //                     <td class="produitPrix">Total TTC (€)</td>
                    //                 </tr>
                    //             </thead>
                    //             <tbody>`
                    // produit.listeProduits.forEach(produit => {
                    //     let puissanceProduit = '-'
                    //     if(produit.caracteristique && produit.uniteCaracteristique.trim().toUpperCase() === 'KW') puissanceProduit = produit.caracteristique + 'KW'

                    //     contenuHTMLListeProduits += `
                    //         <tr data-into="${uid}" data-idProduit="${produit.id}" data-isGroupe="${Number(produit.isGroupe)}" data-prixUnitaireHT="${produit.prixUnitaireHTApplique}">
                    //             <td class="produitQuantite">${produit.quantite}</td>
                    //             <td class="produitDesignation textFormated">${produit.designation ? produit.designation : produit.nom}</td>
                    //             <td class="produitPuissance">${puissanceProduit}</td>
                    //             <td class="produitPrix"><input type="number"  class="prixUnitaireHTProduit ${isFromTTC ? 'inputDisabled' : ''}" value="${produit.prixUnitaireHTApplique}" onblur="inputProduit(this);" step=".01" min="0.1" required  ${isFromTTC ? 'disabled' : ''}></td>
                    //             <td class="produitTVA">${produit.tauxTVA}</td>
                    //             <td class="produitPrix"><input type="number" class="prixUnitaireTTCProduit ${isFromTTC ? '' : 'inputDisabled'}" value="${produit.prixUnitaireTTCApplique}" onblur="inputProduit(this);" step=".01" min="0.1" required  ${isFromTTC ? '' : 'disabled'}></td>
                    //             <td class="produitPrix prixTotalHT">${produit.prixHT}</td>
                    //             <td class="produitPrix prixTotalTTC">${produit.prixTTC}</td>
                    //         </tr>
                    //     `
                    // })
                    // contenuHTMLListeProduits += `
                    //             </tbody>
                    //         </table>
                    //     </td>
                    // `

                    // trContenu.innerHTML = contenuHTMLListeProduits

                    // // ajout de la tr de contenu à la table
                    // table.append(trContenu)

                    produit.listeProduits.forEach(produit => {
                        const trContenu = document.createElement('tr')
                        trContenu.setAttribute('data-for', uid)
                        trContenu.setAttribute('data-idProduit', produit.id)
                        trContenu.setAttribute('data-isGroupe', Number(produit.isGroupe))

                        let puissanceProduit = '-'
                        if(produit.caracteristique && produit.uniteCaracteristique.trim().toUpperCase() === 'KW') puissanceProduit = produit.caracteristique + 'KW'

                        const contenuHTMLSousProduit = `
                            <td class="emptyTd"></td>
                            <td class="produitQuantite"><input type="number" class="inputDisabled" step="1" min="1" value="${produit.quantite}" required disabled></td>
                            <td class="produitDesignation textFormated">${produit.designation ? produit.designation : produit.nom}</td>
                            <td class="produitPuissance">${puissanceProduit}</td>
                            <td class="produitPrix"><input type="number"  class="prixUnitaireHTProduit ${isFromTTC ? 'inputDisabled' : ''}" value="${produit.prixUnitaireHTApplique}" onblur="inputProduit(this);" step=".01" min="0.1" required  ${isFromTTC ? 'disabled' : ''}></td>
                            <td class="produitTVA">${produit.tauxTVA}</td>
                            <td class="produitPrix"><input type="number" class="prixUnitaireTTCProduit ${isFromTTC ? '' : 'inputDisabled'}" value="${produit.prixUnitaireTTCApplique}" onblur="inputProduit(this);" step=".01" min="0.1" required  ${isFromTTC ? '' : 'disabled'}></td>
                            <td class="produitPrix prixTotalHT">${produit.prixHT}</td>
                            <td class="produitPrix prixTotalTTC">${produit.prixTTC}</td>
                        `

                        trContenu.innerHTML = contenuHTMLSousProduit
                        table.append(trContenu)
                    })
                }

                await pause(100)
                calculeTotalListeProduits()
            }
        }
        catch(e) {
            setErrorMessage('formProduits', e)
            console.log(e)
        }
        finally {
            $('.loadingbackground').hide()
        }
    }
}

async function validationCommande() {
    const formProduits = document.getElementById('formProduits')

    if(formProduits.checkValidity()) {
        $('.loadingbackground').show()
        removeErrorMessage('formObservations')

        try {
            bdc.listeProduits = Array.from(document.querySelectorAll('#tableListeProduits tr[data-uid]')).map(trProduit => {
                const produit = {
                    idADV_produit : trProduit.getAttribute('data-idProduit'),
                    isGroupe : !!Number(trProduit.getAttribute('data-isGroupe')),
                    quantite : trProduit.querySelector('.produitQuantite input').value,
                    designation : trProduit.querySelector('.produitDesignation textarea').value,
                    prixUnitaireHT : trProduit.querySelector('.produitPrix input').value
                }

                if(produit.isGroupe) {
                    // on récupère sous produits du groupement
                    const uid = trProduit.getAttribute('data-uid')

                    produit.listeProduits = Array.from(document.querySelectorAll(`#tableListeProduits tr[data-into="${uid}"]`)).map(trSousProduit => {
                        return {
                            idADV_produit : trSousProduit.getAttribute('data-idProduit'),
                            quantite : trSousProduit.querySelector('.produitQuantite').innerText,
                            designation : trSousProduit.querySelector('.produitDesignation').innerText,
                            prixUnitaireHT : trSousProduit.getAttribute('data-prixUnitaireHT')
                        }
                    })
                }

                return produit
            })

            bdc.observations = document.querySelector('#formObservations textarea').value

            const BASE_URL = '/adv/bdc/produits'
            const [responseListeProduits, responseObservations] = await Promise.all([
                fetch(`${BASE_URL}/checkListeProduits`, {
                    method : 'POST',
                    headers : new Headers({
                        "Content-type" : "application/json"
                    }),
                    body : JSON.stringify(bdc.listeProduits)
                }),
                fetch(`${BASE_URL}/checkObservations`, {
                    method : 'POST',
                    headers : new Headers({
                        "Content-type" : "application/json"
                    }),
                    body : JSON.stringify({ observations : bdc.observations })
                })
            ])

            if(!responseListeProduits.ok || !responseObservations.ok) throw generalError
            else if(responseListeProduits.status === 401 || responseObservations.status === 401) {
                alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
                location.reload()
            }
            else {
                const dataListeProduits = await responseListeProduits.json()
                const dataObservations = await responseObservations.json()
                if(dataListeProduits.infos && dataListeProduits.infos.error) throw dataListeProduits.infos.error
                if(dataObservations.infos && dataObservations.infos.error) throw dataObservations.infos.error

                bdc.listeProduits = dataListeProduits.listeProduits
            }

            // si tout s'est bien passé, on calcule le prix du BDC pour l'indiquer pour les moyens de paiement
            const url = '/adv/bdc/calculePrixBDC'
            const option = {
                method : 'POST',
                headers : new Headers({
                    "Content-type" : "application/json"
                }),
                body : JSON.stringify({ listeProduits : bdc.listeProduits })
            }

            const response = await fetch(url, option)
            if(!response.ok) throw generalError
            else if(response.status === 401) {
                alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
                location.reload()
            }
            else {
                const { infos, prixBDC } = await response.json()
                if(infos && infos.error) throw infos.error

                bdc.prix.HT = prixBDC.prixHT
                bdc.prix.TTC = prixBDC.prixTTC
                bdc.prix.listeTauxTVA = prixBDC.listeTauxTVA
                document.getElementById('indicationMontantTotalHT').innerText = bdc.prix.HT
                document.getElementById('indicationMontantTotalTTC').innerText = bdc.prix.TTC
            }
    
            $('#carouselBDC').carousel('next')
        }
        catch(e) {
            setErrorMessage('formObservations', e)
            console.error(e)
        }
        finally {
            $('.loadingbackground').hide()
        }
    }
    else {
        formProduits.reportValidity()
    }
}

function toggleDivsPaiement({ target }) {
    const divTarget = target.getAttribute('id').slice(2)
    $(`#divContent${divTarget}`).toggle()
}

async function validationPaiement() {
    const formPose = document.getElementById('formPose')

    if(formPose.checkValidity()) {
        $('.loadingbackground').show()
        removeErrorMessage('formPaiement')

        try {
            bdc.infosPaiement = {
                isAcompte : document.getElementById('isAcompte').checked,
                typeAcompte : document.querySelector('#typeAcompte option:checked').value,
                montantAcompte : document.getElementById('montantAcompte').value,
                isComptant : document.getElementById('isComptant').checked,
                montantComptant : document.getElementById('montantComptant').value,
                isCredit : document.getElementById('isCredit').checked,
                montantCredit : document.getElementById('montantCredit').value,
                nbMensualiteCredit : document.getElementById('nbMensualiteCredit').value,
                montantMensualiteCredit : document.getElementById('montantMensualiteCredit').value,
                nbMoisReportCredit : document.getElementById('nbMoisReportCredit').value,
                tauxNominalCredit : document.getElementById('tauxNominalCredit').value,
                tauxEffectifGlobalCredit : document.getElementById('tauxEffectifGlobalCredit').value,
                datePremiereEcheanceCredit : document.getElementById('datePremiereEcheanceCredit').value,
                coutTotalCredit : document.getElementById('coutTotalCredit').value
            }

            bdc.datePose = document.getElementById('datePose').value
            bdc.dateLimitePose = document.getElementById('dateLimitePose').value

            const [responsePose, responsePaiement] = await Promise.all([
                fetch('/adv/bdc/checkDatesPose', {
                    method : 'POST',
                    headers : new Headers({
                        "Content-type" : "application/json"
                    }),
                    body : JSON.stringify({
                        datePose : bdc.datePose,
                        dateLimitePose : bdc.dateLimitePose
                    })
                }),
                fetch('/adv/bdc/infosPaiement/checkInfosPaiement', {
                    method : 'POST',
                    headers : new Headers({
                        "Content-type" : "application/json"
                    }),
                    body : JSON.stringify({
                        infosPaiement : bdc.infosPaiement,
                        prixTTC : bdc.prix.TTC
                    })
                })
            ])
            if(!responsePose.ok || !responsePaiement.ok) throw generalError
            else if(responsePose.status === 401 || responsePaiement.status === 401) {
                alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
                location.reload()
            }
            else {
                const [dataPose, dataPaiement] = await Promise.all([
                    responsePose.json(),
                    responsePaiement.json()
                ])
                if(dataPose && dataPose.infos && dataPose.infos.error) throw dataPose.infos.error
                if(dataPaiement && dataPaiement.infos && dataPaiement.infos.error) throw dataPaiement.infos.error

                bdc.infosPaiement = dataPaiement.infosPaiement
            
                // si tout est bon, on charge le récapitulatif de la commande
                const structure = document.getElementById('contentDivRecapitulatif').getAttribute('data-structure')
                const htmlRecapitulatif = new EJS({ url: `/public/views/partials/ADV/bdc_recapitulatif_${structure}.ejs`}).render(bdc)                
                $('#contentDivRecapitulatif').html('');
                $('#contentDivRecapitulatif').append(htmlRecapitulatif)
            }

            $('#carouselBDC').carousel('next')
        }
        catch(e) {
            setErrorMessage('formPaiement', e)
            console.error(e)
        }
        finally {
            $('.loadingbackground').hide()
        }
    }
    else {
        formPose.reportValidity()
    }
}

function validationRecapitulatif() {
    // formatage des valeurs à saisir
    const client = `${bdc.client.prenom1} ${bdc.client.nom1}`

    let adresseComplete = bdc.client.adresse
    if(bdc.client.adresseComplement1 !== '') adresseComplete += `, ${bdc.client.adresseComplement1}`
    if(bdc.client.adresseComplement2 !== '') adresseComplete += `, ${bdc.client.adresseComplement2}`
    adresseComplete += `, ${bdc.client.cp} ${bdc.client.ville}`

    const technicien = `${bdc.vendeur.prenom} ${bdc.vendeur.nom}`

    // remplissage des champs
    document.getElementById('client').value = client
    document.getElementById('adresseComplete').value = adresseComplete
    document.getElementById('technicien').value = technicien

    // affichage de la vue suivante
    $('#carouselBDC').carousel('next')
}

async function validationAcceptation() {
    const formAcceptation = document.getElementById('formAcceptation')
    removeErrorMessage('formAcceptation')

    if(formAcceptation.checkValidity()) {
        $('.loadingbackground').show()

        const btn = document.getElementById('validationAcceptation')
        btn.disabled = true

        try {
            bdc.ficheAcceptation = {
                client : document.getElementById('client').value,
                adresse : document.getElementById('adresseComplete').value,
                date : document.getElementById('date').value,
                heure : document.getElementById('heure').value,
                technicien : document.getElementById('technicien').value,
                isReceptionDocuments : document.getElementById('isReceptionDocuments').checked
            }

            const url = '/adv/bdc/ficheAcceptation/checkFicheAcceptation'
            const option = {
                method : 'POST',
                headers : new Headers({
                    "Content-type" : "application/json"
                }),
                body : JSON.stringify({
                    ficheAcceptation : bdc.ficheAcceptation,
                    client : bdc.client
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

                // si tout s'est bien passé, on peut créer le BDC
                const dataCreationBDC = await createBDC()
                if(dataCreationBDC.infos && dataCreationBDC.infos.error) throw dataCreationBDC.infos.error
                
                setInformationMessage('formAcceptation', `${dataCreationBDC.infos.message} Vous allez être redirigé vers la signature dans quelques instants...`)
                // puis passer à la signatrure
                $('.loadingbackground').hide({
                    complete : async () => {
                        await new Promise(resolve => setTimeout(resolve, 6000))
                        location.replace(dataCreationBDC.urlSignature)    
                    }
                })
                // window.open(dataCreationBDC.urlSignature, '_blank')                
            }
        }
        catch(e) {
            btn.disabled = false
            setErrorMessage('formAcceptation', e)
        }
        finally {
            $('.loadingbackground').hide()
        }
    }
    else {
        formAcceptation.reportValidity()
    }
}

async function createBDC() {
    let infos = undefined
    let urlSignature = undefined

    const url = '/adv/bdc'
    const option = {
        method : 'POST',
        headers : new Headers({
            "Content-type" : "application/json"
        }),
        body : JSON.stringify(bdc)
    }

    const response = await fetch(url, option)
    if(!response.ok) throw generalError
    else if(response.status === 401) {
        alert("Vous avez été déconnecté, une authentification est requise. Vous allez être redirigé.")
        location.reload()
    }
    else {
        const data = await response.json()
        infos = data.infos
        urlSignature = data.url
    }

    return {
        infos,
        urlSignature
    }
}

function removeProduit(elt) {
    const tr = elt.closest('tr')
    if(tr) {
        const uid = tr.getAttribute('data-uid')

        if(uid) {
            const contenuGroupe = document.querySelectorAll(`tr[data-for='${uid}']`)
            // si groupe retrait des tr de contenu
            if(contenuGroupe.length) {
                const listeTrSousProduits = Array.from(contenuGroupe)
                listeTrSousProduits.forEach(tr => tr.parentNode.removeChild(tr))
            }

            // retrait de la tr parente
            tr.parentNode.removeChild(tr)

            // recalcule du total
            calculeTotalListeProduits()
        }
    }
}

async function inputProduit(input) {
    if(input.checkValidity()) {
        const tr = input.closest('tr')
        if(tr) {    
            const isFromTTC = document.getElementById('isFromTTC').checked
            const isGroupe = !!Number(tr.getAttribute('data-isGroupe'))

            const quantite = Number(tr.querySelector('.produitQuantite input').value)
            let prixUnitaireHT = Number(tr.querySelector('.prixUnitaireHTProduit').value)
            const tauxTVA = Number(tr.querySelector('.produitTVA').innerText)
            let prixUnitaireTTC = Number(tr.querySelector('.prixUnitaireTTCProduit').value)

            // on ne calcule les prix unitaires de la ligne que si c'est un produit simple
            // pour un groupement de produit, le prix unitaire a été calculé en amont et correspond à celui affiché
            if(!isGroupe) {
                if(isFromTTC) prixUnitaireHT = calculePrixHT(tauxTVA, prixUnitaireTTC)
                else prixUnitaireTTC = calculePrixTTC(tauxTVA, prixUnitaireHT)
            }

            const totalHT = quantite * Number(prixUnitaireHT.toFixed(2))
            const totalTTC = quantite * Number(prixUnitaireTTC.toFixed(2))

            tr.querySelector('.prixUnitaireHTProduit').value = prixUnitaireHT.toFixed(2)
            tr.querySelector('.prixUnitaireTTCProduit').value = prixUnitaireTTC.toFixed(2)
            tr.querySelector('.prixTotalHT').innerText = totalHT.toFixed(2)
            tr.querySelector('.prixTotalTTC').innerText = totalTTC.toFixed(2)

            const parentProduit = tr.getAttribute('data-for')            
            // si parentProduit !== null c'est un groupement de produits, 
            // donc il faut calculer le prix du parent
            if(parentProduit) calculePrixGroupeProduits(parentProduit)

            await pause(100)
            // calcule du total après que tout le reste est été calculé
            calculeTotalListeProduits()
        }
    }
    else {
        input.reportValidity()
    }
}

function calculePrixHT(tauxTVA, prixTTC) {
    tauxTVA = Number(tauxTVA / 100)
    prixTTC = Number(prixTTC)

    return Number(prixTTC / Number(1 + tauxTVA))
}

function calculePrixTTC(tauxTVA, prixHT) {
    tauxTVA = Number(tauxTVA / 100)
    prixHT = Number(prixHT)

    return Number(prixHT * Number(1 + tauxTVA))
}

function calculePrixGroupeProduits(uid) {
    if(uid) {        
        const trGroupeProduit = document.querySelector(`tr[data-uid="${uid}"]`)
        if(trGroupeProduit) {
            // vérifie que c'est un groupement
            if(!!Number(trGroupeProduit.getAttribute('data-isGroupe'))) {
                const listeTrProduits = Array.from(document.querySelectorAll(`tr[data-for="${uid}"]`))
                // prixUnitaireHT = somme prixTotalHT de chaque produit contenu
                if(listeTrProduits.length) {
                    let totalHT = 0
                    let totalTTC = 0

                    for(const trSousProduit of listeTrProduits) {
                        // récupération des totaux de chaque sous produits
                        const totalHTProduit = Number(trSousProduit.querySelector('.prixTotalHT').innerText)
                        const totalTTCProduit = Number(trSousProduit.querySelector('.prixTotalTTC').innerText)
                        
                        totalHT += totalHTProduit
                        totalTTC += totalTTCProduit
                    }

                    // applique le prix des produits contenus dans le groupement
                    trGroupeProduit.querySelector('.prixUnitaireHTProduit').value = totalHT.toFixed(2)
                    trGroupeProduit.querySelector('.prixUnitaireTTCProduit').value = totalTTC.toFixed(2)

                    // recalcule le total du groupement de produits
                    trGroupeProduit.querySelector('.produitQuantite input').onblur()
                }                
            }
        }
    }
}

// calcule des totaux
function calculeTotalListeProduits() {
    const listeTrProduits = Array.from(document.querySelectorAll('tr[data-uid]'))

    let totalHT = 0
    let totalTTC = 0
    if(listeTrProduits.length) {
        for(const tr of listeTrProduits) {
            const totalHTProduit = Number(tr.querySelector('.prixTotalHT').innerText)
            const totalTTCProduit = Number(tr.querySelector('.prixTotalTTC').innerText)
            
            totalHT += totalHTProduit
            totalTTC += totalTTCProduit
        }

        totalHT = Number(totalHT).toFixed(2)
        totalTTC = Number(totalTTC).toFixed(2)
    }

    document.getElementById('listeTotalHT').innerText = totalHT
    document.getElementById('listeTotalTTC').innerText = totalTTC
}

function textarea_auto_height(elem) {
    elem.style.height = "1px";
    elem.style.height = `${elem.scrollHeight + 5}px`;
}

function createID() {
    return Math.random().toString(36).substr(2, 9)
}

async function pause(durationMs) {
    await new Promise(resolve => setTimeout(() => resolve(), durationMs))
}