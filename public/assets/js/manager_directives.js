$(document).ready(() => {

    setClick()

    $('.btn_item').click((event) => {
        let data = {
            'deps': $('#deps').val(),
            'idUser': $('.telec_active').attr('id'),
            'sous_type': $("#sous_type option:selected").val(),
            'type_de_fichier': $("#type_de_fichier option:selected").val()
        }
        $.ajax({
            url: '/manager/update/directives',
            method: 'POST',
            data: data
         }).done((data) => {
            $('.select_telec').html('');
            if(data != 0){
                data.forEach(element => {
                    let user = new EJS({ url: '/public/views/partials/user_directive'}).render({user_directive: element});
                    $('.select_telec').append(user)
                });
            }
            setClick()
         });
        $('.telec_item').removeClass('telec_active')
        $('.directive_deps button').removeClass('dep_active')
        $('#deps').val('')
    });

    $('#deps').change(() => {
        syncdeps($('#deps').val().split(', '))
    });

    $('.directive_deps button').click( (event) => {

        if (!$(event.currentTarget).hasClass('dep_active')) {
            $(event.currentTarget).addClass('dep_active')
            if($('#deps').val().length != 0 ){
                $('#deps').val($('#deps').val()+', '+$(event.currentTarget).html())
            }else{
                $('#deps').val($(event.currentTarget).html())
            }
        } else {
            $(event.currentTarget).removeClass('dep_active')
            let deps = $('#deps').val().split(', ')
            deps.removeA($(event.currentTarget).html())
            $('#deps').val(deps.join(', '))
        }            
    });

});

function setClick(){
    $('.telec_item').click( (event) => {
        $('.telec_item').removeClass('telec_active')
        $(event.currentTarget).addClass('telec_active')

        $('#type_de_fichier option[value="'+$(event.currentTarget).children('.tel_item2').children('.type_de_fichier').html()+'"]').prop('selected', true);
        $('#sous_type option[value="'+$(event.currentTarget).children('.tel_item2').children('.sous_type').html()+'"]').prop('selected', true);
        
        $('#deps').val($(event.currentTarget).children('.tel_item1').children('.deps').html())
        syncdeps($('#deps').val().split(', '))
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