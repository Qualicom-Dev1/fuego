$(document).ready(() => {

    setClick()

    $('.btn_item').hide()

    $('.btn_item').click((event) => {
        
        let deps = []
        
        $('.dep_active').each((index, element) => {
            deps.push($(element).html())
        })

        let data = {
            deps: deps.join(','),
            idStructure: $('.secteur_active').attr('id'),
        }
        $.ajax({
            url: '/parametres/update/secteurs_structures',
            method: 'POST',
            data: data
         }).done((data) => {
             console.log($('.secteur_active p:nth-child(2)').html())
             console.log(deps.join(','))
            $('.secteur_active p:nth-child(2)').html(deps.join(',')) 
            $('.secteur_active').removeClass('secteur_active')
            $('.secteur_deps button').removeClass('dep_active')
         });
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
        $('.btn_item').show()
        syncdeps($('.secteur_active p:nth-child(2)').html().split(','))
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