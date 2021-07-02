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

                const trProduit = document.createElement('tr')
                trProduit.setAttribute('data-idProduit', produit.id)
                trProduit.setAttribute('data-uid', uid)
                trProduit.setAttribute('data-isGroupe', Number(produit.isGroupe))

                let puissanceProduit = '-'
                if(produit.caracteristique && produit.uniteCaracteristique.trim().toUpperCase() === 'KW') puissanceProduit = produit.caracteristique
                
                trProduit.innerHTML = `
                    <td class="produitOption"><i class="fas fa-minus btn_item2 hover_btn3" onclick="removeProduit(this);"></i></td>
                    <td class="produitQuantite"><input type="number" step="1" min="1" value="1" onblur="changeQuantiteProduit(this);" required></td>
                    <td class="produitDesignation"><textarea class="textarea_auto_height" oninput="textarea_auto_height(this);" placeholder="Désignation">${produit.designation ? produit.designation : produit.nom}</textarea></td>
                    <td class="produitPuissance">${puissanceProduit}</td>
                    <td class="produitTVA">${produit.tauxTVA || ''}</td>
                    <td class="produitPrix"><input type="number" step=".01" min="0.1" value="${produit.prixUnitaireHT}" onblur="changePrixProduit(this);" required></td>                    
                    <td class="produitPrix">${produit.prixUnitaireHT}</td>
                `  
                table.append(trProduit)
                textarea_auto_height(trProduit.querySelector('.produitDesignation textarea'))

                // ajout du contenu du groupement
                if(produit.isGroupe) {
                    const trContenu = document.createElement('tr')
                    trContenu.setAttribute('data-for', uid)

                    // entête du tableau de contenu s'il faut le rajouter pour plus de clarté
                    // <thead>
                    //     <tr>
                    //         <th class="produitQuantite">Qté</th>
                    //         <th class="produitDesignation">Désignation (Matériel - Pose - Garantie)</th>
                    //         <th class="produitPuissance">Puissance Matériel (KW)</th>
                    //         <th class="produitTVA">TVA (%)</th>
                    //         <th class="produitPrix">Prix Unitaire HT (€)</th>
                    //         <th class="produitPrix">Prix total HT (€)</th>
                    //     </tr>
                    // </thead>

                    let contenuHTMLListeProduits = `
                        <td class="emptyTd"></td>
                        <td colspan="6" class="ctn_table">
                            <table>
                                <tbody>`
                    produit.listeProduits.forEach(produit => {
                        let puissanceProduit = '-'
                        if(produit.caracteristique && produit.uniteCaracteristique.trim().toUpperCase() === 'KW') puissanceProduit = produit.caracteristique + 'KW'

                        contenuHTMLListeProduits += `
                            <tr data-into="${uid}" data-idProduit="${produit.id}" data-isGroupe="${Number(produit.isGroupe)}" data-prixUnitaireHT="${produit.prixUnitaireHTApplique}">
                                <td class="produitQuantite">${produit.quantite}</td>
                                <td class="produitDesignation textFormated">${produit.designation ? produit.designation : produit.nom}</td>
                                <td class="produitPuissance">${puissanceProduit}</td>
                                <td class="produitTVA">${produit.tauxTVA}</td>
                            </tr>
                        `
                    })
                    contenuHTMLListeProduits += `
                                </tbody>
                            </table>
                        </td>
                    `

                    trContenu.innerHTML = contenuHTMLListeProduits

                    // ajout de la tr de contenu à la table
                    table.append(trContenu)
                }

                await pause(100)
                calculeTotalHT()
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
            const contenuGroupe = document.querySelector(`tr[data-for='${uid}']`)
            // si groupe retrait de la tr de contenu
            if(contenuGroupe) contenuGroupe.parentNode.removeChild(contenuGroupe)

            // retrait de la tr parente
            tr.parentNode.removeChild(tr)

            // recalcule du total
            calculeTotalHT()
        }
    }
}

async function changeQuantiteProduit(input) {
    if(input.checkValidity()) {
        const tr = input.closest('tr')
        if(tr) {
            const quantite = Number(input.value)
            const [tdPrixUnitaireHT, tdPrixTotalHT] = tr.querySelectorAll('.produitPrix')
            const inputPrixUnitaireHT = tdPrixUnitaireHT.querySelector('input')

            const prixUnitaireHT = Number(inputPrixUnitaireHT ? inputPrixUnitaireHT.value : tdPrixUnitaireHT.innerText)            
            const totalHT = quantite * prixUnitaireHT

            // modification du prix unitaire
            tdPrixTotalHT.innerText = totalHT.toFixed(2)

            const into = tr.getAttribute('data-into')            
            // si into !== null c'est un groupement de produits, 
            // donc il faut calculer le prix du parent
            if(into) calculePrixGroupeProduits(into)

            await pause(100)
            // calcule du total après que tout le reste est été calculé
            calculeTotalHT()
        }
    }
    else {
        input.reportValidity()
    }
}

async function changePrixProduit(input) {
    if(input.checkValidity()) {
        const tr = input.closest('tr')
        if(tr) {
            const prixUnitaireHT = Number(input.value)
            const quantite = Number(tr.querySelector('.produitQuantite input').value)

            const totalHT = quantite * prixUnitaireHT

            tr.querySelectorAll('.produitPrix')[1].innerText = totalHT.toFixed(2)

            const into = tr.getAttribute('data-into')            
            // si into !== null c'est un groupement de produits, 
            // donc il faut calculer le prix du parent
            if(into) calculePrixGroupeProduits(into)

            await pause(100)
            // calcule du total après que tout le reste est été calculé
            calculeTotalHT()
        }
    }
    else {
        input.reportValidity()
    }
}

function calculePrixGroupeProduits(uid) {
    if(uid) {        
        const tr = document.querySelector(`tr[data-uid="${uid}"]`)
        if(tr) {
            // vérifie que c'est un groupement
            if(!!Number(tr.getAttribute('data-isGroupe'))) {
                const listeTrProduits = Array.from(document.querySelectorAll(`tr[data-into="${uid}"]`))
                // prixUnitaireHT = somme prixTotalHT de chaque produit contenu
                if(listeTrProduits.length) {
                    const total = listeTrProduits.reduce((accumulator, tr) => {
                        const prixTotalHT = Number(tr.querySelectorAll('.produitPrix')[1].innerText)
                        return accumulator + prixTotalHT
                    }, 0)

                    // applique le prix des produits contenus dans le groupement
                    tr.querySelectorAll('.produitPrix')[0].innerText = total.toFixed(2)

                    // recalcule le total du groupement de produits
                    tr.querySelector('.produitQuantite input').onblur()
                }                
            }
        }
    }
}

function calculeTotalHT() {
    const listeTrProduits = Array.from(document.querySelectorAll('tr[data-uid]'))

    const total = listeTrProduits.reduce((accumulator, tr) => {
        return accumulator + Number(tr.querySelectorAll('.produitPrix')[1].innerText)
    }, 0)

    document.querySelectorAll('tfoot td.produitPrix')[1].innerText = total.toFixed(2)
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