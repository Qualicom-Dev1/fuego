$(document).ready(() => {
    
    $('.ajouter_user').click(() => {
        $.ajax({
            url: '/parametres/utilisateurs/get-client',
            method: 'POST',
            data: {
                id: 0
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
                        })

                        $("#modal select:not([class=idStructures])").each((index ,element) => {
                            user[element.name] = $(element).children("option").filter(":selected").val()
                        })

                        user['UserStructures'] = []

                        $('.idStructures').each((index ,element) => {
                            if($(element).children("option").filter(":selected").val() != ""){
                                user['UserStructures'].push({idStructure: $(element).children("option").filter(":selected").val(), idUser: user.id})
                            }
                        })

                        $.ajax({
                            url: '/parametres/utilisateurs/set-client',
                            method: 'POST',
                            data: user
                        }).done((data) => {
                            console.log(data)
                            $('.users').append('<tr id="'+data.user.id+'">'+
                            '<td>'+data.user.nom+'</td>'+
                            '<td>'+data.user.prenom+'</td>'+
                            '<td>'+(data.user.Structures.length != 0 ? _.map(data.user.Structures,'nom').join(',') : '' )+'</td>'+
                            '<td>'+data.user.Role.nom+'</td>'+
                            '<td>'+data.user.tel1+'</td>'+
                            '<td>'+data.user.tel2+'</td>'+
                            '<td>'+data.user.mail+'</td>'+
                        '</tr>')

                            $.modal.close()
                        })
                    })
                })
            })
        })
    })

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
                        })

                        $("#modal select:not([class=idStructures])").each((index ,element) => {
                            user[element.name] = $(element).children("option").filter(":selected").val()
                        })

                        user['UserStructures'] = []

                        $('.idStructures').each((index ,element) => {
                            if($(element).children("option").filter(":selected").val() != ""){
                                user['UserStructures'].push({idStructure: $(element).children("option").filter(":selected").val(), idUser: user.id})
                            }
                        })

                        $.ajax({
                            url: '/parametres/utilisateurs/set-client',
                            method: 'POST',
                            data: user
                        }).done((data) => {
                            
                            $('#'+data.user.id+' td:first').html(data.user.nom)
                            $('#'+data.user.id+' td:nth(1)').html(data.user.prenom)
                            $('#'+data.user.id+' td:nth(2)').html(_.map(data.user.Structures,'nom').join(','))
                            $('#'+data.user.id+' td:nth(3)').html(data.user.Role.nom)
                            $('#'+data.user.id+' td:nth(4)').html(data.user.tel1)
                            $('#'+data.user.id+' td:nth(5)').html(data.user.tel2)
                            $('#'+data.user.id+' td:nth(6)').html(data.user.mail)

                            $.modal.close()
                        })
                    })
                })
            })
        })
    })
});