$(document).ready(() => {

    $('.btn_modifier_client').click(async (event) => {
        // traitement de la div d'informations
        const divInfo = document.getElementById('div_info')
        const divInfo_p = divInfo.querySelector('p')
        divInfo.style.display = 'none'
        divInfo_p.innerHTML = ''
        divInfo_p.classList.remove('error_message')
        
        // $('.ctn_infos_client input').prop('disabled', true);
        // $('.ctn_infos_client select').prop('disabled', true);
        // $('.ctn_infos_client textarea').prop('disabled', true);

        let client = {}
        $(".ctn_infos_client :input:not([type=select])").each((index ,element) => {
            if(element.checked || element.value != ''){
                client[element.name] = element.checked ? "1" : element.value;
            }
        });

        $("select").each((index ,element) => {
            client[element.name] = $(element).children("option").filter(":selected").val()
        });

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

            if(data.infoObject && data.infoObject.error) throw data.infoObject.error

            // le client est bien créé, redirection vers sa page
            window.location.assign(`/teleconseiller/recherche/${data.client.id}`)
        }
        catch(e) {
            divInfo_p.classList.add('error_message')
            divInfo_p.innerHTML = e
            divInfo.style.display = 'block'
        }
    });
    
});