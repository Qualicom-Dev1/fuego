// $(document).ready(() => {

//     setClick()

//     $('#type_de_fichier').change((event) => {
//         let data = {
//             type_de_fichier: $("#type_de_fichier option:selected").val()
//         }
//         $.ajax({
//             url: '/manager/get-type',
//             method: 'POST',
//             data: data
//          }).done((data) => {
//             $("#sous_type").html('')
//             $("#sous_type").append('<option value="" selected>Type de fichier</option>');
//             data.forEach(element => {
//                 $("#sous_type").append('<option value="'+element.DISTINCT+'">'+element.DISTINCT+'</option>');
//             })
//          });
//     })

//     $('.btn_item').click((event) => {

//         let idCampagnes = [];
//         $('.campagnes_active').each( (index, element) =>  {
//             idCampagnes.push($(element).attr('id'));
//         });

//         let data = {
//             'deps': $('#deps').val(),
//             'idUser': $('.telec_active').attr('id'),
//             'sous_type': $("#sous_type option:selected").val(),
//             'type_de_fichier': $("#type_de_fichier option:selected").val(),
//             'campagnes': idCampagnes.length == 0 ? '' : idCampagnes
//         }
//         $.ajax({
//             url: '/manager/update/directives',
//             method: 'POST',
//             data: data
//          }).done((data) => {
//             $('.select_telec').html('');
//             if(data != 0){
//                 data.findedUsers.forEach(element => {
//                     let user = new EJS({ url: '/public/views/partials/user_directive'}).render({user_directive: element, findedCampagnes: data.findedCampagnes, _:_});
//                     $('.select_telec').append(user)
//                         syncdepsDisabled(element.Structures[0].deps.split(','))
//                     });
//             }
//             setClick()
//          });
//         $('.telec_item').removeClass('telec_active')
//         $('.directive_deps button').removeClass('dep_active')
//         $('.campagnes button').removeClass('campagnes_active')
//         $('#deps').val('')
//     });

//     $('#deps').change(() => {
//         syncdeps($('#deps').val().split(','))
//     });

//     $('.directive_deps button').click( (event) => {

//         if (!$(event.currentTarget).hasClass('dep_active')) {
//             $(event.currentTarget).addClass('dep_active')
//             if($('#deps').val().length != 0 ){
//                 $('#deps').val($('#deps').val()+','+$(event.currentTarget).html())
//             }else{
//                 $('#deps').val($(event.currentTarget).html())
//             }
//         } else {
//             $(event.currentTarget).removeClass('dep_active')
//             let deps = $('#deps').val().split(',')
//             deps.removeA($(event.currentTarget).html())
//             $('#deps').val(deps.join(','))
//         }            
//     });

//     $('.campagnes button').click( (event) => {

//         if (!$(event.currentTarget).hasClass('campagnes_active')) {
            
//             $('#deps').val('')
//             $('#type_de_fichier').prop("selectedIndex", 0)
//             $('#sous_type').prop("selectedIndex", 0)
//             $('.directive_deps button').removeClass('dep_active')
            
//             $(event.currentTarget).addClass('campagnes_active')
        
//             let deps = []
            
//             $('.campagnes_active').each( (index, element) => {
//                 deps.push($(element).attr('data-deps').split(','))
//             })
//             syncdepsDisabled(_.uniq(_.flatten(deps)))

//         } else {
                        
//             $('#deps').val('')
//             $('#type_de_fichier').prop("selectedIndex", 0)
//             $('#sous_type').prop("selectedIndex", 0)
//             $('.directive_deps button').removeClass('dep_active')
            
//             $(event.currentTarget).removeClass('campagnes_active')

//             let deps = []
//             $('.campagnes_active').each( (index, element) => {
//                 deps.push($(element).attr('data-deps').split(','))
//             })
//             syncdepsDisabled(_.uniq(_.flatten(deps)))
//         }            
//     });

// });

// function setClick(){
//     $('.telec_item').click( (event) => {
//         $('.telec_item').removeClass('telec_active')
//         $(event.currentTarget).addClass('telec_active')
//         $('.campagnes button').removeClass('campagnes_active')

