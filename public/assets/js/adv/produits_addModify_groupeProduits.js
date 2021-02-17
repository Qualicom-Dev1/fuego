const formAddModifyGroupeProduits = document.getElementById('formAddModifyGroupeProduits')

async function initBoxGroupeProduits() {
    document.getElementById('btnShowAddGroupeProduits').onclick = switchAddGroupeProduits
}

function switchAddGroupeProduits() {
    if(formAddModifyGroupeProduits.parentNode.style.display === 'none') {        
        hideAddCategorie()
        hideAddProduit()
        showAddGroupeProduits()
    }
    else {
        hideAddGroupeProduits()
        cancelGroupeProduits()
    }
}

function showAddGroupeProduits() {
    const boxCreateModify = formAddModifyGroupeProduits.parentNode
    const btnShowAddCategorie = document.querySelector('#btnShowAddGroupeProduits svg')

    boxCreateModify.style.display = 'flex'
    btnShowAddCategorie.classList.remove(SVGPLUS)
    btnShowAddCategorie.classList.add(SVGMOINS)
}

function hideAddGroupeProduits() {
    const boxCreateModify = formAddModifyGroupeProduits.parentNode
    const btnShowAddCategorie = document.querySelector('#btnShowAddGroupeProduits svg')

    boxCreateModify.style.display = 'none'
    btnShowAddCategorie.classList.remove(SVGMOINS)
    btnShowAddCategorie.classList.add(SVGPLUS)
}

async function fillBowAddModifyGroupeProduits(infos = undefined, produit = undefined) {

}

function cancelGroupeProduits() {

}

async function addModifyGroupeProduits(event) {

}

async function showGroupeProduits(elt) {

}