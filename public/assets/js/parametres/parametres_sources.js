$(document).ready(() => {
    $('.source').click((event) => {
        $('.addsourceinput').css('visibility', 'visible')
    })

    $('.type').click((event) => {
        $('.addtypeinput').css('visibility', 'visible')
    })

    $('.addsourcebtn').click(() => {
        $.ajax({
            url: '/parametres/sources/ajouter',
            method: 'POST',
            data: {
                type: 'source',
                nom: $('#source').val()
            }
        }).done((data) => {
            $('.addsourceinput').css('visibility', 'hidden')
            $('.sources_liste').append('<li class="source_item">'+
            '<p>'+$('#source').val()+'</p>'+
            '</li>')
        })
    })

    $('.addtypebtn').click(() => {
        $.ajax({
            url: '/parametres/sources/ajouter',
            method: 'POST',
            data: {
                type: 'type',
                nom: $('#type').val()
            }
        }).done((data) => {
            $('.addtypeinput').css('visibility', 'hidden')
            $('.types_liste').append('<li class="type_item">'+
            '<p>'+$('#type').val()+'</p>'+
            '</li>')
        })
    })
})