//         $('#type_de_fichier option[value="'+$(event.currentTarget).children('.tel_item2').children('.type_de_fichier').html()+'"]').prop('selected', true);
//         $('#sous_type option[value="'+$(event.currentTarget).children('.tel_item2').children('.sous_type').html()+'"]').prop('selected', true);

//         $(event.currentTarget).children('.tel_item2').children('.campagnes_select').html().split(' / ').forEach((element) => {
//             if(element != ''){
//                 $('.campagnes button:contains('+element+')').addClass('campagnes_active')
//             }
//         })



//         let deps = []
//         if($('.campagnes_active').length != 0){
//             $('.campagnes_active').each( (index, element) => {
//                 deps.push($(element).attr('data-deps').split(','))
//             })
//         }else{
//             deps = $(event.currentTarget).attr('data-deps').split(',')
//         }
//         syncdepsDisabled(_.uniq(_.flatten(deps)))

//         $('#deps').val($(event.currentTarget).children('.tel_item1').children('.deps').html())
//         syncdeps($('#deps').val().split(','))
//     });    
// }

// function syncdeps(deps){
//     $('.directive_deps button').removeClass('dep_active')
//     if(deps.length != 1){
//         deps.forEach((dep) =>{
//             $('.directive_deps button:contains('+dep+')').addClass('dep_active')
//         });
//     }
// }

// function syncdepsDisabled(deps){
//     $('.directive_deps button').attr('disabled', true)
//     deps.forEach((dep) =>{
//         $('.directive_deps button:contains('+dep+')').attr('disabled', false)
//     });
// }

// Array.prototype.removeA = function() {
//     let what, a = arguments, L = a.length, ax;
//     while (L && this.length) {
//         what = a[--L];
//         while ((ax = this.indexOf(what)) !== -1) {
//             this.splice(ax, 1);
//         }
//     }
//     return this;
// };
const generalError = "Une erreur s'est produite, veuillez vérifier votre connexion internet ou réessayer plus tard."

function emptySelect(id) {
    const select = document.getElementById(id)
    if(select) {
        select.options[0].selected = true

        const children = document.querySelectorAll(`#${id} > option:enabled`)
        if(children.length) {
            for(const option of children) {
                option.parentNode.removeChild(option)
            }
        }
    }
}

function initUI() {
    document.getElementById('checkCustomOrCampagne').onchange = switchCustomOrCampagne
    document.getElementById('select_campagnes').onchange = selectCampagne
    document.getElementById('select_zones').onchange = selectZone
    document.getElementById('select_sous-zones').onchange = selectSousZone
    document.getElementById('select_agences').onchange = selectAgence

    const liste_telec_item = document.querySelectorAll('div .telec_item')
    if(liste_telec_item && liste_telec_item.length > 0) {
        for(const telec_item of liste_telec_item) {
            telec_item.onclick = selectTelepro
        }
    }

    document.querySelectorAll('#div_deps button')
        .forEach(button => button.onclick = activeDep)

    document.getElementById('btnCancel').onclick = cancelDirective
    document.getElementById('btnValidate').onclick = validateDirective
}

function initInfos(target = undefined) {
    let item = undefined

    switch(target) {
        case 'zone':
            item = document.getElementById('infos_select_zone')
            break;
        case 'sous-zone':
            item = document.getElementById('infos_select_sous-zone')
            break;
        case 'agence':
            item = document.getElementById('infos_select_agence')
            break;
        case 'listeVendeurs':
            item = document.getElementById('infos_listeVendeurs')
            break;
        default:
            item = document.getElementById('div_infosDirectives')
            break;
    }

    item.classList.remove('info_message')
    item.classList.remove('error_message')
    item.style.display = 'none'
}
function fillInfos(infos, target = undefined) {
    initInfos(target)

    let item = undefined

    switch(target) {
        case 'zone':
            item = document.getElementById('infos_select_zone')
            break;
        case 'sous-zone':
            item = document.getElementById('infos_select_sous-zone')
            break;
        case 'agence':
            item = document.getElementById('infos_select_agence')
            break;
        case 'listeVendeurs':
            item = document.getElementById('infos_listeVendeurs')
            break;
        default:
            item = document.getElementById('div_infosDirectives')
            break;
    }

    if(infos) {
        if(infos.message) {
            item.innerText = infos.message
            item.classList.add('info_message')
        }
        else if(infos.error) {
            item.innerText = infos.error
            item.classList.add('error_message')
        }

        item.style.display = 'flex'
    }
}

