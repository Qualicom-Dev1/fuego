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
    let div_zone_commerciaux = ''
    remove_div_zone_agences()

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

            // récupération des commerciaux libres
            url = '/parametres/gestion-zones/get/vendeurs'

            response = await fetch(url, option)
            if(!response.ok) throw generalError

            data = await response.json()

            if(data.infoObject) {
                if(data.infoObject.error) throw data.infoObject.error
                if(data.infoObject.message) div_zone_commerciaux = data.infoObject.message
            }

            if(data.listeVendeurs) {
                const listeVendeurs = data.listeVendeurs

                div_zone_commerciaux = new EJS({ url : '/public/views/partials/parametres/gestion_zones/vendeurs.ejs' }).render({ locals : { listeVendeurs } })
            }
        }
    }
    catch(e) {
        div_zone_agences = e
        console.error(e)
    }
    finally {
        document.getElementById('div_zone_commerciaux').innerHTML = div_zone_commerciaux
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

async function addModifyAgence(action, eltClicked = undefined) {
    $('.loadingbackground').show()    

    if(document.querySelector('.collapse.show')) {
        document.querySelector('.collapse.show').classList.remove('show')
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

            document.getElementById(`content_agence_${idAgence}`).classList.add('show')
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
            document.getElementById(`content_agence_${agence.id}`).classList.add('show')
        }
    }
    catch(e) {
        document.getElementById('div_error_deps').innerHTML = e
    }
    finally {
        $('.loadingbackground').hide()
    }
}

async function showAgence(target) {
    $('.loadingbackground').show()

    const idAgence = target.getAttribute('id').split('_')[2]
    let div_vendeurs_agence = 'Agence vide'

    try {
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
    }
    finally {
        document.getElementById(`div_vendeurs_agence_${idAgence}`).innerHTML = div_vendeurs_agence
        $('.loadingbackground').hide()
    }
}

function hideAgence(target) {
    const idAgence = target.getAttribute('id').split('_')[2]
    document.getElementById(`div_ajax_agence_${idAgence}`).innerHTML = ''
}

async function validateVendeur(action) {
    // .collapse.show pour agence
    // data-target pour id vendeur
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

window.addEventListener('load', () => {
    initUI()
    $('.loadingbackground').hide()
})