let current_call = 0;

$(document).ready(() => {

setCallandHang()

$(".switch_client").click(() => {
    current_call = 0
})

$(".telec_boutons button").click((event) => {

    if(!$(event.currentTarget).hasClass('hangup') && !$(event.currentTarget).hasClass('appel')){

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

            addAction(histo)

        });
    }
});

});

function addAction(histo) {
    $.ajax({
        url: '/teleconseiller/cree/historique',
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
}

function setCallandHang(){
    $('.appel').click(element => {

        if(current_call != 1){
            let histo = {
                idAction: 2,
                idClient : $('.infos_client').attr('id').split('_')[1]
            }
            addAction(histo)
            current_call = 1;
        }

    });
    $('.hangup').click(function(){
        //Set Hangup Script
    });
}