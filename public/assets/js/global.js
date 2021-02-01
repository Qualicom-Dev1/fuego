const generalError = "Une erreur s'est produite, veuillez vérifier votre connexion internet ou réessayer plus tard."

$( function() {
    $.datepicker.regional["fr"] = {
        closeText: "Fermer",
        currentText: "Aujourd'hui",
        dateFormat: "mm/dd/yy",
        dayNames: ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"],
        dayNamesMin: [ "Di", "Lu", "Ma", "Me", "Je", "Ve", "Sa" ],
        dayNamesShort: [ "Dim", "Lun", "Mar", "Mer", "Jeu", "Veb", "Sam" ],
        firstDay: 0,
        isRTL: false,
        monthNames: [ "Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre" ],
        monthNamesShort: ["Jan", "Fev", "Mar", "Avr", "Mai", "Ju", "Juil", "Aou", "Sep", "Oct", "Nov", "Dec"],
        nextText: "Suivant",
        prevText: "Précédent",
        showMonthAfterYear: false,
        weekHeader: "Sem",
        yearSuffix: ""
    }
    $.datepicker.setDefaults($.datepicker.regional[ "fr" ]);

    $(".datepicker").datepicker({
        dateFormat: "dd/mm/yy",
        firstDay: 1
    });

    $.datetimepicker.setLocale('fr')
    $('.datetimepicker').datetimepicker({
        format:'d/m/Y H:i',
        allowTimes: [
            '9:00', '9:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'
        ]
    });
});

function goBack() {
    window.history.go(-1);
}