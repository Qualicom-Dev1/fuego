$(document).ready(() => {

    $(".telec_boutons button").click((event) => {

        let phase2 = new EJS({ url: '/public/views/partials/traitementclient/traitement_phase2'}).render();
            
        $('.phase2').html('');
        $('.phase2').append(phase2);
        $('.traitementphase2').css('visibility', 'visible');

        if($(event.currentTarget).attr('id').split('_')[0] != 'action'){
            let urlTraitement = $(event.currentTarget).attr('id').split('_')[0]+'.ejs'
            let phase2_extend = new EJS({ url: '/public/views/partials/traitementclient/'+urlTraitement}).render();
            $('.phase2_extend').append(phase2_extend);
        }

        $('.traitementphase2 .close').click((close) => {
            $('.phase2_extend').html('');
            $('.traitementphase2').html('');
            $('.traitementphase2').css('visibility', 'hidden');
        });

        $('.traitementphase2 .btn_traitement').click((btn_traitement) => {
            if($(btn_traitement.currentTarget).hasClass('traitementactive')){
                $('.traitementphase2 .btn_traitement').removeClass('traitementactive');
            }else{
                $('.traitementphase2 .btn_traitement').removeClass('traitementactive');
                $(btn_traitement.currentTarget).addClass('traitementactive');
            }

            console.log($('.traitementactive'));
        });


        let data = {}
        $('.traitementphase2 .save').click((save) => {
            
            let histo = {}
            $('.traitementphase2 :input').each((index, element) => {
                if(element.checked || element.value != ''){
                    if(element.name == 'dateevent'){
                        histo['date'] = element.value;
                    }
                    histo[element.name] = element.checked ? "1" : element.value
                }
            });

            histo['idAction'] = $(event.currentTarget).attr('id').split('_')[1];
            histo['idClient'] = $('.infos_client').attr('id').split('_')[1];
            if($(event.currentTarget).attr('id').split('_')[0] == 'horscriteres'){
                histo['sousstatut'] = $('.traitementactive').html()
            }

            $.ajax({
                url: '/telec/cree/historique',
                method: 'POST',
                data: histo
             }).done((data) => {

                let histo = new EJS({ url: '/public/views/partials/traitementclient/histo_client'}).render(data);

                $('.ctn_table').html('');

                $('.ctn_table').append(histo);

                $('.phase2_extend').html('');
                $('.traitementphase2').html('');
                $('.traitementphase2').css('visibility', 'hidden');
             });
        });
    });

});