$(document).ready(() => {

    $(".telec_boutons button").click((event) => {

        let urlTraitement = ''

        if($(event.currentTarget).attr('class').split('_')[0] != 'action'){
            urlTraitement = $(event.currentTarget).attr('class').split('_')[0]+'.ejs'
        }

        let phase2 = new EJS({ url: '/public/views/partials/traitement_phase2'}).render();
        let phase2_extend = new EJS({ url: '/public/views/partials/'+urlTraitement}).render();
            
        $('.phase2').html('');
        $('.phase2').append(phase2);
        $('.phase2_extend').append(phase2_extend);
        $('.traitementphase2').css('visibility', 'visible');

        $('.traitementphase2 .btn_item').click((event) => {
            $('.phase2_extend').html('');
            $('.traitementphase2').css('visibility', 'hidden');
        });
    });

});