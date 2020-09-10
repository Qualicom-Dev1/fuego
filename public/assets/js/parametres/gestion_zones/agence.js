function initUIAgence() {
    const listeButtonModifyVendeur = document.getElementsByClassName('modifyVendeur')
    if(listeButtonModifyVendeur.length > 0) {
        for(const button of listeButtonModifyVendeur) {
            button.onclick = modifyVendeur
        }
    }

    const listeButtonDeleteVendeur = document.getElementsByClassName('deleteVendeur')
    if(listeButtonDeleteVendeur.length > 0 ) {
        for(const button of listeButtonDeleteVendeur) {
            button.onclick = deleteVendeur
        }
    }
}