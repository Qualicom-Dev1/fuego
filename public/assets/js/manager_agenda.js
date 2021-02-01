let calendar

let tippyInstance = undefined

function removeErrorMessage() {
    const div = document.getElementById('div_info')
    const p = div.getElementsByTagName('p')[0]

    p.innerText = ''
    p.classList.remove('error_message')
    p.classList.remove('info_message')

    div.style.display = 'none'
}

function setErrorMessage(message) {
    const div = document.getElementById('div_info')
    const p = div.getElementsByTagName('p')[0]

    p.innerText = message
    p.classList.add('error_message')

    div.style.display = 'block'
}

function setInformationMessage(message) {
    const div = document.getElementById('div_info')
    const p = div.getElementsByTagName('p')[0]

    p.innerText = message
    p.classList.add('info_message')

    div.style.display = 'block'
}

function setDatePicker() {
    $('.datetime').datepicker({
        dateFormat: "dd/mm/yy",
        firstDay: 1,
        minDate: "+1d",
        defaultDate: "+1d"
    });
}

function setDateTimePicker() {
    $('.datetime').datetimepicker({
        format:'d/m/Y H:i',
        minDate: new Date().setDate(new Date().getDate() + 1),
        defaultDate: new Date().setDate(new Date().getDate() + 1),
        allowTimes: [
            '7:00', '7:30','8:00', '8:30','9:00', '9:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'
        ]
    })
}

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
                url: '/teleconseiller/event',
                method: 'POST',
                failure: function() {
                alert('Impossible de récupérer les RDVs.');
                },
                color : '#f2b42c'
            },
            {
                url: '/teleconseiller/abs',
                method: 'POST',
                failure: function() {
                alert('Impossible de récupérer les absences.');
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

    setDateTimePicker()

    $('#addEvent').click(async event => {
        removeErrorMessage()

        try {
            const event = {
                idCommercial : document.querySelector('#idCommercial option:checked').value,
                motif : document.getElementById('motif').value,
                allDay : document.getElementById('allDay').checked,
                isRecurrence : document.getElementById('isRecurrence').checked,
                start : document.getElementById('start').value
            }

            if(!event.allDay || event.isRecurrence) event.end = document.getElementById('end').value
            if(event.isRecurrence) event.jourRecurrence = document.querySelector('#jourRecurrence option:checked').value

            const url = '/manager/agenda/ajoute-event'
            const option = {
                headers : new Headers({
                    "Content-type" : "application/json"
                }),
                method : 'POST',
                body : JSON.stringify(event)
            }
            
            const response = await fetch(url, option)
            if(!response.ok) throw generalError

            const { infos, events } = await response.json()
            if(infos.error) throw infos.error
            if(infos.message) setInformationMessage(infos.message)

            // remise à zéro des valeurs
            $('input[name=motif]').val('')
            $('input[name=start]').val('')
            $('input[name=end]').val('')
            if(event.allDay) $('input[name=allDay]').click()
            if(event.isRecurrence) $('input[name=isRecurrence]').click()

            actuEvent(events)
        }
        catch(e) {
            setErrorMessage(e)
        }
    })

    document.getElementById('isRecurrence').onclick = () => {
        if(document.getElementById('isRecurrence').checked) {
            document.getElementById('divJourRecurrence').style.display = 'flex'
        }else{
            document.getElementById('divJourRecurrence').style.display = 'none'
        }

        // si allDay est déjà coché, il faut ajouter ce qu'il faut pour avoir une date de début et de fin
        if(document.getElementById('allDay').checked) {
            div_dates.innerHTML = `
                <label for="start">Début : <input type="text" class="datetime" id="start" name="start"></label>                        
                <label for="end">Fin : <input type="text" class="datetime" id="end" name="end"></label>
            `
            setDatePicker()
        }
    }

    document.getElementById('allDay').onclick = () => {
        const div_dates = document.getElementById('div_dates')
        // on vide la div pour ajouter le bon contenu ensuite
        div_dates.innerHTML = ''    
        
        // s'il y a récurrence on a tout de même besoin d'une date de début et d'une date de fin
        // et si ce n'est pas toute la journée il faut remettre la date de début et la date de fin
        if(document.getElementById('isRecurrence').checked || !document.getElementById('allDay').checked) {
            div_dates.innerHTML = `
                <label for="start">Début : <input type="text" class="datetime" id="start" name="start"></label>                        
                <label for="end">Fin : <input type="text" class="datetime" id="end" name="end"></label>
            `
        }
        // s'il n'y a pas de récurrence, il y a seulement besoin de la date du jour
        else {
            div_dates.innerHTML = `
                <label for="start">Date : <input type="text" class="datetime" id="start" name="start"></label>                    
            `
        }

        if(document.getElementById('allDay').checked) {
            // si c'est toute la journée on souhaite un datePicker
            setDatePicker()
        }
        else {
            // si ce n'est pas toute la journée on souhaite un dateTimePicker
            setDateTimePicker()
        }
    }
})

function setDeleteBtnClick(){

    $('.supprimer_event').click( e => {
        $.ajax({
            url: '/manager/agenda/delete',
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
            '<td>'+(event.allDay ? event.start.split(' ')[0] : event.start) +'</td>'+
            '<td>'+(event.allDay ? event.end.split(' ')[0] : event.end) +'</td>'+
            '<td>' + (event.motif ? event.motif : 'Aucun') + '</td>'+
            '<td>'+(event.allDay ? 'OUI' : 'NON')+'</td>'+
            '<td><button class="btn supprimer_event" id="event_'+event.id+'">Supprimer</button></td>'+
        '</tr>')
    })
    calendar.refetchEvents()
    setDeleteBtnClick()
}