$(document).ready(() => {
     
    $('.role_item').click( event => {
        
        $.ajax({
            url: '/parametres/privileges/get-privileges-role',
            method: 'POST',
            data: {
                id: $(event.currentTarget).attr('id').split('_')[1]
            }
        }).then(data => {
            $('.privilege_item').removeClass('active')
            data.findedPrivileges.forEach(element => {
                console.log(element)
                $('#idprivilege_'+element.id).addClass('active')
            });
        });

    });

    $('.privilege_item').click((element) => {
        if($(element.currentTarget).hasClass('active')){
            $(element.currentTarget).removeClass('active')
        }else{
            $(element.currentTarget).addClass('active')
        }
    })

});