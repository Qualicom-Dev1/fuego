$( function() {
    $( ".datepicker" ).datepicker({
        dateFormat: "dd/mm/yy",
        dayNamesMin: [ "Di", "Lu", "Ma", "Me", "Je", "Ve", "Sa" ],
        monthNames: [ "Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre" ],
        firstDay: 1
    });
});