async function selectTelepro({ target }) {
    // récupération de la div parent si c'est sur un enfant que le clic a lieu
    target = target.closest('div .telec_item')

    const selectedTelepro = document.querySelector('.telec_active')

    if(selectedTelepro) {
        selectedTelepro.classList.remove('telec_active')
        cancelDirective()
    }

    if(selectedTelepro !== target) {
        $('.loadingbackground').show()

        try {
            // rend disponible les inputs et buttons
            document.getElementById('checkCustomOrCampagne').disabled = false
            document.getElementById('select_campagnes').disabled = false
            document.getElementById('select_sources').disabled = false
            document.getElementById('select_types').disabled = false
            document.getElementById('select_zones').disabled = false
            document.getElementById('select_sous-zones').disabled = false
            document.getElementById('select_agences').disabled = false
            document.querySelectorAll('#div_deps button')
                .forEach(button => button.disabled = false)
            document.getElementById('btnCancel').disabled = false
            document.getElementById('btnValidate').disabled = false

            // active la div du télépro sélectionné
            target.classList.add('telec_active')

            const checkCustomOrCampagne = document.getElementById('checkCustomOrCampagne')
            const campagne = target.getAttribute('data-idCampagne')
            if(campagne) {
                if(checkCustomOrCampagne.checked) checkCustomOrCampagne.click()

                const option = document.querySelector(`#select_campagnes option[value=campagne_${campagne}]`)
                if(option) option.selected = true

                document.getElementById('select_campagnes').onchange()
            }
            else {
                if(!checkCustomOrCampagne.checked) checkCustomOrCampagne.click()

                const source = target.getAttribute('data-source')
                if(source && document.querySelector(`#select_sources option[value="${source}"]`)) {
                    document.querySelector(`#select_sources option[value="${source}"]`).selected = true
                }

                const type = target.getAttribute('data-typeFichier')
                if(type && document.querySelector(`#select_types option[value="${type}"]`)) {
                    document.querySelector(`#select_types option[value="${type}"]`).selected = true
                }

                const idZone = target.getAttribute('data-idZone')
                if(idZone && document.querySelector(`#select_zones option[value="zone_${idZone}"]`)) {
                    document.querySelector(`#select_zones option[value="zone_${idZone}"]`).selected = true
                    if(await selectZone()) return;

                    const idSousZone = target.getAttribute('data-idSousZone')
                    if(idSousZone && document.querySelector(`#select_sous-zones option[value="sous-zone_${idSousZone}"]`)) {
                        document.querySelector(`#select_sous-zones option[value="sous-zone_${idSousZone}"]`).selected = true
                        if(await selectSousZone()) return;

                        const idAgence = target.getAttribute('data-idAgence')
                        if(idAgence && document.querySelector(`#select_agences option[value="agence_${idAgence}"]`)) {
                            document.querySelector(`#select_agences option[value="agence_${idAgence}"]`).selected = true
                            if(await selectAgence()) return;

                            const listeIdsVendeurs = target.getAttribute('data-listeIdsVendeurs')
                            if(listeIdsVendeurs) {
                                listeIdsVendeurs.split(',').forEach(idVendeur => {
                                    const input = document.getElementById(`vendeur_${idVendeur}`)
                                    if(input) input.click()
                                })
                            }
                        }
                    }
                }
            }

            const deps = target.getAttribute('data-deps')
            if(deps) selectDepsFromListe(deps)
        }
        catch(e) {
            fillInfos({ error : e})
        }

        $('.loadingbackground').hide()
    }
}

