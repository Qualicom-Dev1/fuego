function dispatchActions({ target }) {
    const a = target.closest('a')
    const [action, type] = a.getAttribute('id').split('_')
    
    remove_div_add_modify_deps()
    $('.loadingbackground').show()

    switch(type) {
        case 'zone' : 
            remove_div_zone_agences()
            addModifyZone(action)
            break;
        case 'sous-zone':
            remove_div_zone_agences()
            addModifySousZone(action)
            break;
        case 'agence' :
            addModifyAgence(action)
            break;
    }
}

function dispatchValidations({ target }) {
    const [action, type] = target.getAttribute('id').split('_')

    $('.loadingbackground').show()

    switch(type) {
        case 'zone' : 
            validateZone(action)
            break;
        case 'sous-zone':
            validateSousZone(action)
            break;
        case 'agence' :
            validateAgence(action)
            break;
    }
}

async function dispatchDeletes({ target }) {
    const [type, id] = target.getAttribute('data-target').split('_')

    switch(type) {
        case 'zone' : 
            deleteZone(id)
            break;
        case 'sous-zone':
            deleteSousZone(id)
            break;
        case 'agence' :
            deleteAgence(id)
            break;
    }
}

function remove_div_add_modify_deps() {
    // cas de la zone
    if(document.querySelector('#div_ajax_zone #cancel')) {
        document.getElementById('select_zones').onchange()
    }
    // cas de la sous-zone
    else if(document.querySelector('#div_ajax_sous-zone #cancel')) {
        document.getElementById('select_sous-zones').onchange()
    }
    // cas agence
    else if(document.querySelector('.collapse.show') !== null) {
        $('.afficheVendeur').show()
    }

    if(document.getElementById('div_add_modify_deps')) {
        const div = document.getElementById('div_add_modify_deps')
        div.parentNode.removeChild(div)
    }    
}

function emptySelect(id) {
    const children = document.querySelectorAll(`#${id} > option:enabled`)
    if(children.length) {
        for(const option of children) {
            option.parentNode.removeChild(option)
        }
    }
}

function remove_div_zone_agences() {
    document.getElementById('div_zone_agences').innerHTML = '<p style="text-align : center;">Aucune agence disponible</p>'
}

// renvoie la liste des départements sélectionnés
function getDeps() {
    if(document.getElementsByClassName('div_deps')[0]) {
        let deps = Array.from(document.getElementsByClassName('dep_active'), button => button.textContent)
            
        if(deps.length === 0) return null

        return deps
    }

    return null
}

async function addModifyZone(action) {
    let zone = undefined
    let div_add_modify_deps = undefined
    const type = 'zone'

    const option = {
        method : 'GET',
        headers : new Headers({
            "Content-type" : "application/json"
        })
    }   

    try {
        // vide le select sous-zones et sélectionne l'option explicative
        emptySelect('select_sous-zones')
        document.getElementById('select_sous-zones').options[0].selected = true

        if(action === 'modify') {
            if(document.querySelector('#select_zones :checked').value === '') {
                throw "Une zone doit être sélectionnée."
            }
            const idZone = (document.querySelector('#select_zones :checked').value).split('_')[1]
            
            const url = `/parametres/gestion-zones/${idZone}`
            const response = await fetch(url, option)

            if(response.ok) {
                const data = await response.json()

                if(data.infoObject && data.infoObject.error) {
                    throw data.infoObject.error
                }

                zone = data.zone

                div_add_modify_deps = new EJS({ url : '/public/views/partials/parametres/gestion_zones/ajouter-modifier_zone_sous-zone_agence.ejs' }).render({ locals : { action, type, element : zone } })
            }
            else {
                throw generalError
            }
        }
        else {
            document.getElementById('select_zones').options[0].selected = true

            const url = '/parametres/gestion-zones/get/depsUsed'         
            const response = await fetch(url, option)
            
            if(response.ok) {
                const data = await response.json()

                if(data.infoObject && data.infoObject.error) {
                    throw data.infoObject.error
                }

                zone = {
                    depsUsed : data.depsUsed
                }

                div_add_modify_deps = new EJS({ url : '/public/views/partials/parametres/gestion_zones/ajouter-modifier_zone_sous-zone_agence.ejs' }).render({ locals : { action, type, element : zone } })
            }
            else {
                throw generalError
            }
        }
    }
    catch(e) {
        div_add_modify_deps = e
    }
    finally {
        document.getElementById('div_ajax_zone').innerHTML = div_add_modify_deps
        setTimeout(() => {
            initUIDeps()
        }, 2)
        $('.loadingbackground').hide()
    }
}

