$(document).ready(() => {

    $.ajax({
        url : "/commerciaux/graphe",
        method: "POST"
    }).done(data => {
        
        let ctx = $("#graphe");
        let chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data[0],
                datasets: [{
                    label: "VENTE",
                    backgroundColor: 'rgb(243, 143, 104)',
                    borderColor: 'rgb(243, 143, 104)',
                    data: data[1],
                }]
            },
            options: {}
        });
    });

});