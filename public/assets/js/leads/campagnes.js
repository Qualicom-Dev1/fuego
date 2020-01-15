let count = 0
let count_statut = 0
let count_dep = 0
$(document).ready(() => {

    setBtnAction()

    $('.add_condition').click(() => {
        
        count++;
        
        $('.sources_types').append(
            '<div class="cree_campagne_item">'+
            '<label for="sourcecampagne">Source :</label>'+
             '<select name="sourcecampagne_'+count+'" class="sourcecampagne">'+
                '<option value="" selected>Source de fichier</option>'+
            '</select>'+
    
            '<label for="typelead">Type :</label>'+
            '<select name="typelead_'+count+'" class="typelead">'+
                '<option value="" >Type de fichier</option>'+
            '</select>'+
            '<i class="fas fa-minus btn_item2 hover_btn3 delete_condition"></i>'+
            '</div>')

        $.ajax({
            url: '/leads/campagnes/get-sources-types',
            method: 'POST'
        }).done((data) => {
            
            console.log(data.findedSource)

            data.findedSource.forEach((element) => {
                $('select[name=sourcecampagne_'+count+']').append('<option value="'+element.DISTINCT+'">'+element.DISTINCT+'</option>')
            })

            data.findedType.forEach((element) => {
                $('select[name=typelead_'+count+']').append('<option value="'+element.DISTINCT+'">'+element.DISTINCT+'</option>')
            })

            $('.sources_types').ready(() => {
                $('select[name=sourcecampagne_'+count+']').change(event => {
                    let data = {
                        type_de_fichier: $('select[name=sourcecampagne_'+count+'] option:selected').val()
                    }
                    $.ajax({
                        url: '/manager/get-type',
                        method: 'POST',
                        data: data
                     }).done((data) => {
                        $('select[name=typelead_'+count+']').html('')
                        $('select[name=typelead_'+count+']').append('<option value="" selected>Type de fichier</option>');
                        data.forEach(element => {
                            $('select[name=typelead_'+count+']').append('<option value="'+element.DISTINCT+'">'+element.DISTINCT+'</option>');
                        })
                     });
                })
                $('.delete_condition').unbind('click')
                $('.delete_condition').click((event) => {
                    $(event.currentTarget).parent().remove()
                })
            })
        })
    })

    $('.add_statut').click(() => {
        count_statut++;
        $('.statuts').append(
        '<div class="cree_campagne_item">'+
            '<label for="statutcampagne">Statut(s) :</label>'+
            '<select name="statut_'+count_statut+'" class="stautcampagne">'+
               '<option select value="">Statut</option>'+
            '</select>'+
            '<i class="fas fa-minus btn_item2 hover_btn3 delete_statut"></i>'+
        '</div>')

        $.ajax({
            url: '/leads/campagnes/get-statuts',
            method: 'POST'
        }).done((data) => {
        
            data.findedStatuts.forEach((element) => {
                $('select[name=statut_'+count_statut+']').append('<option value="'+element.id+'">'+element.nom+'</option>')
            })

            $('.statuts').ready(() => {
                $('.delete_statut').unbind('click')
                $('.delete_statut').click((event) => {
                    $(event.currentTarget).parent().remove()
                })
            })
        })
    })

    $('.add_dep').click(() => {
        count_dep++;
        $('.deps').append(
        '<div class="cree_campagne_item">'+
            '<label for="deplead_'+count_dep+'">DEP :</label>'+
            '<input id="deplead_'+count_dep+'" class="depcampagne" value="" />'+
            '<i class="fas fa-minus btn_item2 hover_btn3 delete_dep"></i>'+
        '</div>')

        $('.deps').ready(() => {
            $('.delete_dep').unbind('click')
            $('.delete_dep').click((event) => {
                $(event.currentTarget).parent().remove()
            })
        })
    })

    $('.validcampagne').click((e) => {

        e.preventDefault();

        let data = {}

        data['nom'] = $('#nomcampagne').val()
        data['prix'] = $('#prixcampagne').val()
        data['sources_types'] = []
        data['deps'] = []
        data['statuts'] = []

        $('.sourcecampagne').each((index, element)=> {
            let num = $(element).attr('name').split('_')[1]
            data['sources_types'].push([$(element).prop('selected', true).val(), $("select[name=typelead_"+num+"] option:selected").val()])
        })

        $('.depcampagne').each((index, element)=> {
            data['deps'].push($(element).val())
        })

        $('.stautcampagne').each((index, element)=> {
            data['statuts'].push($(element).val())
        })

        $.ajax({
            url: '/leads/campagnes/get-modal-campagne',
            method: 'POST',
            data: data
        }).done(res => {
            $('#modal_liste_campagnes').html('');
            $('#modal_liste_campagnes').append('<p>Il existe '+ res.findedClient.length +' lignes pour les criteres demandé</p>');
            $('#modal_liste_campagnes').append('<label for="number">Nombres de lignes pour la campagne</label>');
            $('#modal_liste_campagnes').append('<input name="number" type="number" id="number" value="" min="1" />');
            $('#modal_liste_campagnes').append('<button id="valide_campagne">Validé</button>');
            $('#modal_liste_campagnes').modal();

            $('#valide_campagne').click(event => {
  
                let campagnes = {
                    nom: data.nom,
                    prix: data.prix == "" ? 0 : prix,
                    etat_campagne: 0,
                    deps: data.deps.join(','),
                    statuts: data.statuts.join(',')
                }

                let sources_types_campagnes = [];
                data.sources_types.forEach((source_type) => {
                    sources_types_campagnes.push(source_type.join(','))
                })

                campagnes['sources_types'] = sources_types_campagnes.join('/')

                $.ajax({
                    method: 'POST',
                    url: '/leads/campagnes/set-campagne',
                    data: {
                        campagnes: campagnes,
                        need_leads: $('#number').val(),
                        data_request: data
                    }
                }).done( res => {
                    $('tbody').append('<tr class="historique_ligne" id="campagne_'+ res.createdCampagnes.id +'">'+
                                        '<td>'+res.createdCampagnes.createdAt+'</td>'+
                                        '<td>'+res.createdCampagnes.nom+'</td>'+
                                        '<td>'+res.createdCampagnes.sources_types+'</td>'+
                                        '<td>'+res.createdCampagnes.deps+'</td>'+
                                        '<td>'+res.createdCampagnes.statuts+'</td>'+
                                        '<td>'+res.createdCampagnes.prix+'</td>'+
                                        '<td><button class="active">Activer</button><button class="supprimer">Supprimer</button></td>'+
                                    '</tr>')
                    setBtnAction()
                    $.modal.close()
                })
            })

        })

    })

});