async function deleteZone(idZone) {
    const zone = document.querySelector(`#select_zones option[value="zone_${idZone}"]`)
    const nomZone = zone.innerText

    if(confirm(`ëtes-vous sûr de vouloir supprimer la zone ${nomZone} ?`)) {
        $('.loadingbackground').show()

        const url = `/parametres/gestion-zones/${idZone}`
        const option = {
            method : 'DELETE',
            headers : new Headers({
                "Content-type" : "application/json"
            })
        } 

        let message = ''
        try {
            const response = await fetch(url, option)
            if(!response.ok) throw generalError

            const data = await response.json()

            if(data.infoObject) {
                if(data.infoObject.error) throw data.infoObject.error
                if(data.infoObject.message) message = data.infoObject.message
            }

            document.getElementById('select_zones').options[0].selected = true
            remove_div_add_modify_deps()
            emptySelect('select_sous-zones')
            document.getElementById('select_sous-zones').options[0].selected = true
            remove_div_zone_agences()
            await afficheVendeursLibres()
        }
        catch(e) {
            message = e
        }
        finally {
            $('.loadingbackground').hide()
            alert(message)
        }
    }
}

async function selectZone() {
    try {
        if(document.querySelector('#select_zones :checked').value !== '') {
            $('.loadingbackground').show()

            document.getElementById('div_ajax_zone').innerHTML = ''
            remove_div_add_modify_deps()
            emptySelect('select_sous-zones')
            const select = document.getElementById('select_sous-zones')
            select.options[0].selected = true
            remove_div_zone_agences()

            const idZone = (document.querySelector('#select_zones :checked').value).split('_')[1]

            const url = `/parametres/gestion-zones/${idZone}/sous-zones`
            const option = {
                method : 'GET',
                headers : new Headers({
                    "Content-type" : "application/json"
                })
            } 

            const response = await fetch(url, option)
            if(response.ok) {
                const data = await response.json()

                if(data.infoObject) {
                    if(data.infoObject.error) throw data.infoObject.error
                    if(data.infoObject.message) throw data.infoObject.message
                }

                const listeSousZones = data.listeSousZones

                for(const sousZone of listeSousZones) {
                    const opt = document.createElement("option")
                    opt.value = `sous-zone_${sousZone.id}`
                    opt.text = `${sousZone.nom} (${sousZone.deps})`

                    select.append(opt)
                }
            }
            else {
                throw generalError
            }
        }
    }
    catch(e) {
        document.getElementById('div_ajax_zone').innerHTML = e
    }
    finally {
        $('.loadingbackground').hide()
    }
}

async function validateZone(action) {    
    const select = document.getElementById('select_zones')
    const div_error_deps = document.getElementById('div_error_deps')
    div_error_deps.innerHTML = ''
    div_error_deps.classList.remove('error_message')
    div_error_deps.classList.remove('info_message')

    try {
        let message = ''
        const nom = document.getElementById(`${action}_zone_nom`).value
        if(nom === '') throw "Le nom doit être renseigné."

        const affichage_titre = document.getElementById(`${action}_zone_affichage_titre`).checked

        const deps = getDeps()
        if(deps === null) throw "Au moins un département doit être sélectionné."

        let url = undefined
        let option = undefined

        if(action === 'modify') {
            if(document.querySelector('#select_zones :checked').value === '') throw "Une zone doit être sélectionnée."

            const idZone = (document.querySelector('#select_zones :checked').value).split('_')[1]

            url = `/parametres/gestion-zones/${idZone}`
            option = {
                method : 'PATCH',
                headers : new Headers({
                    "Content-type" : "application/json"
                }),
                body : JSON.stringify({
                    nom,
                    deps : deps.toString(),
                    affichage_titre
                })
            } 
        }
        else {
            url = `/parametres/gestion-zones`
            option = {
                method : 'POST',
                headers : new Headers({
                    "Content-type" : "application/json"
                }),
                body : JSON.stringify({
                    nom,
                    deps : deps.toString(),
                    affichage_titre
                })
            } 
        }

        const response = await fetch(url, option)
        if(!response.ok) throw generalError

        const data = await response.json()

        if(data.infoObject) {
            if(data.infoObject.error) throw data.infoObject.error
            if(data.infoObject.message) message = data.infoObject.message
        }

        const zone = data.zone

        if(action === 'modify') {
            const opt = document.querySelector(`#select_zones option[value=zone_${zone.id}]`)
            opt.text = `${zone.nom} (${zone.deps})`
        }
        else {
            const opt = document.createElement("option")
            opt.value = `zone_${zone.id}`
            opt.text = `${zone.nom} (${zone.deps})`

            select.append(opt)

            // sélectionne la zone nouvellement créée
            document.querySelector(`#select_zones option[value=zone_${zone.id}]`).selected = true
        }

        document.getElementById('div_ajax_zone').append = `<p class='info_message'>${message}</p>`
        document.getElementById('select_zones').onchange()
    }
    catch(e) {
        div_error_deps.innerHTML = e
        div_error_deps.classList.add('error_message')
    }
    finally {
        $('.loadingbackground').hide()
    }
}

