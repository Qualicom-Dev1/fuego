function activeDep({ target }) {
    if(target.classList.contains('dep_disabled')) return
    
    if(target.classList.contains('dep_active')) {
        target.classList.remove('dep_active')
    }
    else {
        target.classList.add('dep_active')
    }
}

function initUIDeps() {
    try {
        document.querySelectorAll('.div_deps button')
        .forEach(button => button.onclick = activeDep)

        document.getElementById('cancel').onclick = remove_div_add_modify_deps
        document.getElementsByClassName('validate')[0].onclick = dispatchValidations
    }
    catch(e) {
        console.error(e)
        console.error("Erreur d'initialisation de l'UI deps.")
    }
}