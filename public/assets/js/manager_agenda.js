$( document).ready(() => {

    $('.rdate').hide()

    $('.datetime').datetimepicker({
        language: 'fr-FR',
        allowTimes: [
            '7:00', '7:30','8:00', '8:30','9:00', '9:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'
        ]
    });

    $('.datee').datepicker({
        locale:'fr'
    });

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

        console.log(eventt)

        $.ajax({
            url: '/manager/agenda/ajoute-event',
            method: 'POST',
            data: eventt
        }).done(data => {
            console.log(data)
        })
    })

    let calendarEl = document.getElementById('calendar')
    let calendar = new FullCalendar.Calendar(calendarEl, {
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
        eventSources: [
            {
              url: '/teleconseiller/event',
              method: 'POST',
              failure: function() {
                alert('there was an error while fetching events!');
              },
              color: 'yellow',
              textColor: 'black'
            },
            {
                url: '/teleconseiller/abs',
                method: 'POST',
                failure: function() {
                  alert('there was an error while fetching events!');
                },
                color: 'red',
                textColor: 'black'
              }
        ]
    })
    calendar.render()

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
                locale:'fr'
            });
            $('input[name=end]').datetimepicker({
                locale:'fr'
            });
        }else{
            $('.date').html('')
            $('.date').append('<label>Date :</label>'+
            '<input type="text" name="start">')

            $('input[name=start]').datepicker({
                locale:'fr'
            });
        }
    })
})