async function addModifySousZone(action) {
    let sousZone = undefined
    let div_add_modify_deps = undefined
    const type = 'sous-zone'

    const option = {
        method : 'GET',
        headers : new Headers({
            "Content-type" : "application/json"
        })
    }   

    try {
        if(action === 'modify') {
            if(document.querySelector('#select_zones :checked').value === '') {
                throw "Une zone doit être sélectionnée."
            }
            const idZone = (document.querySelector('#select_zones :checked').value).split('_')[1]

            if(document.querySelector('#select_sous-zones :checked').value === '') {
                throw "Une zone doit être sélectionnée."
            }
            const idSousZone = (document.querySelector('#select_sous-zones :checked').value).split('_')[1]
            
            const url = `/parametres/gestion-zones/${idZone}/sous-zones/${idSousZone}`
            const response = await fetch(url, option)

            if(response.ok) {
                const data = await response.json()

                if(data.infoObject && data.infoObject.error) {
                    throw data.infoObject.error
                }

                sousZone = data.sousZone


                div_add_modify_deps = new EJS({ url : '/public/views/partials/parametres/gestion_zones/ajouter-modifier_zone_sous-zone_agence.ejs' }).render({ locals : { action, type, element : sousZone } })
            }
            else {
                throw generalError
            }
        }
        else {
            document.getElementById('select_sous-zones').options[0].selected = true

            if(document.querySelector('#select_zones :checked').value === '') {
                throw "Une zone doit être sélectionnée."
            }
            const idZone = (document.querySelector('#select_zones :checked').value).split('_')[1]

            const url = `/parametres/gestion-zones/${idZone}`       
            const response = await fetch(url, option)
            
            if(response.ok) {
                const data = await response.json()

                if(data.infoObject && data.infoObject.error) {
                    throw data.infoObject.error
                }

                const zone = data.zone

                sousZone = {
                    depsUsed : zone.depsUsedZone,
                    depsSup : zone.deps
                }

                div_add_modify_deps = new EJS({ url : '/public/views/partials/parametres/gestion_zones/ajouter-modifier_zone_sous-zone_agence.ejs' }).render({ locals : { action, type, element : sousZone } })
            }
            else {
                throw generalError
            }
        }
    }
    catch(e) {
        div_add_modify_deps = e
    }
    finally {
        document.getElementById('div_ajax_sous-zone').innerHTML = div_add_modify_deps
        setTimeout(() => {
            initUIDeps()
        }, 2)
        $('.loadingbackground').hide()
    }
}

async function selectSousZone() {
    remove_div_zone_agences()
    let div_zone_agences = ''

    try {
        if(document.querySelector('#select_sous-zones :checked').value !== '') {
            $('.loadingbackground').show()

            document.getElementById('div_ajax_sous-zone').innerHTML = ''
            remove_div_add_modify_deps()

            const idSousZone = (document.querySelector('#select_sous-zones :checked').value).split('_')[1]

            // récupération des agences
            let url = `/parametres/gestion-zones/sous-zones/${idSousZone}/agences`
            const option = {
                method : 'GET',
                headers : new Headers({
                    "Content-type" : "application/json"
                })
            } 

            let response = await fetch(url, option)
            if(!response.ok) throw generalError

            let data = await response.json()

            if(data.infoObject) {
                if(data.infoObject.error) throw data.infoObject.error
                if(data.infoObject.message) div_zone_agences = data.infoObject.message
            }

            if(data.listeAgences) {
                const listeAgences = data.listeAgences

                div_zone_agences = new EJS({ url : '/public/views/partials/parametres/gestion_zones/agences.ejs' }).render({ locals : { listeAgences } })
            }
        }
    }
    catch(e) {
        div_zone_agences = e
    }
    finally {
        document.getElementById('div_zone_agences').innerHTML = div_zone_agences
        setTimeout(() => {
            initUIAgences()
        }, 2)
        $('.loadingbackground').hide()
    }
}

