$(document).ready(() => {

    setClickEdit();

    $(".switch_client").click(() => {

        $.ajax({
            url: '/teleconseiller/prospection',
            method: 'POST'
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
    $('.btn_modifier_client').click((event) => {
        if($("#icon_modif").hasClass("fa-check")){

            $("#icon_modif").removeClass("fa-check");
            $("#icon_modif").addClass("fa-pen");
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

            client['id'] = $('.infos_client').attr('id').split('_')[1];

            $.ajax({
                url: '/teleconseiller/update',
                method: 'POST',
                data: client
             }).done((data) => {
    
             });

        }else{
            $("#icon_modif").removeClass("fa-pen");
            $("#icon_modif").addClass("fa-check");
            $('.ctn_infos_client input').prop('disabled', false);
            $('.ctn_infos_client select').prop('disabled', false);
            $('.ctn_infos_client textarea').prop('disabled', false);
        }        
    });
}