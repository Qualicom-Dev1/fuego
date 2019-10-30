$( document).ready(() => {

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
              textColor: 'black'
            },{
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
})