$(document).ready(() => {
    getInfosGraphe()
}); 

async function getInfosGraphe() {
    try {
        const url = '/commerciaux/graphe'
        const option = {
            method : 'POST',
            headers : new Headers({
                "Content-type" : "application/json"
            })
        } 

        const response = await fetch(url, option)
        if(!response.ok) throw "Une erreur s'est produite, veuillez vérifier votre connexion internet ou recommencer plus tard."

        const { infos, infosGraphe } = await response.json()

        if(infos && infos.error) throw infos.error

        if(infosGraphe) {
            let ctx = $("#graphe")
            let chart = new Chart(ctx, {
                type: 'horizontalBar',
                data: {
                    labels: infosGraphe[0],
                    datasets: [{
                        label: "VENTE",
                        backgroundColor: 'rgb(243, 143, 104)',
                        borderColor: 'rgb(243, 143, 104)',
                        data: infosGraphe[1],
                    }]
                },
                options: {
                    scales: {
                        xAxes: [{
                            ticks: {
                                beginAtZero: true,
                                precision:0
                            }
                        }]
                    }
                }

            })
        }
    }
    catch(e) {
        console.error(e)
        alert("Impossible de charger le graphe des ventes.")
    }
}