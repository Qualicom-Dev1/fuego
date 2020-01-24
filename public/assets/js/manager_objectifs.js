let joursFériés = [
    [1,1], [1,5], [8,5], [14,7], [14,8], [1,11], [11,11], [25,12]
];

moment.locale('fr')

$(document).ready(() => {

    let days = get4JourOuvrable()

    let RDVByDay = []

    $('.day').each((index , element) => {
        $(element).parent().attr('id', days[index].format('DD-MM-YYYY'))
        $(element).html(days[index].format('dddd')+' '+days[index].format('DD')+' '+days[index].format('MMMM')+' '+days[index].format('YYYY'))
        RDVByDay[days[index].format('DD-MM-YYYY')] = 0
    })
    
    $.ajax({
        url: '/manager/objectifs/rdv',
        method: 'POST',
        data: {
            datestart: days[0].format('YYYY-MM-DD'),
            dateend: days[3].add(1, 'days').format('YYYY-MM-DD')
        }
    }).done(data => {

        days[3].add(-1, 'days').format('YYYY-MM-DD')

        data.findedRdvs.forEach(element => {
            let format = "DD/MM/YYYY h:mm:ss"
            let time = moment(element.date, format)
            let smatin = moment(moment(element.date, format).format("DD/MM/YYYY")+' 06:00', format)
            let ematin = moment(moment(element.date, format).format("DD/MM/YYYY")+' 13:58', format)

            let sam = moment(moment(element.date, format).format("DD/MM/YYYY")+' 13:50', format)
            let eam = moment(moment(element.date, format).format("DD/MM/YYYY")+' 16:58', format)

            let ssoir = moment(moment(element.date, format).format("DD/MM/YYYY")+' 16:59', format)
            let esoir = moment(moment(element.date, format).format("DD/MM/YYYY")+' 23:00', format)
        
            let obj = $('#'+time.format('DD-MM-YYYY')+' #com_'+element.idVendeur+' .t').html()
            $('#'+time.format('DD-MM-YYYY')+' #com_'+element.idVendeur+' .t').html(obj-1)

            if(time.isBetween(smatin, ematin)){
                $('#'+time.format('DD-MM-YYYY')+' #com_'+element.idVendeur+' .m').html(element.Client.dep+' '+moment(element.date, format).format('H:mm'))
            }
            if(time.isBetween(sam, eam)){
                $('#'+time.format('DD-MM-YYYY')+' #com_'+element.idVendeur+' .am').html(element.Client.dep+' '+moment(element.date, format).format('H:mm'))
            }
            if(time.isBetween(ssoir, esoir)){
                $('#'+time.format('DD-MM-YYYY')+' #com_'+element.idVendeur+' .s').html(element.Client.dep+' '+moment(element.date, format).format('H:mm'))
            }

            RDVByDay[time.format('DD-MM-YYYY')] += 1
            
        })

    })

    days.forEach(element => {
        $.ajax({
            url: '/manager/objectifs/abs',
            method: 'POST',
            data: {
                date: element.format('YYYY-MM-DD')
            }
        }).done(data => {
            data.findedAbs.forEach(element2 => {
                let CrenoAbs = 0;

                let format = "DD/MM/YYYY HH:mm"
                let timeStart = moment(element2.start).format(format)
                let timeEnd = moment(element2.end).format(format)
    
                let RmatinStart = moment(element.format('DD/MM/YYYY')+' 00:00', "DD/MM/YYYY HH:mm")
                let RmatinEnd = moment(element.format('DD/MM/YYYY')+' 13:58', "DD/MM/YYYY HH:mm")

                let RAMStart = moment(element.format('DD/MM/YYYY')+' 13:59', "DD/MM/YYYY HH:mm")
                let RAMEnd = moment(element.format('DD/MM/YYYY')+' 16:58', "DD/MM/YYYY HH:mm")

                let RSoirStart = moment(element.format('DD/MM/YYYY')+' 16:59', "DD/MM/YYYY HH:mm")
                let RSoirEnd = moment(element.format('DD/MM/YYYY')+' 23:59', "DD/MM/YYYY HH:mm")

                if(element2.allDay == 'true'){
                    $('#'+moment(timeStart, format).format('DD-MM-YYYY')+' #com_'+element2.idCommercial+' .m').css('background-color', 'red')
                    $('#'+moment(timeStart, format).format('DD-MM-YYYY')+' #com_'+element2.idCommercial+' .m').html(element2.motif)
                    $('#'+moment(timeStart, format).format('DD-MM-YYYY')+' #com_'+element2.idCommercial+' .am').css('background-color', 'red')
                    $('#'+moment(timeStart, format).format('DD-MM-YYYY')+' #com_'+element2.idCommercial+' .am').html(element2.motif)
                    $('#'+moment(timeStart, format).format('DD-MM-YYYY')+' #com_'+element2.idCommercial+' .s').css('background-color', 'red')
                    $('#'+moment(timeStart, format).format('DD-MM-YYYY')+' #com_'+element2.idCommercial+' .s').html(element2.motif)

                    $('#'+moment(timeStart, format).format('DD-MM-YYYY')+' #com_'+element2.idCommercial+' .t').html('0')
                }else{
                    if(heureIn(moment(timeStart, format), moment(timeEnd, format), RmatinStart, RmatinEnd) != 0){
                        $('#'+element.format('DD-MM-YYYY')+' #com_'+element2.idCommercial+' .m').css('background-color', 'red')
                        $('#'+element.format('DD-MM-YYYY')+' #com_'+element2.idCommercial+' .m').html(element2.motif)
                        CrenoAbs++;
                    }
                    if(heureIn(moment(timeStart, format), moment(timeEnd, format), RAMStart, RAMEnd) != 0){
                        $('#'+element.format('DD-MM-YYYY')+' #com_'+element2.idCommercial+' .am').css('background-color', 'red')
                        $('#'+element.format('DD-MM-YYYY')+' #com_'+element2.idCommercial+' .am').html(element2.motif)
                        CrenoAbs++;
                    }
                    if(heureIn(moment(timeStart, format), moment(timeEnd, format), RSoirStart, RSoirEnd) != 0){
                        $('#'+element.format('DD-MM-YYYY')+' #com_'+element2.idCommercial+' .s').css('background-color', 'red')
                        $('#'+element.format('DD-MM-YYYY')+' #com_'+element2.idCommercial+' .s').html(element2.motif)
                        CrenoAbs++;
                    }
                    if(!((3-CrenoAbs) >= $('#'+element.format('DD-MM-YYYY')+' #com_'+element2.idCommercial+' .t').html())){
                        let obj = parseInt($('#'+element.format('DD-MM-YYYY')+' #com_'+element2.idCommercial+' .t').html())
                        let CD = (3-CrenoAbs) - $('#'+element.format('DD-MM-YYYY')+' #com_'+element2.idCommercial+' .t').html()
                        $('#'+element.format('DD-MM-YYYY')+' #com_'+element2.idCommercial+' .t').html(obj + CD)
                    }
                }

            })
            $('.day').each((index , element) => {
                let total = 0
                console.log(days[index].format('DD-MM-YYYY'))
                $('#'+days[index].format('DD-MM-YYYY')+' .t').each((index , element2) => {
                    total += parseInt($(element2).html())
                })
                $('#'+days[index].format('DD-MM-YYYY')+' .rdvPris').html('RDV PRIS : '+RDVByDay[days[index].format('DD-MM-YYYY')]+'/'+(parseInt(total)+parseInt(RDVByDay[days[index].format('DD-MM-YYYY')])))
                $('#'+days[index].format('DD-MM-YYYY')+' .totalr').html(total)
            })
        })
    })

});

function get4JourOuvrable (d) {
    let days = []
    let e = 0
    if (!d) d = moment()
    while ( e < 4 ) {
        d.add(1, 'days')
        let x = d.format('e')
        if (!(estFerie(d)) && x != 5 && x != 6){
                days.push(moment(d))
                e++;
        } 
    }
    return days
}

function estFerie(d){
    let j = d.format('D')
    let m = d.format('M')
    for (let i=0; i < joursFériés.length; i++) {
        if (j==joursFériés[i][0] && m == joursFériés[i][1]){
            return true
        }
    }
    return false
}

function heureIn(dates, datee, datesr, dateer){
    if(datesr.isBetween(dates, datee) && dateer.isBetween(dates, datee)){
        return datesr.diff(dateer, 'hours')
    }else if(dates.isBetween(datesr, dateer) && datee.isBetween(datesr, dateer)){
        return dates.diff(datee, 'hours')
    }else if(datesr.isBetween(dates, datee)){
        return datesr.diff(datee, 'hours')
    }else if(dateer.isBetween(dates, datee)){
        return dateer.diff(datee, 'hours')
    }else{
        return 0
    }
}