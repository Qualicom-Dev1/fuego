$(document).ready(() => {

    document.querySelectorAll('.btnAgence').forEach(btn => btn.onclick = filterByAgency)
     
    $('.fa-times').hide()
    $('.fa-check').hide()

    $('.role_item').click( event => {

        $('.fa-times').show()
        $('.fa-check').show()

        $('.role_item').removeClass('active')
        $(event.currentTarget).addClass('active')
        
        $.ajax({
            url: '/parametres/commerciaux/get-dependence',
            method: 'POST',
            data: {
                id: $(event.currentTarget).attr('id').split('_')[1]
            }
        }).then(data => {
            $('.privilege_item').removeClass('active')
            
            data.findedDependences.Usersdependences.forEach(element => {
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
        // let idPrivileges = [1000, 1001]
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
            url: '/parametres/commerciaux/set-dependence',
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

function filterByAgency({ target }) {
    // retrait et ajout des classes aux boutons
    document.querySelector('.btnAgence.active').classList.remove('active')
    target.classList.add('active')

    // affiche les éléments cachés
    document.querySelectorAll('li.hidden[data-agences]').forEach(li => li.classList.remove('hidden'))

    const agence = target.getAttribute('data-for')
    // si une agence est sélectionnée, n'afficher que les éléments de celle-ci
    if(agence) {
        document.querySelectorAll('li[data-agences]').forEach(li => {
            // si l'élément ne contient pas le nom de l'agence on le cache
            if(li.getAttribute('data-agences').indexOf(agence) < 0) {
                li.classList.add('hidden')
            }
        })
    }
}