function switchCustomOrCampagne() {
    document.getElementById('select_sources').options[0].selected = true
    document.getElementById('select_types').options[0].selected = true
    resetCampagne()
    initInfos('zone')
    resetListeVendeurs()
    emptySelect('select_agences')
    emptySelect('select_sous-zones')
    resetDeps()

    if(document.getElementById('checkCustomOrCampagne').checked) {
        document.getElementById('div_campagnes').style.display = 'none'
        document.getElementById('div_sources').style.display = 'block'
        document.getElementById('div_zones_sous-zones_agences_vendeurs').style.display = 'block'
    }
    else {
        document.getElementById('div_sources').style.display = 'none'
        document.getElementById('div_zones_sous-zones_agences_vendeurs').style.display = 'none'
        document.getElementById('div_campagnes').style.display = 'block'
    }
}

function selectCampagne() {
    const option = document.querySelector('#select_campagnes option[value^=campagne_]:checked')

    if(option) {
        const div_descriptionCampagne = document.getElementById('div_descriptionCampagne')
        const sourcesTypes = option.getAttribute('data-sourcesTypes')
        const statuts = option.getAttribute('data-statuts')
        const deps = option.getAttribute('data-deps')

        if(statuts) {
            div_descriptionCampagne.innerHTML += "<p>Statuts : "

            div_descriptionCampagne.innerHTML += "<ul>"
            statuts.split(',').forEach(statut => div_descriptionCampagne.innerHTML += `<li>${statut}</li>`)
            div_descriptionCampagne.innerHTML += "</ul>"          
            
            div_descriptionCampagne.innerHTML += "</p>"
        }

        if(sourcesTypes) {
            div_descriptionCampagne.innerHTML += "<p>Sources et types : "

            div_descriptionCampagne.innerHTML += "<ul>"
            sourcesTypes.split('/').forEach(sourceType => {
                const [source, type] = sourceType.split(',')

                if(source && type) {
                    div_descriptionCampagne.innerHTML += `<li>${source} : ${type}</li>`
                }
                else if(source) {
                    div_descriptionCampagne.innerHTML += `<li>${source}</li>`
                }
                else if(type) {
                    div_descriptionCampagne.innerHTML += `<li>${type}</li>`
                }
            })
            div_descriptionCampagne.innerHTML += "</ul>"

            div_descriptionCampagne.innerHTML += "</p>"
        }
        if(deps) {
            selectDepsFromListe(deps)
        }
    }
}

function resetCampagne() {
    document.getElementById('select_campagnes').options[0].selected = true
    document.getElementById('div_descriptionCampagne').innerHTML = ''
}

async function selectZone() {
    let isError = false

    try {
        $('.loadingbackground').show()  

        initInfos('zone')
        resetListeVendeurs()
        emptySelect('select_agences')
        emptySelect('select_sous-zones')

        if(document.querySelector('#select_zones :checked').value !== '') {          

            const select = document.getElementById('select_sous-zones')

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

                const opt = document.createElement("option")
                opt.value = ''
                opt.text = 'Toutes les sous-zones'
                select.append(opt)

                for(const sousZone of listeSousZones) {
                    const opt = document.createElement("option")
                    opt.value = `sous-zone_${sousZone.id}`
                    opt.text = `${sousZone.nom} (${sousZone.deps})`
                    opt.setAttribute('data-deps', sousZone.deps)

                    select.append(opt)
                }

                selectDepsFromListe(document.querySelector('#select_zones :checked').getAttribute('data-deps'))
            }
            else {
                throw generalError
            }
        }
        else {
            const deps = Array.from(document.querySelectorAll('#select_zones option[data-deps]')).map(option => option.getAttribute('data-deps')).toString()
            selectDepsFromListe(deps)
        }
    }
    catch(e) {
        isError = true
        fillInfos({ error : e, target : 'zone' })
    }
    finally {
        $('.loadingbackground').hide()
    }

    return isError
}