function setBtnAction(){
    $('.supprimer').unbind('click')
    $('.supprimer').click((event) => {
        $.ajax({
            method: 'POST',
            url: '/leads/campagnes/delete-campagne',
            data : {
                id: $(event.currentTarget).parents('tr').attr('id').split('_')[1]
            }
        }).done((res) => {
            $(event.currentTarget).parents('tr').remove()
        })
    })

    $('.active').unbind('click')
    $('.active').click((event) => {
        $.ajax({
            method: 'POST',
            url: '/leads/campagnes/active-campagne',
            data : {
                id: $(event.currentTarget).parents('tr').attr('id').split('_')[1]
            }
        }).done((res) => {
            $(event.currentTarget).parent().prepend('<button class="desactive">Desactiver</button>')
            $(event.currentTarget).parent().children('.active').remove()
            $(event.currentTarget).parent().children('.supprimer').remove()
    
            setBtnAction()
        })

    })

    $('.desactive').unbind('click')
    $('.desactive').click((event) => {
        $.ajax({
            method: 'POST',
            url: '/leads/campagnes/desactive-campagne',
            data : {
                id: $(event.currentTarget).parents('tr').attr('id').split('_')[1]
            }
        }).done((res) => {
            $(event.currentTarget).parent().prepend('La campagne est terminée')
            $(event.currentTarget).parent().children('.desactive').remove()
            $(event.currentTarget).parent().children('.supprimer').remove()

            setBtnAction()
        })
    })
}