async function validateSousZone(action) {
    const select = document.getElementById('select_sous-zones')
    const div_error_deps = document.getElementById('div_error_deps')
    div_error_deps.innerHTML = ''
    div_error_deps.classList.remove('error_message')
    div_error_deps.classList.remove('info_message')

    try {
        let message = ''
        const nom = document.getElementById(`${action}_sous-zone_nom`).value
        if(nom === '') throw "Le nom doit être renseigné."

        const affichage_titre = document.getElementById(`${action}_sous-zone_affichage_titre`).checked

        if(document.querySelector('#select_zones :checked').value === '') throw "Une zone doit être sélectionnée."
        const idZone = (document.querySelector('#select_zones :checked').value).split('_')[1]

        const deps = getDeps()
        if(deps === null) throw "Au moins un département doit être sélectionné."

        let url = undefined
        let option = undefined

        if(action === 'modify') {
            if(document.querySelector('#select_sous-zones :checked').value === '') throw "Une sous-zone doit être sélectionnée."
            const idSousZone = (document.querySelector('#select_sous-zones :checked').value).split('_')[1]

            url = `/parametres/gestion-zones/${idZone}/sous-zones/${idSousZone}`
            option = {
                method : 'PATCH',
                headers : new Headers({
                    "Content-type" : "application/json"
                }),
                body : JSON.stringify({
                    nom,
                    deps : deps.toString(),
                    affichage_titre
                })
            } 
        }
        else {
            url = `/parametres/gestion-zones/${idZone}/sous-zones`
            option = {
                method : 'POST',
                headers : new Headers({
                    "Content-type" : "application/json"
                }),
                body : JSON.stringify({
                    nom,
                    deps : deps.toString(),
                    affichage_titre
                })
            } 
        }

        const response = await fetch(url, option)
        if(!response.ok) throw generalError

        const data = await response.json()

        if(data.infoObject) {
            if(data.infoObject.error) throw data.infoObject.error
            if(data.infoObject.message) message = data.infoObject.message
        }

        const sousZone = data.sousZone

        if(action === 'modify') {
            const opt = document.querySelector(`#select_sous-zones option[value=sous-zone_${sousZone.id}]`)
            opt.text = `${sousZone.nom} (${sousZone.deps})`
        }
        else {
            const opt = document.createElement("option")
            opt.value = `sous-zone_${sousZone.id}`
            opt.text = `${sousZone.nom} (${sousZone.deps})`

            select.append(opt)

            // sélectionne la sous-zone nouvellement créée
            document.querySelector(`#select_sous-zones option[value=sous-zone_${sousZone.id}]`).selected = true
        }

        document.getElementById('div_ajax_zone').innerHTML = ''
        document.getElementById('div_ajax_sous-zone').append = `<p class='info_message'>${message}</p>`
        document.getElementById('select_sous-zones').onchange()
    }
    catch(e) {
        div_error_deps.innerHTML = e
        div_error_deps.classList.add('error_message')
    }
    finally {
        $('.loadingbackground').hide()
    }
}

async function deleteSousZone(idSousZone) {
    const zone = document.querySelector('#select_zones :checked')
    const idZone = zone.value.split('_')[1]
    const nomZone = zone.innerText

    const sousZone = document.querySelector(`#select_sous-zones option[value="sous-zone_${idSousZone}"]`)
    const nomSousZone = sousZone.innerText

    if(confirm(`Êtes-vous sûr de vouloir supprimer la sous-zone ${nomSousZone} de la zone ${nomZone} ?`)) {
        $('.loadingbackground').show()

        const url = `/parametres/gestion-zones/${idZone}/sous-zones/${idSousZone}`
        const option = {
            method : 'DELETE',
            headers : new Headers({
                "Content-type" : "application/json"
            })
        } 

        let message = ''
        try {
            const response = await fetch(url, option)
            if(!response.ok) throw generalError

            const data = await response.json()

            if(data.infoObject) {
                if(data.infoObject.error) throw data.infoObject.error
                if(data.infoObject.message) message = data.infoObject.message
            }

            await document.getElementById('select_zones').onchange()
            await afficheVendeursLibres()
        }
        catch(e) {
            message = e
        }
        finally {
            $('.loadingbackground').hide()
            alert(message)
        }
    }
}

async function addModifyAgence(action, eltClicked = undefined) {
    $('.loadingbackground').show()    

    // if(document.querySelector('.collapse.show')) {
    //     const id = document.querySelector('.collapse.show').getAttribute('id')
    //     $(`#${id}`).collapse('hide')
    // }
    
    let agence = undefined
    let div_add_modify_deps = undefined
    const type = 'agence'

    const option = {
        method : 'GET',
        headers : new Headers({
            "Content-type" : "application/json"
        })
    }  

    try {
        if(document.querySelector('#select_sous-zones :checked').value === '') {
            throw "Une zone doit être sélectionnée."
        }
        const idSousZone = (document.querySelector('#select_sous-zones :checked').value).split('_')[1]
        
        if(action === 'modify') {
            let idAgence = undefined
            if(eltClicked) {
                idAgence = eltClicked.target.getAttribute('id').split('_')[2]                
            }
            
            const url = `/parametres/gestion-zones/sous-zones/${idSousZone}/agences/${idAgence}`
            const response = await fetch(url, option)

            if(!response.ok) throw generalError

            const data = await response.json()

            if(data.infoObject && data.infoObject.error) throw data.infoObject.error

            agence = data.agence

            div_add_modify_deps = new EJS({ url : '/public/views/partials/parametres/gestion_zones/ajouter-modifier_zone_sous-zone_agence.ejs' }).render({ locals : { action, type, element : agence } })
            
            document.getElementById(`div_ajax_agence_${idAgence}`).innerHTML = div_add_modify_deps
            
            $(`#content_agence_${idAgence}`).collapse('show')
            $(`#content_agence_${idAgence} .afficheVendeur`).hide()
        }
        else {
            if(document.querySelector('#select_zones :checked').value === '') {
                throw "Une zone doit être sélectionnée."
            }
            const idZone = (document.querySelector('#select_zones :checked').value).split('_')[1]

            if(document.querySelector('#select_sous-zones :checked').value === '') {
                throw "Une sous-zone doit être sélectionnée."
            }
            const idSousZone = (document.querySelector('#select_sous-zones :checked').value).split('_')[1]

            const url = `/parametres/gestion-zones/${idZone}/sous-zones/${idSousZone}`
            const response = await fetch(url, option)

            if(!response.ok) throw generalError

            const data = await response.json()

            if(data.infoObject && data.infoObject.error) throw data.infoObject.error

            const sousZone = data.sousZone

            const agence = {
                depsUsed : sousZone.depsUsedSousZone,
                depsSup : sousZone.deps
            }

            div_add_modify_deps = new EJS({ url : '/public/views/partials/parametres/gestion_zones/ajouter-modifier_zone_sous-zone_agence.ejs' }).render({ locals : { action, type, element : agence } })

            document.getElementById('div_ajax_agence').innerHTML = div_add_modify_deps
        }

        setTimeout(() => {
            initUIDeps()
        }, 2)
    }
    catch(e) {
        console.error(e)
        div_add_modify_deps = e
        document.getElementById('div_ajax_agence').innerHTML = div_add_modify_deps
    }
    finally {
        $('.loadingbackground').hide()
    }
}

