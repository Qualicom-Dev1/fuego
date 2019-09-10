$(document).ready(() => {
    $('.selectdate_rdv :input').change(() => {

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
                url: '/manager/liste-rendez-vous',
                method: 'POST',
                data: date
             }).done((data) => {
                $('.rdvs').html('');
                console.log(data);
                if(data != 0){
                    data.forEach(element => {
                        let rdv = new EJS({ url: '/public/views/partials/bloc_rdv_jour'}).render({rdv: element});
                        $('.rdvs').append(rdv)
                        let option = new EJS({ url: '/public/views/partials/option_bloc_rdv_jour'}).render();
                        $('.options_template:last').append(option)
                    });
                }
             });
            console.log(date)
        }else{
            console.log('Vous devez absolument choisir une date de debut')
        }
    });
});
