function clickModifyAgence(elt) {
    remove_div_add_modify_deps()
    addModifyAgence('modify', elt)
}

function setDepPrincipal({ target }) {
    let val = Number(target.value)
    if(!isNaN(val) && val > 0) {
        if(val > 98) val = 98
        if(val < 10) val = `0${val}`
        target.value = val
    }
}

function initUIAgences() {
    const listeButtonsModifyAgences = document.getElementsByClassName('modify_agence')
    if(listeButtonsModifyAgences.length > 0) {
        for(const button of listeButtonsModifyAgences) {
            button.onclick = clickModifyAgence
        }
    }

    const listeInputsDepPrincipal = document.getElementsByClassName('depPrincipal')
    if(listeInputsDepPrincipal.length > 0) {
        for(const input of listeInputsDepPrincipal) {
            input.oninput = setDepPrincipal
        }
    }

    const listeButtonValidateVendeur = document.getElementsByClassName('validate_vendeur')
    if(listeButtonValidateVendeur.length > 0) {
        for(const button of listeButtonValidateVendeur) {
            button.onclick = validateVendeur
        }
    }

    const listeButtonCancelVendeur = document.getElementsByClassName('cancel_vendeur')
    if(listeButtonCancelVendeur.length > 0) {
        for(const button of listeButtonCancelVendeur) {
            button.onclick = cancelVendeur
        }
    }

    // binding sur les event de l'accordion pour charger l'agence lors de l'ouverture et la retirer lors de la fermeture
    $('#accordion').on('show.bs.collapse', event => {        
        showAgence(event.target)
    })
    $('#accordion').on('hide.bs.collapse', event => {
        hideAgence(event.target)
    })
}