async function validateAgence(action) {
    const div_error_deps = document.getElementById('div_error_deps')
    div_error_deps.innerHTML = ''
    div_error_deps.classList.remove('error_message')
    div_error_deps.classList.remove('info_message')

    try {
        let message = ''

        const nom = document.getElementById(`${action}_agence_nom`).value
        if(nom === '') throw "Le nom doit être renseigné."

        const affichage_titre = document.getElementById(`${action}_agence_affichage_titre`).checked

        if(document.querySelector('#select_sous-zones :checked').value === '') throw "Une zone doit être sélectionnée."
        const idSousZone = (document.querySelector('#select_sous-zones :checked').value).split('_')[1]

        const deps = getDeps()
        if(deps === null) throw "Au moins un département doit être sélectionné."

        let url = undefined
        let option = undefined

        if(action === 'modify') {
            let idAgence = undefined
            if(document.getElementsByClassName('collapse show')) {
                idAgence = document.getElementsByClassName('collapse show')[0].getAttribute('id').split('_')[2]
            }
            if(!idAgence) throw "Une agence doit être sélectionnée."

            url = `/parametres/gestion-zones/sous-zones/${idSousZone}/agences/${idAgence}`
            option = {
                method : 'PATCH',
                headers : new Headers({
                    "Content-type" : "application/json"
                }),
                body : JSON.stringify({
                    nom,
                    deps : deps.toString(),
                    affichage_titre
                })
            } 
        }
        else {
            url = `/parametres/gestion-zones/sous-zones/${idSousZone}/agences`
            option = {
                method : 'POST',
                headers : new Headers({
                    "Content-type" : "application/json"
                }),
                body : JSON.stringify({
                    nom,
                    deps : deps.toString(),
                    affichage_titre
                })
            } 
        }

        const response = await fetch(url, option)
        if(!response.ok) throw generalError

        const data = await response.json()

        if(data.infoObject) {
            if(data.infoObject.error) throw data.infoObject.error
            if(data.infoObject.message) message = data.infoObject.message
        }

        const agence = data.agence

        if(action === 'modify') {
            const button = document.querySelector(`button[data-target='#content_agence_${agence.id}']`)
            button.textContent = `${agence.nom} (${agence.deps})`
            remove_div_add_modify_deps()
        }
        else {
            await document.getElementById('select_sous-zones').onchange()
            setTimeout(() => {
                $(`#content_agence_${agence.id}`).collapse('show')
            }, 2)
        }
    }
    catch(e) {
        div_error_deps.innerHTML = e
        div_error_deps.classList.add('error_message')
        console.error(e)
    }
    finally {
        $('.loadingbackground').hide()
    }
}

async function deleteAgence(idAgence) {
    const sousZone = document.querySelector('#select_sous-zones :checked')
    const idSousZone = sousZone.value.split('_')[1]
    const nomSousZone = sousZone.innerText

    const agence = document.querySelector(`button[data-target="#content_agence_${idAgence}"]`)
    const nomAgence = agence.innerText

    if(confirm(`Êtes-vous sûr de vouloir supprimer l'agence ${nomAgence} de la sous-zone ${nomSousZone} ?`)) {
        $('.loadingbackground').show()

        const url = `/parametres/gestion-zones/sous-zones/${idSousZone}/agences/${idAgence}`
        const option = {
            method : 'DELETE',
            headers : new Headers({
                "Content-type" : "application/json"
            })
        } 

        let message = ''
        try {
            const response = await fetch(url, option)
            if(!response.ok) throw generalError

            const data = await response.json()

            if(data.infoObject) {
                if(data.infoObject.error) throw data.infoObject.error
                if(data.infoObject.message) message = data.infoObject.message
            }

            // retire le card représentant l'agence
            const div_agence = document.getElementById(`agence_${idAgence}`).closest('.card')
            div_agence.parentNode.removeChild(div_agence)

            // met à jour la liste des vendeurs libres
            await afficheVendeursLibres()
        }
        catch(e) {
            message = e
        }
        finally {
            $('.loadingbackground').hide()
            alert(message)
        }
    }
}

