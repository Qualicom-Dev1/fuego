$(document).ready(() => {
     
    $('.fa-times').hide()
    $('.fa-check').hide()

    $('.role_item').click( event => {

        $('.fa-times').show()
        $('.fa-check').show()

        $('.role_item').removeClass('active')
        $(event.currentTarget).addClass('active')
        
        $.ajax({
            url: '/parametres/telemarketing/get-dependence',
            method: 'POST',
            data: {
                id: $(event.currentTarget).attr('id').split('_')[1]
            }
        }).then(data => {
            $('.privilege_item').removeClass('active')
            console.log(data.findedDependences.Usersdependences)
            data.findedDependences.Usersdependences.forEach(element => {
                console.log(element)
                $('#idprivilege_'+element.idUserInf).addClass('active')
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
        let idPrivileges = [1000, 1001]
        $('.privilege_item.active').each((index, element) => {
            idPrivileges.push(element.id.split('_')[1])
        })
        let idRole = $('.role_item.active')[0].id.split('_')[1]

        let data = {
            privileges: idPrivileges,
            role: idRole
        }
        $.ajax({
            url: '/parametres/telemarketing/set-dependence',
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