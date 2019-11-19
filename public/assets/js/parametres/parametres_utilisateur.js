$(document).ready(() => {
    
    $('table tr').click((event) => {
        $.ajax({
            url: '/parametres/utilisateurs/get-client',
            method: 'POST',
            data: {
                id: $(event.currentTarget).attr('id')
            }
        }).done((data) => {
            $('#modal').html('');
            let modal = new EJS({ url: '/public/views/partials/modals/modal_utilisateur'}).render(data)
            $('#modal').append(modal).ready(() => {
                $('#modal').modal({
                    fadeDuration: 100
                }).ready(() => {
                    $('.save').click((event) => {
    
                        let user = {}
                        $("#modal :input:not([type=select])").each((index ,element) => {
                        if(element.checked || element.value != ''){
                            user[element.name] = element.checked ? "1" : element.value;
                        }
                        });

                        $("#modal select").each((index ,element) => {
                            user[element.name] = $(element).children("option").filter(":selected").val()
                        });

                        $.ajax({
                            url: '/parametres/utilisateurs/set-client',
                            method: 'POST',
                            data: user
                        }).done((data) => {
                            $('#'+data.user.id+' td:first').html(data.user.nom)
                            $('#'+data.user.id+' td:nth(1)').html(data.user.prenom)
                            $('#'+data.user.id+' td:nth(2)').html(data.user.Role.nom)
                            $('#'+data.user.id+' td:nth(3)').html(data.user.tel1)
                            $('#'+data.user.id+' td:nth(4)').html(data.user.tel2)
                            $('#'+data.user.id+' td:nth(5)').html(data.user.mail)

                            $.modal.close()
                        })
                    })
                })
            })
        })
    })
});