async function showAgence(target) {
    $('.loadingbackground').show()

    $('.afficheVendeur').show()

    const idAgence = target.getAttribute('id').split('_')[2]
    let div_vendeurs_agence = 'Agence vide'

    try {
        // maj des vendeurs libres
        await afficheVendeursLibres()

        const select = document.querySelector(`#content_agence_${idAgence} .select_vendeur`)

        initUIDeps()

        // récupération des vendeurs de l'agence
        const url = `/parametres/gestion-zones/sous-zones/agences/${idAgence}/vendeurs`
        const option = {
            method : 'GET',
            headers : new Headers({
                "Content-type" : "application/json"
            })
        }

        const response = await fetch(url, option)
        if(!response.ok) throw generalError

        const data = await response.json()

        if(data.infoObject && data.infoObject.error) throw data.infoObject.error

        const listeVendeurs = data.listeVendeurs

        div_vendeurs_agence = new EJS({ url : '/public/views/partials/parametres/gestion_zones/agence.ejs' }).render({ locals : { listeVendeurs } })        
    }
    catch(e) {
        div_vendeurs_agence = e
        console.error(e)
    }
    finally {
        document.getElementById(`div_vendeurs_agence_${idAgence}`).innerHTML = div_vendeurs_agence
        setTimeout(() => {
            initUIAgence()
        }, 2)
        $('.loadingbackground').hide()
    }
}

function hideAgence(target) {
    const idAgence = target.getAttribute('id').split('_')[2]
    document.getElementById(`div_ajax_agence_${idAgence}`).innerHTML = ''

    const children = document.querySelectorAll(`#content_agence_${idAgence} .select_vendeur > option:enabled`)
    if(children.length) {
        for(const option of children) {
            option.parentNode.removeChild(option)
        }
    }
}

function modifyVendeur({ target }) {
    const parentTr = target.closest('tr')
    const tds = parentTr.querySelectorAll('td')

    const idVendeur = parentTr.getAttribute('id').split('_')[1]
    const nom = tds[0].textContent
    const depPrincipal = tds[1].textContent
    const deps = tds[2].textContent.split(',')

    const idAgence = document.querySelector('.collapse.show').getAttribute('id').split('_')[2]

    const select = document.querySelector(`#content_agence_${idAgence} .select_vendeur`)
    
    // retire les vendeurs s'il y a déjà eu des clics sur modification
    const idVendeursTable = Array.from(document.querySelectorAll(`#div_vendeurs_agence_${idAgence} tbody tr[id]`))
        .map(tr => tr.getAttribute('id').split('_')[1])
    for(const id of idVendeursTable) {
        const opt = select.querySelector(`option[value='vendeur_${id}']`)
        if(opt !== null) {
            opt.parentNode.removeChild(opt)
        }
    }

    // cache les autres vendeur
    const listeOptions = select.querySelectorAll('option:enabled')
    if(listeOptions.length) {
        for(const option of listeOptions) {
            option.setAttribute('hidden', true)
        }
    }

    const opt = document.createElement('option')
    opt.value = `vendeur_${idVendeur}`
    opt.textContent = nom
    opt.setAttribute('selected', true)
    select.append(opt)

    document.querySelector(`#content_agence_${idAgence} .depPrincipal`).value = depPrincipal

    const listeDeps = document.querySelectorAll(`#content_agence_${idAgence} .div_deps button`)
    for(const button of listeDeps) {
        if(deps.includes(button.textContent)) {
            button.classList.add('dep_active')
        }
        else {
            button.classList.remove('dep_active')
        }
    }

    const buttonValidate = document.querySelector(`#content_agence_${idAgence} .validate_vendeur`)
    buttonValidate.setAttribute('data-action', 'modify')
}

function cancelVendeur() {
    const idAgence = document.querySelector('.collapse.show').getAttribute('id').split('_')[2]

    const select = document.querySelector(`#content_agence_${idAgence} .select_vendeur`)

    // retire le vendeur modifié s'il y en a un
    const buttonValidate = document.querySelector(`#content_agence_${idAgence} .validate_vendeur`)
    if(buttonValidate.getAttribute('data-action') === 'modify') {
        select.removeChild(select.querySelector(':checked'))
    }

    // affiche la liste des vendeurs cachés
    const listeOptions = select.querySelectorAll('option[hidden=true]')
    if(listeOptions.length) {
        for(const option of listeOptions) {
            option.removeAttribute('hidden')
        }
    }

    // sélectionne l'option d'explication
    select.options[0].selected = true

    // retire le département principal
    document.querySelector(`#content_agence_${idAgence} .depPrincipal`).value = ''

    // retire les départements actifs
    const listeDeps = document.querySelectorAll(`#content_agence_${idAgence} .div_deps .dep_active`)
    if(listeDeps.length) {
        for(const button of listeDeps) {
            button.classList.remove('dep_active')
        }
    }

    // retire le contenu de la div d'information
    const div_error_validate = document.querySelector(`#content_agence_${idAgence} .error_validate p`)
    div_error_validate.innerText = ''
    div_error_validate.classList.remove('error_message')
    div_error_validate.classList.remove('info_message')

    // repasse le bouton valider en ajout
    buttonValidate.setAttribute('data-action', 'add')
}

