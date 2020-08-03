$(document).ready(() => {

    setClickEdit();

    $(".switch_client").click(() => {


        $.ajax({
            url: '/teleconseiller/prospection',
            method: 'POST',
            data: {
                currentClient: $('.infos_client').attr('id').split('_')[1],
            }
         }).done((data) => {

            let client = new EJS({ url: '/public/views/partials/traitementclient/info_client'}).render(data);
            let histo = new EJS({ url: '/public/views/partials/traitementclient/histo_client'}).render(data);

            $('.ctn_infos_client').html('');
            $('.ctn_table').html('');

            $('.ctn_infos_client').append(client);
            $('.ctn_table').append(histo);
            
            setClickEdit();

         });
    });
});


function setClickEdit(){
    $('.btn_modifier_client').click(async (event) => {
        // traitement de la div d'informations
        const divInfo = document.getElementById('div_info')
        const divInfo_p = divInfo.querySelector('p')
        divInfo.style.display = 'none'
        divInfo_p.innerHTML = ''
        divInfo_p.classList.remove('error_message')
        divInfo_p.classList.remove('info_message')  

        if($("#icon_modif").hasClass("fa-check")){                      

            let client = {}
            $(".ctn_infos_client :input:not([type=select])").each((index ,element) => {
                if(element.checked || element.value != ''){
                    client[element.name] = element.checked ? "1" : element.value;
                }
            });

            $(".ctn_infos_client select").each((index ,element) => {
                client[element.name] = $(element).children("option").filter(":selected").val()
            });

            client['id'] = $('.infos_client').attr('id').split('_')[1];

            const url = '/teleconseiller/update'
            const option = {
                method : 'POST',
                headers : new Headers({
                    "Content-type" : "application/json"
                }),
                body : JSON.stringify(client)
            }

            try {
                const response = await fetch(url, option)
                if(!response.ok) throw "Une erreur est survenue, veuillez recommencer plus tard."
    
                const data = await response.json()
    
                if(data.infoObject) {
                    if(data.infoObject.error) throw data.infoObject.error
                    if(data.infoObject.message) divInfo_p.innerHTML = data.infoObject.message
                } 

                divInfo_p.classList.add('info_message')

                // retour à l'affichage normal
                $("#icon_modif").removeClass("fa-check");
                $("#icon_modif").addClass("fa-pen");
                $('.ctn_infos_client input').prop('disabled', true);
                $('.ctn_infos_client select').prop('disabled', true);
                $('.ctn_infos_client textarea').prop('disabled', true);
            }
            catch(e) {
                divInfo_p.classList.add('error_message')
                divInfo_p.innerHTML = e
            }

            divInfo.style.display = 'block'

        }else{
            $("#icon_modif").removeClass("fa-pen");
            $("#icon_modif").addClass("fa-check");
            $('.ctn_infos_client input').prop('disabled', false);
            $('.ctn_infos_client select').prop('disabled', false);
            $('.ctn_infos_client textarea').prop('disabled', false);
        }        
    });
}