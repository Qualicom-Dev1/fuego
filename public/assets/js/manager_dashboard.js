$( document ).ready(function() {

    $.ajax({
        url: '/manager/statistiques',
        method: 'POST'
    }).done( data => {

        let resultatMois = []
   
        data.findedStatsMois.forEach((element, index) => {
            if(typeof resultatMois[element.nomm] == 'undefined'){
                resultatMois[element.nomm] = []
                if(typeof resultatMois[element.nomm][element.nom] == 'undefined'){
                    resultatMois[element.nomm][element.nom] = []
                    resultatMois[element.nomm][element.nom]['total'] = 0 
                    if(element.etat === null){ 
                        resultatMois[element.nomm][element.nom]['total'] += element.count  
                    }else{
                        resultatMois[element.nomm][element.nom][element.etat] = []
                        resultatMois[element.nomm][element.nom][element.etat] = element.count
                        resultatMois[element.nomm][element.nom]['total'] += element.count
                    }
                }else{
                    if(element.etat === null){ 
                        resultatMois[element.nomm][element.nom]['total'] += element.count  
                    }else{
                        resultatMois[element.nomm][element.nom][element.etat] = []
                        resultatMois[element.nomm][element.nom][element.etat] = element.count
                        resultatMois[element.nomm][element.nom]['total'] += element.count
                    }
                }
            }else{
                if(typeof resultatMois[element.nomm][element.nom] == 'undefined'){
                    resultatMois[element.nomm][element.nom] = []
                    resultatMois[element.nomm][element.nom]['total'] = 0 
                    if(element.etat === null){ 
                        resultatMois[element.nomm][element.nom]['total'] += element.count  
                    }else{
                        resultatMois[element.nomm][element.nom][element.etat] = []
                        resultatMois[element.nomm][element.nom][element.etat] = element.count
                        resultatMois[element.nomm][element.nom]['total'] += element.count
                    }
                }else{
                    if(element.etat === null){ 
                        resultatMois[element.nomm][element.nom]['total'] += element.count  
                    }else{
                        resultatMois[element.nomm][element.nom][element.etat] = []
                        resultatMois[element.nomm][element.nom][element.etat] = element.count
                        resultatMois[element.nomm][element.nom]['total'] += element.count
                    }
                }
            }
        })

        let resultatSemaine = []
   
        data.findedStatsSemaine.forEach((element, index) => {
            if(typeof resultatSemaine[element.nomm] == 'undefined'){
                resultatSemaine[element.nomm] = []
                if(typeof resultatSemaine[element.nomm][element.nom] == 'undefined'){
                    resultatSemaine[element.nomm][element.nom] = []
                    resultatSemaine[element.nomm][element.nom]['total'] = 0 
                    if(element.etat === null){ 
                        resultatSemaine[element.nomm][element.nom]['total'] += element.count  
                    }else{
                        resultatSemaine[element.nomm][element.nom][element.etat] = []
                        resultatSemaine[element.nomm][element.nom][element.etat] = element.count
                        resultatSemaine[element.nomm][element.nom]['total'] += element.count
                    }
                }else{
                    if(element.etat === null){ 
                        resultatSemaine[element.nomm][element.nom]['total'] += element.count  
                    }else{
                        resultatSemaine[element.nomm][element.nom][element.etat] = []
                        resultatSemaine[element.nomm][element.nom][element.etat] = element.count
                        resultatSemaine[element.nomm][element.nom]['total'] += element.count
                    }
                }
            }else{
                if(typeof resultatSemaine[element.nomm][element.nom] == 'undefined'){
                    resultatSemaine[element.nomm][element.nom] = []
                    resultatSemaine[element.nomm][element.nom]['total'] = 0 
                    if(element.etat === null){ 
                        resultatSemaine[element.nomm][element.nom]['total'] += element.count  
                    }else{
                        resultatSemaine[element.nomm][element.nom][element.etat] = []
                        resultatSemaine[element.nomm][element.nom][element.etat] = element.count
                        resultatSemaine[element.nomm][element.nom]['total'] += element.count
                    }
                }else{
                    if(element.etat === null){ 
                        resultatSemaine[element.nomm][element.nom]['total'] += element.count  
                    }else{
                        resultatSemaine[element.nomm][element.nom][element.etat] = []
                        resultatSemaine[element.nomm][element.nom][element.etat] = element.count
                        resultatSemaine[element.nomm][element.nom]['total'] += element.count
                    }
                }
            }
        })

        let resultatJours = []
   
        data.findedStatsJours.forEach((element, index) => {
            if(typeof resultatJours[element.nomm] == 'undefined'){
                resultatJours[element.nomm] = []
                if(typeof resultatJours[element.nomm][element.nom] == 'undefined'){
                    resultatJours[element.nomm][element.nom] = []
                    resultatJours[element.nomm][element.nom]['total'] = 0 
                    if(element.etat === null){ 
                        resultatJours[element.nomm][element.nom]['total'] += element.count  
                    }else{
                        resultatJours[element.nomm][element.nom][element.etat] = []
                        resultatJours[element.nomm][element.nom][element.etat] = element.count
                        resultatJours[element.nomm][element.nom]['total'] += element.count
                    }
                }else{
                    if(element.etat === null){ 
                        resultatJours[element.nomm][element.nom]['total'] += element.count  
                    }else{
                        resultatJours[element.nomm][element.nom][element.etat] = []
                        resultatJours[element.nomm][element.nom][element.etat] = element.count
                        resultatJours[element.nomm][element.nom]['total'] += element.count
                    }
                }
            }else{
                if(typeof resultatJours[element.nomm][element.nom] == 'undefined'){
                    resultatJours[element.nomm][element.nom] = []
                    resultatJours[element.nomm][element.nom]['total'] = 0 
                    if(element.etat === null){ 
                        resultatJours[element.nomm][element.nom]['total'] += element.count  
                    }else{
                        resultatJours[element.nomm][element.nom][element.etat] = []
                        resultatJours[element.nomm][element.nom][element.etat] = element.count
                        resultatJours[element.nomm][element.nom]['total'] += element.count
                    }
                }else{
                    if(element.etat === null){ 
                        resultatJours[element.nomm][element.nom]['total'] += element.count  
                    }else{
                        resultatJours[element.nomm][element.nom][element.etat] = []
                        resultatJours[element.nomm][element.nom][element.etat] = element.count
                        resultatJours[element.nomm][element.nom]['total'] += element.count
                    }
                }
            }
        })


        for(let element in resultatMois) {

            $('#nomtelepro').append(
            '<thead>'+
                '<th>'+element+'</th>'+
                '<th>Num Comp</th>'+
                '<th>Refus</th>'+
                '<th>RDV</th>'+
                '<th>DEM</th>'+
                '<th>VENTE(S)</th>'+
                '<th>RDV/DEM</th>'+
                '<th>RDV/Vente</th>'+
            '</thead>'+
            '<tbody>'+
            '<tr class="'+element.split(' ').join('_')+'_jour">'+
            '</tr>'+
            '<tr class="'+element.split(' ').join('_')+'_semaine">'+
            '</tr>'+
            '<tr class="'+element.split(' ').join('_')+'_mois">'+
            '</tr>'+
            '</tbody>')

            if(typeof resultatJours[element] != 'undefined'){
                $('.'+element.split(' ').join('_')+'_jour').append('<td>Jour</td>'+
                '<td>'+ (typeof resultatJours[element]['APPEL'] != 'undefined' ? resultatJours[element]['APPEL'].total : '0') +'</td>'+
                '<td>'+ (typeof resultatJours[element]['REFUS'] != 'undefined' ? resultatJours[element]['REFUS'].total : '0') +'</td>'+
                '<td>'+ (typeof resultatJours[element]['RDV'] != 'undefined' ? resultatJours[element]['RDV'].total : '0') +'</td>'+
                '<td>'+ parseInt((typeof resultatJours[element]['DEM SUIVI'] != 'undefined' ? parseInt(resultatJours[element]['DEM SUIVI'].total) : parseInt(0)) + (typeof resultatJours[element]['DEM R.A.F.'] != 'undefined' ? parseInt(resultatJours[element]['DEM R.A.F.'].total) : parseInt(0))) +'</td>'+
                '<td>'+ (typeof resultatJours[element]['VENTE'] != 'undefined' ? resultatJours[element]['VENTE'].total : '0') +'</td>'+
                '<td>'+ ((typeof resultatJours[element]['RDV'] != 'undefined' ? resultatJours[element]['RDV'].total : '0') / ((typeof resultatJours[element]['DEM SUIVI'] != 'undefined' ? resultatJours[element]['DEM SUIVI'].total : 0) + (typeof resultatJours[element]['DEM R.A.F.'] != 'undefined' ? resultatJours[element]['DEM R.A.F.'].total : 0))).toFixed(2) +'</td>'+
                '<td>'+ ((typeof resultatJours[element]['RDV'] != 'undefined' ? resultatJours[element]['RDV'].total : '0') / (typeof resultatJours[element]['VENTE'] != 'undefined' ? resultatJours[element]['VENTE'].total : '0')).toFixed(2) +'</td>')
            }else{
                $('.'+element.split(' ').join('_')+'_jour').append('<td>Jour</td>'+
                '<td>0</td>'+
                '<td>0</td>'+
                '<td>0</td>'+
                '<td>0</td>'+
                '<td>0</td>'+
                '<td>-</td>'+
                '<td>-</td>')
            }

            if(typeof resultatSemaine[element] != 'undefined'){
                $('.'+element.split(' ').join('_')+'_semaine').append('<td>Semaine</td>'+
                '<td>'+ (typeof resultatSemaine[element]['APPEL'] != 'undefined' ? resultatSemaine[element]['APPEL'].total : '0') +'</td>'+
                '<td>'+ (typeof resultatSemaine[element]['REFUS'] != 'undefined' ? resultatSemaine[element]['REFUS'].total : '0') +'</td>'+
                '<td>'+ (typeof resultatSemaine[element]['RDV'] != 'undefined' ? resultatSemaine[element]['RDV'].total : '0') +'</td>'+
                '<td>'+ parseInt((typeof resultatSemaine[element]['DEM SUIVI'] != 'undefined' ? parseInt(resultatSemaine[element]['DEM SUIVI'].total) : parseInt(0)) + (typeof resultatSemaine[element]['DEM R.A.F.'] != 'undefined' ? parseInt(resultatSemaine[element]['DEM R.A.F.'].total) : parseInt(0))) +'</td>'+
                '<td>'+ (typeof resultatSemaine[element]['VENTE'] != 'undefined' ? resultatSemaine[element]['VENTE'].total : '0') +'</td>'+
                '<td>'+ ((typeof resultatSemaine[element]['RDV'] != 'undefined' ? resultatSemaine[element]['RDV'].total : '0') / ((typeof resultatSemaine[element]['DEM SUIVI'] != 'undefined' ? parseInt(resultatSemaine[element]['DEM SUIVI'].total) : 0) + (typeof resultatSemaine[element]['DEM R.A.F.'] != 'undefined' ? parseInt(resultatSemaine[element]['DEM R.A.F.'].total) : 0))).toFixed(2) +'</td>'+
                '<td>'+ ((typeof resultatSemaine[element]['RDV'] != 'undefined' ? resultatSemaine[element]['RDV'].total : '0') / (typeof resultatSemaine[element]['VENTE'] != 'undefined' ? resultatSemaine[element]['VENTE'].total : '0')).toFixed(2) +'</td>')
            }else{
                $('.'+element.split(' ').join('_')+'_semaine').append('<td>Semaine</td>'+
                '<td>0</td>'+
                '<td>0</td>'+
                '<td>0</td>'+
                '<td>0</td>'+
                '<td>0</td>'+
                '<td>-</td>'+
                '<td>-</td>')
            }

            if(typeof resultatMois[element] != 'undefined'){
                $('.'+element.split(' ').join('_')+'_mois').append('<td>Mois</td>'+
                '<td>'+ (typeof resultatMois[element]['APPEL'] != 'undefined' ? resultatMois[element]['APPEL'].total : '0') +'</td>'+
                '<td>'+ (typeof resultatMois[element]['REFUS'] != 'undefined' ? resultatMois[element]['REFUS'].total : '0') +'</td>'+
                '<td>'+ (typeof resultatMois[element]['RDV'] != 'undefined' ? resultatMois[element]['RDV'].total : '0') +'</td>'+
                '<td>'+ parseInt((typeof resultatMois[element]['DEM SUIVI'] != 'undefined' ? parseInt(resultatMois[element]['DEM SUIVI'].total) : parseInt(0)) + (typeof resultatMois[element]['DEM R.A.F.'] != 'undefined' ? parseInt(resultatMois[element]['DEM R.A.F.'].total) : parseInt(0))) +'</td>'+
                '<td>'+ (typeof resultatMois[element]['VENTE'] != 'undefined' ? resultatMois[element]['VENTE'].total : '0') +'</td>'+
                '<td>'+ ((typeof resultatMois[element]['RDV'] != 'undefined' ? resultatMois[element]['RDV'].total : '0') / ((typeof resultatMois[element]['DEM SUIVI'] != 'undefined' ? resultatMois[element]['DEM SUIVI'].total : 0) + (typeof resultatMois[element]['DEM R.A.F.'] != 'undefined' ? resultatMois[element]['DEM R.A.F.'].total : 0))).toFixed(2) +'</td>'+
                '<td>'+ ((typeof resultatMois[element]['RDV'] != 'undefined' ? resultatMois[element]['RDV'].total : '0') / (typeof resultatMois[element]['VENTE'] != 'undefined' ? resultatMois[element]['VENTE'].total : '0')).toFixed(2) +'</td>')
            }else{
                $('.'+element.split(' ').join('_')+'_mois').append('<td>Mois</td>'+
                '<td>0</td>'+
                '<td>0</td>'+
                '<td>0</td>'+
                '<td>0</td>'+
                '<td>0</td>'+
                '<td>-</td>'+
                '<td>-</td>')
            }

        }

        $('#nomtelepro').html($('#nomtelepro').html().replace(/Infinity/g, '-').replace(/NaN/g, '-'))

    })

})