


$( document ).ready(function() {

    $('.options_rdv_ctn').click((event) => {


        if (!$(event.currentTarget).children('.btn_caches').hasClass('btn_nocaches')) {
            $(event.currentTarget).children('.btn_caches').addClass('btn_nocaches');
        } else {
            setTimeout(function() {
                $(event.currentTarget).children('.btn_caches').removeClass('btn_nocaches');}, 400);
        }
        $($(event.currentTarget).children('.open')[0]).children('.fa-plus').toggleClass('rotatecross');


        $($(event.currentTarget).children('.btn_caches')[0]).children('.un').toggleClass('rdv_btn_anim1');
        $($(event.currentTarget).children('.btn_caches')[0]).children('.deux').toggleClass('rdv_btn_anim2');
        $($(event.currentTarget).children('.btn_caches')[0]).children('.trois').toggleClass('rdv_btn_anim3');


        $($(event.currentTarget).children('.btn_caches')[0]).children('.un').toggleClass('rdv_btn_anim1_retour');
        $($(event.currentTarget).children('.btn_caches')[0]).children('.deux').toggleClass('rdv_btn_anim2_retour');
        $($(event.currentTarget).children('.btn_caches')[0]).children('.trois').toggleClass('rdv_btn_anim3_retour');



    });
    
    
});