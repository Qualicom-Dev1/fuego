$(document).ready(() => {

    setClickEdit();

    $(".switch_client").click(() => {

        $.ajax({
            url: '/telec/prospection',
            method: 'POST'
         }).done((data) => {

            let client = new EJS({ url: '/public/views/partials/info_client'}).render(data);
            let histo = new EJS({ url: '/public/views/partials/histo_client'}).render(data);

            $('.ctn_infos_client').html('');
            $('.ctn_historique').html('');

            $('.ctn_infos_client').append(client);
            $('.ctn_historique').append(histo);
            
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

            console.log($(".ctn_infos_client :input"))

            let client = {}
            $(".ctn_infos_client :input:not(select)").each((index ,element) => {
                if(element.checked || element.value != ''){
                    client[element.name] = element.checked ? "1" : element.value;
                }
            });

            client['id'] = $('.infos_client').attr('id').split('_')[1];

            $.ajax({
                url: '/telec/update',
                method: 'POST',
                data: client
             }).done((data) => {
    
                console.log(data);
    
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