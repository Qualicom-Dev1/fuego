$(document).ready(() => {

    setClick()

    $('.btn_item').click((event) => {

        let deps = []
        $('.dep_active').each((index, element) => {
            deps.push(element.innerHTML)
        })

        let data = {
            'deps': deps,
            'idSecteur': $('.secteur_active').attr('id'),
            'backgroundColor': $("#sous_type option:selected").val()
        }
        $.ajax({
            url: '/parametres/secteurs/update',
            method: 'POST',
            data: data
         }).done((data) => {
            $('.select_telec').html('');
            /*if(data != 0){
                data.forEach(element => {
                    let user = new EJS({ url: '/public/views/partials/user_directive'}).render({user_directive: element});
                    $('.select_telec').append(user)
                });
            }
            setClick()*/
         });
        $('.secteurs_liste').removeClass('secteur_active')
        $('.secteur_deps button').removeClass('dep_active')
        $('#nomsecteur').val()
        $('#couleur').val()
    });

    $('.secteur_deps button').click( (event) => {

        if (!$(event.currentTarget).hasClass('dep_active')) {
            $(event.currentTarget).addClass('dep_active')
        } else {
            $(event.currentTarget).removeClass('dep_active')
        }            
    });

});

function setClick(){
    $('.secteur_item').click( (event) => {
        $('.secteur_item').removeClass('secteur_active')
        $(event.currentTarget).addClass('secteur_active')
        $('#nomsecteur').val($($(event.currentTarget).children('p')[0]).html())
        $('#couleur').val(($($(event.currentTarget).children('.backgroundColor')).val()))
        syncdeps($($(event.currentTarget).children('p')[1]).html().split('\n').join('').split(' ').join('').split(',').slice(0, -1))
    });    
}

function syncdeps(deps){
    $('.secteur_deps button').removeClass('dep_active')
    if(deps.length != 1){
        deps.forEach((dep) =>{
            $('.secteur_deps button:contains('+dep+')').addClass('dep_active')
        });
    }
}