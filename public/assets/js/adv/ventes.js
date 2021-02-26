$( document).ready(() => {

    $('#rechercher_listerdv').keyup(function (e) {
        recherche($(e.currentTarget).val());
    });

    $('.selectdate_rdv :input').change(() => {
        actualiserRdv(); 
    });
    
    $('#vb_check').change(function(){
      	$('#vb').toggle();
    });
    
    $('#vp_check').change(function(){
      	$('#vp').toggle();
    });
    
    $('#vn_check').change(function(){
      	$('#vn').toggle();
    });
})

function recherche(entree) {
    maRegExp = new RegExp(entree, 'gi');
    divs = $('.ctn_rdv_auj');
    for (i = 0; i < divs.length; i++) {
        if (maRegExp.test($('#' + divs[i].id + ' p:first').html()) || maRegExp.test($('#' + divs[i].id + ' p:last').html()) || maRegExp.test($('#' + divs[i].id + ' p:nth-child(3)').html())) { // test de la regexp
            divs[i].style.display = "block";
        } else {
            divs[i].style.display = "none";
        }
    }
}

function actualiserRdv(){
    let date= {}
        $('.selectdate_rdv :input').each((index, element) => {
            if(element.value != ''){
                date[element.name] = element.value
            }
        });
        if("datedebut" in date){
            if(!("datefin" in date)){
                date['datefin'] = date['datedebut']
            }
            $.ajax({
                url: '/adv/ventes',
                method: 'POST',
                data: date
             }).done((data) => {
                $('.rdvs').html('');
                if(data != 0){
                    data.forEach(element => {
                        let rdv = new EJS({ url: '/public/views/partials/rdvs/bloc_rdv_jour'}).render({rdv: element});
                        $('.rdvs').append(rdv)
                        let option = new EJS({ url: '/public/views/partials/rdvs/option_bloc_rdv_liste'}).render({rdv: element});
                        $('.options_template:last').append(option)
                    });
                    reload_js('/public/assets/js/bloc_rdv.js');
                    setClick()
                }
             });
        }else{
            console.log('Vous devez absolument choisir une date de debut')
        }
}

function reload_js(src) {
    $('script[src="' + src + '"]').remove();
    $('<script>').attr('src', src).appendTo('head');
}

