$(document).ready(() => {

    $('.btn_modifier_client').click((event) => {
        
            $('.ctn_infos_client input').prop('disabled', true);
            $('.ctn_infos_client select').prop('disabled', true);
            $('.ctn_infos_client textarea').prop('disabled', true);

            let client = {}
            $(".ctn_infos_client :input:not([type=select])").each((index ,element) => {
                if(element.checked || element.value != ''){
                    client[element.name] = element.checked ? "1" : element.value;
                }
            });

            $(".ctn_infos_client select").each((index ,element) => {
                client[element.name] = $(element).children("option").filter(":selected").val()
            });

            $.ajax({
                url: '/teleconseiller/update',
                method: 'POST',
                data: client
             }).done((data) => {
                window.location.assign('/teleconseiller/recherche/'+data.id)
             });
    });
    
});