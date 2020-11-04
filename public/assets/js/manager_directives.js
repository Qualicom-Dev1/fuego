$(document).ready(() => {

    setClick()

    $('#type_de_fichier').change((event) => {
        let data = {
            type_de_fichier: $("#type_de_fichier option:selected").val()
        }
        $.ajax({
            url: '/manager/get-type',
            method: 'POST',
            data: data
         }).done((data) => {
            $("#sous_type").html('')
            $("#sous_type").append('<option value="" selected>Type de fichier</option>');
            data.forEach(element => {
                $("#sous_type").append('<option value="'+element.DISTINCT+'">'+element.DISTINCT+'</option>');
            })
         });
    })

    $('.btn_item').click((event) => {

        let idCampagnes = [];
        $('.campagnes_active').each( (index, element) =>  {
            idCampagnes.push($(element).attr('id'));
        });

        let data = {
            'deps': $('#deps').val(),
            'idUser': $('.telec_active').attr('id'),
            'sous_type': $("#sous_type option:selected").val(),
            'type_de_fichier': $("#type_de_fichier option:selected").val(),
            'campagnes': idCampagnes.length == 0 ? '' : idCampagnes
        }
        $.ajax({
            url: '/manager/update/directives',
            method: 'POST',
            data: data
         }).done((data) => {
            $('.select_telec').html('');
            if(data != 0){
                data.findedUsers.forEach(element => {
                    let user = new EJS({ url: '/public/views/partials/user_directive'}).render({user_directive: element, findedCampagnes: data.findedCampagnes, _:_});
                    $('.select_telec').append(user)
                        syncdepsDisabled(element.Structures[0].deps.split(','))
                    });
            }
            setClick()
         });
        $('.telec_item').removeClass('telec_active')
        $('.directive_deps button').removeClass('dep_active')
        $('.campagnes button').removeClass('campagnes_active')
        $('#deps').val('')
    });

    $('#deps').change(() => {
        syncdeps($('#deps').val().split(','))
    });

    $('.directive_deps button').click( (event) => {

        if (!$(event.currentTarget).hasClass('dep_active')) {
            $(event.currentTarget).addClass('dep_active')
            if($('#deps').val().length != 0 ){
                $('#deps').val($('#deps').val()+','+$(event.currentTarget).html())
            }else{
                $('#deps').val($(event.currentTarget).html())
            }
        } else {
            $(event.currentTarget).removeClass('dep_active')
            let deps = $('#deps').val().split(',')
            deps.removeA($(event.currentTarget).html())
            $('#deps').val(deps.join(','))
        }            
    });

    $('.campagnes button').click( (event) => {

        if (!$(event.currentTarget).hasClass('campagnes_active')) {
            
            $('#deps').val('')
            $('#type_de_fichier').prop("selectedIndex", 0)
            $('#sous_type').prop("selectedIndex", 0)
            $('.directive_deps button').removeClass('dep_active')
            
            $(event.currentTarget).addClass('campagnes_active')
        
            let deps = []
            
            $('.campagnes_active').each( (index, element) => {
                deps.push($(element).attr('data-deps').split(','))
            })
            syncdepsDisabled(_.uniq(_.flatten(deps)))

        } else {
                        
            $('#deps').val('')
            $('#type_de_fichier').prop("selectedIndex", 0)
            $('#sous_type').prop("selectedIndex", 0)
            $('.directive_deps button').removeClass('dep_active')
            
            $(event.currentTarget).removeClass('campagnes_active')

            let deps = []
            $('.campagnes_active').each( (index, element) => {
                deps.push($(element).attr('data-deps').split(','))
            })
            syncdepsDisabled(_.uniq(_.flatten(deps)))
        }            
    });

});

function setClick(){
    $('.telec_item').click( (event) => {
        $('.telec_item').removeClass('telec_active')
        $(event.currentTarget).addClass('telec_active')
        $('.campagnes button').removeClass('campagnes_active')

        $('#type_de_fichier option[value="'+$(event.currentTarget).children('.tel_item2').children('.type_de_fichier').html()+'"]').prop('selected', true);
        $('#sous_type option[value="'+$(event.currentTarget).children('.tel_item2').children('.sous_type').html()+'"]').prop('selected', true);

        $(event.currentTarget).children('.tel_item2').children('.campagnes_select').html().split(' / ').forEach((element) => {
            if(element != ''){
                $('.campagnes button:contains('+element+')').addClass('campagnes_active')
            }
        })



        let deps = []
        if($('.campagnes_active').length != 0){
            $('.campagnes_active').each( (index, element) => {
                deps.push($(element).attr('data-deps').split(','))
            })
        }else{
            deps = $(event.currentTarget).attr('data-deps').split(',')
        }
        syncdepsDisabled(_.uniq(_.flatten(deps)))

        $('#deps').val($(event.currentTarget).children('.tel_item1').children('.deps').html())
        syncdeps($('#deps').val().split(','))
    });    
}

function syncdeps(deps){
    $('.directive_deps button').removeClass('dep_active')
    if(deps.length != 1){
        deps.forEach((dep) =>{
            $('.directive_deps button:contains('+dep+')').addClass('dep_active')
        });
    }
}

function syncdepsDisabled(deps){
    $('.directive_deps button').attr('disabled', true)
    deps.forEach((dep) =>{
        $('.directive_deps button:contains('+dep+')').attr('disabled', false)
    });
}

Array.prototype.removeA = function() {
    let what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

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

async function selectAgence() {
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

async function selectVendeur() {

}