async function deleteVendeur({ target }) {
    const idAgence = document.querySelector('.collapse.show').getAttribute('id').split('_')[2]    

    const nomAgence = document.querySelector(`button[data-target="#content_agence_${idAgence}"]`).innerText

    const tr = target.closest('tr')
    const tds = tr.querySelectorAll('td')
    const nomVendeur = tds[0].innerText
    const depPrincipal = tds[1].innerText

    if(confirm(`Êtes-vous sûr de vouloir retirer ${nomVendeur} de l'agence ${nomAgence} ?`)) {
        $('.loadingbackground').show()
        const idVendeur = tr.getAttribute('id').split('_')[1]
        const url = `/parametres/gestion-zones/sous-zones/agences/${idAgence}/vendeurs/${idVendeur}`
        const option = {
            method : 'DELETE',
            headers : new Headers({
                "Content-type" : "application/json"
            })
        } 

        let message = ''
        try {
            const response = await fetch(url, option)
            if(!response.ok) throw generalError

            const data = await response.json()

            if(data.infoObject) {
                if(data.infoObject.error) throw data.infoObject.error
                if(data.infoObject.message) message = data.infoObject.message
            }

            // retrait de la tr
            tr.parentNode.removeChild(tr)
            
            // si suppresion de la dernière tr, afficher agence vide
            // const listeTr = document.querySelectorAll(`#content_agence_${idAgence} tbody tr`)
            
            // ajout du vendeur dans le select
            const opt = document.createElement('option')
            opt.value = `vendeur_${idVendeur}`
            opt.text = nomVendeur
            document.querySelector(`#content_agence_${idAgence} .select_vendeur`).append(opt)

            // ajout du vendeur dans la lsite des vendeurs libres
            const span = document.createElement('span')
            span.classList.add('badge')
            span.classList.add('badge-secondary')
            span.id = `vendeurLibre_${idVendeur}`
            span.textContent = `${nomVendeur} (${depPrincipal})`
            document.getElementById('listeVendeursLibres').append(span)
        }
        catch(e) {
            message = e
        }
        finally {
            $('.loadingbackground').hide()
            alert(message)
        }
    }
}

async function validateVendeur({ target }) {
    $('.loadingbackground').show()

    const idAgence = document.querySelector('.collapse.show').getAttribute('id').split('_')[2]    

    let div_error_validate_vendeur = ''
    const div_error_validate = document.querySelector(`#content_agence_${idAgence} .error_validate p`)
    div_error_validate.innerText = ''
    div_error_validate.classList.remove('error_message')
    div_error_validate.classList.remove('info_message')

    const action = target.getAttribute('data-action')

    try {
        const idVendeur = Number(document.querySelector(`#content_agence_${idAgence} .select_vendeur > :checked`).value.split('_')[1])
        const depPrincipal = document.querySelector(`#content_agence_${idAgence} .depPrincipal`).value

        if(isNaN(idVendeur)) throw "Un vendeur doit être sélectionné."
        if(depPrincipal === '') throw 'Un département principal doit être sélectionné.'
        if(Number(depPrincipal) < 1 || Number(depPrincipal) > 98) throw "Le département principal doit être compris entre 01 et 98." 

        const listeDeps = Array.from(document.querySelectorAll(`#content_agence_${idAgence} .div_deps button`)).map(button => button.textContent)
        if(!listeDeps.includes(depPrincipal)) throw "Le département principal doit être dans la liste des départements de l'agence."

        const selectedDeps = Array.from(document.querySelectorAll(`#content_agence_${idAgence} .dep_active`)).map(button => button.textContent)
        if(selectedDeps.length === 0) throw "Au moins un département doit être sélectionné."
        if(!selectedDeps.includes(depPrincipal)) throw "Le département principal doit faire partie de la liste de départements sélectionnés."

        let url = ''
        const option = {
            headers : new Headers({
                "Content-type" : "application/json"
            })
        } 

        const affectation = {
            depPrincipal : depPrincipal,
            deps : selectedDeps.toString()
        }

        if(action === 'modify') {
            url = `/parametres/gestion-zones/sous-zones/agences/${idAgence}/vendeurs/${idVendeur}`
            option.method = 'PATCH'
        }
        // add
        else {
            url = `/parametres/gestion-zones/sous-zones/agences/${idAgence}/vendeurs`
            option.method = 'POST'
            affectation.idVendeur = idVendeur
        }

        option.body = JSON.stringify(affectation)

        const response = await fetch(url, option)
        if(!response.ok) throw generalError

        const data = await response.json()
        if(data.infoObject) {
            if(data.infoObject.error) throw data.infoObject.error
            if(data.infoObject.message) {
                div_error_validate_vendeur = data.infoObject.message                
            }
        }

        if(action === 'modify') {
            const tds = document.querySelectorAll(`#vendeurAssocie_${idVendeur} > td`)
            tds[1].innerText = affectation.depPrincipal
            tds[2].innerText = affectation.deps.toString()
        }
        else {
            const table = document.querySelector(`#content_agence_${idAgence} tbody`)

            // vérifie si l'agence était vide, auquel cas retire cette tr
            const trAgenceVide = table.querySelector('td[colspan="4"]')
            if(trAgenceVide) {
                trAgenceVide.parentNode.removeChild(trAgenceVide)
            }

            // nouvelle tr à ajouter
            const tr = document.createElement('tr')
            tr.id = `vendeurAssocie_${idVendeur}`

            // nom
            let td = document.createElement('td')
            td.innerText = document.querySelector(`#content_agence_${idAgence} .select_vendeur :checked`).text
            tr.append(td)

            // depPrincipal
            td = document.createElement('td')
            td.classList.add('text-center')
            td.innerText = affectation.depPrincipal
            tr.append(td)

            // deps
            td = document.createElement('td')
            td.classList.add('text-center')
            td.innerText = affectation.deps.toString()
            tr.append(td)

            table.append(tr)
            
            $('#vendeurAssocie_' + idVendeur).append("<td class='text-center'><button type='button' class='modifyVendeur'><div class=' btn_item2 hover_btn1'><i class='fas fa-pen'></i></div></button><button type='button' class='deleteVendeur'><div class='btn_item2 hover_btn1'><i class='fas fa-times'></i></div></button></td>")
            await afficheVendeursLibres()
            initUIAgence()
        }

        cancelVendeur()
        div_error_validate.classList.add('info_message')
    }
    catch(e) {
        div_error_validate_vendeur = e
        div_error_validate.classList.add('error_message')
    }
    finally {
        div_error_validate.innerText = div_error_validate_vendeur 
        $('.loadingbackground').hide()
    }
}

