let tippyInstance = undefined

$( document).ready(() => {

    let calendarEl = document.getElementById('calendar')
    let calendar = new FullCalendar.Calendar(calendarEl, {
        plugins: [ 'dayGrid', 'timeGrid' ],
        locale: 'fr',
        timeFormat: 'H(:mm)',
        firstDay: 1 ,
        eventLimit: true,
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
                alert('there was an error while fetching events!');
              },
              color : '#f2b42c'
            },{
              url: '/teleconseiller/abs',
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
})