async function selectSousZone() {
    let isError = false

    try {
        $('.loadingbackground').show()

        initInfos('sous-zone')
        resetListeVendeurs()
        emptySelect('select_agences')

        if(document.querySelector('#select_sous-zones :checked').value !== '') {           
            const select = document.getElementById('select_agences')

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
                if(data.infoObject.message) throw data.infoObject.message
            }

            if(data.listeAgences) {
                const listeAgences = data.listeAgences

                const opt = document.createElement("option")
                opt.value = ''
                opt.text = 'Toutes les agences'
                select.append(opt)

                for(const agence of listeAgences) {
                    const opt = document.createElement("option")
                    opt.value = `agence_${agence.id}`
                    opt.text = `${agence.nom} (${agence.deps})`
                    opt.setAttribute('data-deps', agence.deps)

                    select.append(opt)
                }
            }

            selectDepsFromListe(document.querySelector('#select_sous-zones :checked').getAttribute('data-deps'))
        }
        else {
            const deps = Array.from(document.querySelectorAll('#select_sous-zones option[data-deps]')).map(option => option.getAttribute('data-deps')).toString()
            selectDepsFromListe(deps)
        }
    }
    catch(e) {
        isError = true
        fillInfos({ error : e, target : 'sous-zone' })
    }
    finally {
        $('.loadingbackground').hide()
    }

    return isError
}

async function selectAgence() {
    let isError = false

    const idAgence = (document.querySelector('#select_agences :checked').value).split('_')[1]

    try {
        $('.loadingbackground').show()

        initInfos('agence')
        resetListeVendeurs()

        if(document.querySelector('#select_agences :checked').value !== '') {            
            const div_listeVendeurs = document.getElementById('listeVendeurs')

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

            if(data.infoObject) {
                if(data.infoObject.error) throw data.infoObject.error
                if(data.infoObject.message) throw data.infoObject.message
            }

            if(data.listeVendeurs && data.listeVendeurs.length > 0) {
                const listeVendeurs = data.listeVendeurs
                div_listeVendeurs.innerHTML = ''

                for(const vendeur of listeVendeurs) {
                    div_listeVendeurs.innerHTML += `
                        <div class="vendeur">
                            <label for="vendeur_${vendeur.id}">
                                <input type="checkbox" id="vendeur_${vendeur.id}" data-deps="${vendeur.deps}" onclick="selectVendeur()">
                                ${vendeur.prenom} ${vendeur.nom} (${vendeur.deps})
                            </label>
                        </div>
                    `
                }
            }

            selectDepsFromListe(document.querySelector('#select_agences :checked').getAttribute('data-deps'))
        }
        else {
            const deps = Array.from(document.querySelectorAll('#select_agences option[data-deps]')).map(option => option.getAttribute('data-deps')).toString()
            selectDepsFromListe(deps)
        }
    }
    catch(e) {
        isError = true
        fillInfos({ error : e, target : 'agence' })
    }
    finally {
        $('.loadingbackground').hide()
    }

    return isError
}

async function selectVendeur() {
    const listeVendeurs = document.querySelectorAll('div.vendeur input:checked')
    let deps = ''

    if(listeVendeurs && listeVendeurs.length) {
        deps = Array.from(listeVendeurs).map(input => input.getAttribute('data-deps')).toString()        
    }
    else {
        deps = document.querySelector('#select_agences option:checked').getAttribute('data-deps')
    }

    selectDepsFromListe(deps)
}

function resetListeVendeurs() {
    document.getElementById('listeVendeurs').innerHTML = `
        <label id="infos_listeVendeurs" for="listeVendeurs" style="display: none;"></label>
        <p>Aucun vendeur disponible.</p>
    `
}

function activeDep({ target }) {
    if(target.classList.contains('dep_disabled')) return
    
    if(target.classList.contains('dep_active')) {
        target.classList.remove('dep_active')
    }
    else {
        target.classList.add('dep_active')
    }
}

function selectDepsFromListe(deps) {
    if(deps) {
        resetDeps()
        const liste = deps.split(',')

        for(const dep of liste) {
            const btn = document.querySelector(`.btnDep[data-value="${dep}"]`)
            if(btn && !btn.classList.contains('dep_active')) btn.classList.add('dep_active')
        }
    }
}

function resetDeps() {
    document.querySelectorAll('#div_deps button.dep_active')
    .forEach(button => button.classList.remove('dep_active'))
}