async function afficheVendeursLibres() {
    // $('.loadingbackground').show()

    let div_zone_commerciaux = ''

    let listeVendeurs = undefined
    const tabOptions = []

    try {
        // récupération des vendeurs libres
        const url = '/parametres/gestion-zones/get/vendeurs'
        const option = {
            method : 'GET',
            headers : new Headers({
                "Content-type" : "application/json"
            })
        } 

        const response = await fetch(url, option)
        if(!response.ok) throw generalError

        let data = await response.json()

        if(data.infoObject) {
            if(data.infoObject.error) throw data.infoObject.error
            if(data.infoObject.message) div_zone_commerciaux = data.infoObject.message
        }

        if(data.listeVendeurs) {
            listeVendeurs = data.listeVendeurs

            // création de la liste de vendeurs libres
            div_zone_commerciaux = new EJS({ url : '/public/views/partials/parametres/gestion_zones/vendeurs.ejs', async : true }).render({ locals : { listeVendeurs } }, { async : true })
        
            // création des options pour les selects de vendeurs libres
            for(const vendeur of listeVendeurs) {
                const opt = document.createElement("option")
                opt.value = `vendeur_${vendeur.id}`
                opt.text = `${vendeur.nom} ${vendeur.prenom}`

                tabOptions.push(opt)
            }  
        }
        else {
            const opt = document.createElement("option")
            opt.text = 'Aucun vendeur disponible'
            opt.selected = true

            tabOptions.push(opt)
        }
    }
    catch(e) {
        div_zone_commerciaux  = e
    }
    finally {
        // affectation du résultat à la zone commercial pour les vendeurs libres
        document.getElementById('div_zone_commerciaux').innerHTML = div_zone_commerciaux
        
        // mise à jour des selects
        const listeSelects = document.querySelectorAll('.select_vendeur')
        if(listeSelects.length) {
            for(const select of listeSelects) {
                // vide le select
                const children = select.querySelectorAll('option:enabled')
                if(children.length) {
                    for(const option of children) {
                        select.removeChild(option)
                    }
                }

                // ajoute la liste des vendeurs
                for(const option of tabOptions) {
                    select.append(option.cloneNode(true))
                }
            }
        }
        
        // $('.loadingbackground').hide()
    }
}

function initUI() {
    try {
        document.querySelector('#add_zone svg').onclick = dispatchActions
        document.getElementById('modify_zone').onclick = dispatchActions
        document.querySelector('#add_sous-zone svg').onclick = dispatchActions
        document.getElementById('modify_sous-zone').onclick = dispatchActions
        document.querySelector('#add_agence svg').onclick = dispatchActions

        document.getElementById('select_zones').onchange = selectZone
        document.getElementById('select_sous-zones').onchange = selectSousZone
    }
    catch(e) {
        console.error("Erreur d'initialisation de l'UI.")
    }
}

window.addEventListener('load', async () => {
    initUI()
    await afficheVendeursLibres()
    $('.loadingbackground').hide()
})