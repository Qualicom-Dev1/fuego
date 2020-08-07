let calendar

let tippyInstance = undefined

$( document).ready(() => {

  setDeleteBtnClick()

    let calendarEl = document.getElementById('calendar')
    calendar = new FullCalendar.Calendar(calendarEl, {
        plugins: [ 'dayGrid', 'timeGrid' ],
        locale: 'fr',
        timeFormat: 'H(:mm)',
        firstDay: 1 ,
        defaultDate: new Date(),
        header: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },  
        buttonText: {
            today:    "Aujourd'hui",
            month:    'Mois',
            week:     'Semaine',
            day:      'Jour'
        },        
        eventLimit : 6,
        eventSources: [
            {
                url: '/directeur/event',
                method: 'POST',
                failure: function() {
                alert('there was an error while fetching events!');
                },
                color : '#f2b42c'
            },{
                url: '/directeur/abs',
                method: 'POST',
                failure: function() {
                alert('there was an error while fetching events!');
                },
                color: 'red',
                textColor: 'black'
            }
        ],
        eventRender : function(info) {
            try {                
                if(['BADGING', 'PARRAINAGE', 'PERSO'].includes(info.event.extendedProps.source)) {
                    const title = info.event.title
                    const prefix = info.event.extendedProps.source

                    info.el.querySelector('.fc-title').textContent = `${prefix} ${title}`
                }
                
                tippy(info.el, {
                    theme: 'light',
                    content : info.event.extendedProps.tooltip
                })
            }
            catch(e) {
                console.error(e)
            }
        },
        eventClick : function(info) {
            let same = false

            // retire l'instance en cours
            if(tippyInstance) {
                same = tippyInstance.reference == info.el

                tippyInstance.unmount()
                tippyInstance.destroy()

                document.querySelectorAll('div[id^=tippy]').forEach(elt => elt.parentNode.removeChild(elt))

                tippyInstance = undefined
            }
            
            // si click sur autre event, on affiche le tooltip
            if(!same) {
                tippyInstance = tippy(info.el, {
                    theme: 'light',
                    content : info.event.extendedProps.tooltip
                })
                tippyInstance.show()
            }
        }
    })
    calendar.render()

    $('.rdate').hide()

    $('.datetime').datetimepicker({
        language: 'fr-FR',
        language: 'fr-FR',
        dateFormat: "dd/mm/yy",
        dayNamesMin: ["Di", "Lu", "Ma", "Me", "Je", "Ve", "Sa"],
        dayNamesShort: [ "Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam" ],
        monthNames: [ "Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre" ],
        minDate: new Date().setDate(new Date().getDate() + 3),
        defaultDate: new Date().setDate(new Date().getDate() + 3),
        allowTimes: [
            '7:00', '7:30','8:00', '8:30','9:00', '9:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'
        ]
    })

    $('.datee').datepicker({
      minDate: new Date().setDate(new Date().getDate() + 3),
      defaultDate: new Date().setDate(new Date().getDate() + 3)
   })

    $('#addEvent').click(event => {

        let eventt = {}

        eventt['idCommercial'] = $('select[name=idCommercial] option:selected').val()
        eventt['motif'] = $('input[name=motif]').val()
        eventt['allDay'] = $('input[name=allDay]').is(':checked') == true ? 'true' : 'false'
        if($('input[name=allDay]').is(':checked')){
            eventt['start'] = $('input[name=start]').val() != "" ? $('input[name=start]').val() : null
            eventt['end'] = $('input[name=start]').val() != "" ? $('input[name=start]').val() : null
        }else{
            eventt['start'] = $('input[name=start]').val() != "" ? $('input[name=start]').val() : null
            eventt['end'] = $('input[name=end]').val() != "" ? $('input[name=end]').val() : $('input[name=start]').val()
        }
        if($('input[name=recurcivite]').is(':checked')){
            eventt['startrecu'] = $('input[name=recustart]').val()
            if($('input[name=recuend]').val() != ""){
                eventt['endrecu'] = $('input[name=recuend]').val()
            }
            eventt['daysOfWeek'] = $('select[name=recu] option:selected').val()
            if($('input[name=allDay]').is(':checked')){
                eventt['startTime'] = $('input[name=start]').val().split(' ')[1]
            }else{
                eventt['startTime'] = $('input[name=start]').val().split(' ')[1]
                eventt['endTime'] = $('input[name=end]').val().split(' ')[1]
            }
        }

        $.ajax({
            url: '/directeur/agenda/ajoute-event',
            method: 'POST',
            data: eventt
        }).done(data => {
            actuEvent(data.findedEvents)
        })
    })

    $('input[name=recurcivite]').change(event => {
        if($(event.currentTarget).is(':checked')){
            $('.rdate').show()
        }else{
            $('.rdate').hide()
        }

    })

    $('input[name=allDay]').change(event => {
        if(!$(event.currentTarget).is(':checked')){
            $('.date').html('')
            $('.date').append('<label>Début :</label>'+
            '<input type="text" name="start">'+
            '<label>Fin :</label>'+
            '<input type="text" name="end">')
            $('input[name=start]').datetimepicker({
              language: 'fr-FR',
              minDate: new Date().setDate(new Date().getDate() + 3),
              defaultDate: new Date().setDate(new Date().getDate() + 3),
              allowTimes: [
                  '7:00', '7:30','8:00', '8:30','9:00', '9:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'
              ]
            });
            $('input[name=end]').datetimepicker({
              language: 'fr-FR',
              minDate: new Date().setDate(new Date().getDate() + 3),
              defaultDate: new Date().setDate(new Date().getDate() + 3),
              allowTimes: [
                  '7:00', '7:30','8:00', '8:30','9:00', '9:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'
              ]
            });
        }else{
            $('.date').html('')
            $('.date').append('<label>Date :</label>'+
            '<input type="text" name="start">')
            	
            $.datepicker.setDefaults( $.datepicker.regional[ "fr" ] );
            $('input[name=start]').datepicker({
              dateFormat: "dd/mm/yy",
              dayNamesMin: [ "Di", "Lu", "Ma", "Me", "Je", "Ve", "Sa" ],
              monthNames: [ "Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre" ],
              minDate: "+3d",
              defaultDate: "+3d"
            });
        }
    })

})

function setDeleteBtnClick(){

    $('.supprimer_event').click( e => {
        $.ajax({
            url: '/directeur/agenda/delete',
            method: 'POST',
            data: {
                id: $(e.currentTarget).attr('id').split('_')[1]
            }
        }).done(data => { 
            actuEvent(data.findedEvents)
        })
    })
}

function actuEvent(findedEvents){
    $('#listeevent').html('')
    findedEvents.forEach((event) =>{
        $('#listeevent').append('<tr>'+
            '<td>'+event.User.nom+' '+event.User.prenom+'</td>'+
            '<td>'+(event.allDay == 'true' ? event.start.split(' ')[0] : event.start) +'</td>'+
            '<td>'+(event.allDay == 'true' ? event.end.split(' ')[0] : event.end) +'</td>'+
            '<td>' + (event.motif ? event.motif : 'Aucun') + '</td>'+
            '<td>'+(event.allDay == 'false' ? 'NON' : 'OUI')+'</td>'+
            '<td><button class="btn supprimer_event" id="event_'+event.id+'">Supprimer</button></td>'+
        '</tr>')
    })
    calendar.refetchEvents()
    setDeleteBtnClick()
}