function cancelDirective() {
    const telec_active = document.querySelector('.telec_active')
    if(telec_active) telec_active.click()

    const checkCustomOrCampagne = document.getElementById('checkCustomOrCampagne')
    if(!checkCustomOrCampagne.checked) checkCustomOrCampagne.click()
    checkCustomOrCampagne.disabled = true

    const select_campagnes = document.getElementById('select_campagnes')
    select_campagnes.options[0].selected = true
    select_campagnes.disabled = true

    const select_sources = document.getElementById('select_sources')
    select_sources.options[0].selected = true
    select_sources.disabled = true

    const select_types = document.getElementById('select_types')
    select_types.options[0].selected = true
    select_types.disabled = true

    const select_zones = document.getElementById('select_zones')
    select_zones.options[0].selected = true
    select_zones.disabled = true

    emptySelect('select_sous-zones')
    document.getElementById('select_sous-zones').disabled = true

    emptySelect('select_agences')
    document.getElementById('select_agences').disabled = true

    document.getElementById('div_descriptionCampagne').innerHTML = ''
    resetListeVendeurs()
    resetDeps()

    document.querySelectorAll('#div_deps button')
        .forEach(button => button.disabled = true)

    document.getElementById('btnCancel').disabled = true
    document.getElementById('btnValidate').disabled = true
}

async function validateDirective() {
    const telec_active = document.querySelector('.telec_active')
    // vérifie qu'il y a bien un télépro de sélectionné et donc une directive
    if(telec_active) {
        $('.loadingbackground').show()

        try {
            const url = '/manager/update/directives'

            let params = {
                idTelepro : telec_active.getAttribute('id').split('_')[1],
                isCampagne : !document.getElementById('checkCustomOrCampagne').checked
            }

            if(document.getElementById('checkCustomOrCampagne').checked) {
                params = {      
                    ...params,              
                    source : document.querySelector('#select_sources option:checked').value ? document.querySelector('#select_sources option:checked').value : undefined,
                    type : document.querySelector('#select_types option:checked').value ? document.querySelector('#select_types option:checked').value : undefined,
                    zone : document.querySelector('#select_zones option:checked').value ? document.querySelector('#select_zones option:checked').value.split('_')[1] : undefined,
                    sousZone : document.querySelector('#select_sous-zones option:checked').value ? document.querySelector('#select_sous-zones option:checked').value.split('_')[1] : undefined,
                    agence : document.querySelector('#select_agences option:checked').value ? document.querySelector('#select_agences option:checked').value.split('_')[1] : undefined,
                    listeIdsVendeurs : document.querySelectorAll('.vendeur input:checked').length ? Array.from(document.querySelectorAll('.vendeur input:checked')).map(input => input.getAttribute('id').split('_')[1]).toString() : undefined
                }
            }
            else {
                const optionCampagne = document.querySelector('#select_campagnes option[value^=campagne_]:checked')
                if(!optionCampagne) throw "Une campagne doit être sélectionnée."

                params.campagne = optionCampagne.value.split('_')[1]
            }

            params.deps = document.querySelectorAll('#div_deps .btnDep.dep_active').length ? Array.from(document.querySelectorAll('#div_deps .btnDep.dep_active')).map(btn => btn.getAttribute('data-value')).toString() : undefined

            const option = {
                method : 'POST',
                headers : new Headers({
                    "Content-type" : "application/json"
                }),
                body : JSON.stringify(params)
            }

            const response = await fetch(url, option)
            if(!response.ok) throw generalError

            const { infos } = await response.json()

            if(infos) {
                if(infos.error) throw infos.error
                if(infos.message) {
                    fillInfos({ message : `${infos.message} La page va s'actualiser dans quelques instants.`})
                    setTimeout(() => {
                        location.reload()
                    }, 3000)
                }
            }
            else {
                throw generalError
            }
        }
        catch(e) {
            fillInfos({ error : e })
        }
        finally {
            $('.loadingbackground').hide()
        }
    }
}


window.addEventListener('load', async () => {
    initUI()
    $('.loadingbackground').hide()
})