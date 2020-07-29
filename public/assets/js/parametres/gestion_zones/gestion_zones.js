const generalError = "Une erreur s'est produite, veuillez vérifier votre connexion internet ou réessayer plus tard."

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
    if(document.querySelector('#div_ajax_sous-zone #cancel')) {
        document.getElementById('select_sous-zones').options[0].selected = true
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
    document.getElementById('div_zone_agences').innerHTML = 'Aucune agence disponible'
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
    document.getElementById('div_error_deps').innerHTML = ''

    try {
        let message = ''
        const nom = document.getElementById(`${action}_zone_nom`).value
        if(nom === '') throw "Le nom doit être renseigné."

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
                    deps : deps.toString()
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
                    deps : deps.toString()
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
        }

        document.getElementById('div_ajax_zone').innerHTML = message
        document.getElementById('select_zones').options[0].selected = true
        document.getElementById('select_sous-zones').options[0].selected = true
    }
    catch(e) {
        document.getElementById('div_error_deps').innerHTML = e
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
    document.getElementById('div_error_deps').innerHTML = ''

    try {
        let message = ''
        const nom = document.getElementById(`${action}_sous-zone_nom`).value
        if(nom === '') throw "Le nom doit être renseigné."

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
                    deps : deps.toString()
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
                    deps : deps.toString()
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
        }

        document.getElementById('div_ajax_zone').innerHTML = ''
        document.getElementById('div_ajax_sous-zone').innerHTML = message
        document.getElementById('select_sous-zones').options[0].selected = true
    }
    catch(e) {
        document.getElementById('div_error_deps').innerHTML = e
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

    if(document.querySelector('.collapse.show')) {
        const id = document.querySelector('.collapse.show').getAttribute('id')
        $(`#${id}`).collapse('hide')
    }
    
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
    document.getElementById('div_error_deps').innerHTML = ''

    try {
        let message = ''

        const nom = document.getElementById(`${action}_agence_nom`).value
        if(nom === '') throw "Le nom doit être renseigné."

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
                    deps : deps.toString()
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
                    deps : deps.toString()
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
        document.getElementById('div_error_deps').innerHTML = e
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
    const idVendeursTable = Array.from(document.querySelectorAll(`#div_vendeurs_agence_${idAgence} tbody tr`))
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
    document.querySelector(`#content_agence_${idAgence} .error_validate`).innerText = ''

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
    document.querySelector(`#content_agence_${idAgence} .error_validate`).innerHTML = ''

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
            if(data.infoObject.message) div_error_validate_vendeur = data.infoObject.message
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
            
            $('#vendeurAssocie_' + idVendeur).append("<td class='text-center'><button type='button' class='modifyVendeur'><svg width='1em' height='1em' viewBox='0 0 16 16' class='bi bi-gear' fill='currentColor' xmlns='http://www.w3.org/2000/svg'><path fill-rule='evenodd' d='M8.837 1.626c-.246-.835-1.428-.835-1.674 0l-.094.319A1.873 1.873 0 0 1 4.377 3.06l-.292-.16c-.764-.415-1.6.42-1.184 1.185l.159.292a1.873 1.873 0 0 1-1.115 2.692l-.319.094c-.835.246-.835 1.428 0 1.674l.319.094a1.873 1.873 0 0 1 1.115 2.693l-.16.291c-.415.764.42 1.6 1.185 1.184l.292-.159a1.873 1.873 0 0 1 2.692 1.116l.094.318c.246.835 1.428.835 1.674 0l.094-.319a1.873 1.873 0 0 1 2.693-1.115l.291.16c.764.415 1.6-.42 1.184-1.185l-.159-.291a1.873 1.873 0 0 1 1.116-2.693l.318-.094c.835-.246.835-1.428 0-1.674l-.319-.094a1.873 1.873 0 0 1-1.115-2.692l.16-.292c.415-.764-.42-1.6-1.185-1.184l-.291.159A1.873 1.873 0 0 1 8.93 1.945l-.094-.319zm-2.633-.283c.527-1.79 3.065-1.79 3.592 0l.094.319a.873.873 0 0 0 1.255.52l.292-.16c1.64-.892 3.434.901 2.54 2.541l-.159.292a.873.873 0 0 0 .52 1.255l.319.094c1.79.527 1.79 3.065 0 3.592l-.319.094a.873.873 0 0 0-.52 1.255l.16.292c.893 1.64-.902 3.434-2.541 2.54l-.292-.159a.873.873 0 0 0-1.255.52l-.094.319c-.527 1.79-3.065 1.79-3.592 0l-.094-.319a.873.873 0 0 0-1.255-.52l-.292.16c-1.64.893-3.433-.902-2.54-2.541l.159-.292a.873.873 0 0 0-.52-1.255l-.319-.094c-1.79-.527-1.79-3.065 0-3.592l.319-.094a.873.873 0 0 0 .52-1.255l-.16-.292c-.892-1.64.902-3.433 2.541-2.54l.292.159a.873.873 0 0 0 1.255-.52l.094-.319z'/><path fill-rule='evenodd' d='M8 5.754a2.246 2.246 0 1 0 0 4.492 2.246 2.246 0 0 0 0-4.492zM4.754 8a3.246 3.246 0 1 1 6.492 0 3.246 3.246 0 0 1-6.492 0z'/></svg></button><button type='button' class='deleteVendeur'><svg width='1em' height='1em' viewBox='0 0 16 16' class='bi bi-trash' fill='currentColor' xmlns='http://www.w3.org/2000/svg'><path d='M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z'/><path fill-rule='evenodd' d='M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z'/></svg></button></td>")
            await afficheVendeursLibres()
            initUIAgence()
        }

        cancelVendeur()
    }
    catch(e) {
        div_error_validate_vendeur = e
    }
    finally {
        document.querySelector(`#content_agence_${idAgence} .error_validate`).innerHTML = div_error_validate_vendeur 
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
                opt.text = `${vendeur.prenom} ${vendeur.nom}`

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
        document.getElementById('add_zone').onclick = dispatchActions
        document.getElementById('modify_zone').onclick = dispatchActions
        document.getElementById('add_sous-zone').onclick = dispatchActions
        document.getElementById('modify_sous-zone').onclick = dispatchActions
        document.getElementById('add_agence').onclick = dispatchActions

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