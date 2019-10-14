$(document).ready(() => {
     
    $('.fa-times').hide()
    $('.fa-check').hide()

    $('.role_item').click( event => {

        $('.fa-times').show()
        $('.fa-check').show()

        $('.role_item').removeClass('active')
        $(event.currentTarget).addClass('active')
        
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


    $('.fa-times').click( () => {
        $('.privilege_item').removeClass('active')
        $('.role_item').removeClass('active')
    })

    $('.fa-check').click( () => {
        let idPrivileges = []
        $('.privilege_item.active').each((index, element) => {
            idPrivileges.push(element.id.split('_')[1])
        })
        let idRole = $('.role_item.active')[0].id.split('_')[1]

        let data = {
            privileges: idPrivileges,
            role: idRole
        }
        $.ajax({
            url: '/parametres/privileges/set-privileges-role',
            method: 'POST',
            data: data
        }).then(data => {
            $('.privilege_item').removeClass('active')
            $('.role_item').removeClass('active')
            $('.fa-times').hide()
            $('.fa-check').hide()
        });


    })
});