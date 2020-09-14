$(document).ready(() => {
 
    $('#modal_password').hide()

    $('.infos_moncompte :input').change(() => {
        let info = {}
        $('.infos_moncompte :input').each((index, element) => {
            if(element.checked || element.value != ''){
                info[element.name] = element.checked ? "1" : element.value
            }
        });
        $.ajax({
            url: '/parametres/mon_compte/update',
            method: 'POST',
            data: info
        }).done(event => {

        })
    });

    $('.validepass').click(() => {
        
        const regex = /^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])([^\s]){6,16}$/gm;
        let m;
        let erreur ;
        if((m = regex.exec($('#pass1').val())) !== null){
            if($('#pass1').val() === $('#pass2').val()){
                $.ajax({
                    url: '/parametres/mon_compte/update/password',
                    method: 'POST',
                    data: { password : $('#pass1').val()}
                }).done(event => {
                    $.modal.close()
                })
            }else{
                erreur = "Les deux mot de passe ne correspondent pas"
            }
        }else{
            erreur = "Votre mot de passe n'est pas conforme aux exigences";
        }

        $('.error').html(erreur)
    });

    $('.changerpassword').click( (element) => {
        
        $('#modal_password').modal({
            fadeDuration: 100
        })
        $('#modal_password').show()
    })
    
});