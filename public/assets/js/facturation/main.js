let isUpdated = false

function initTextInfos() {
    const textInfos = document.getElementById('textInfos')
    textInfos.style.display = 'none'
    textInfos.classList.remove('error_message')
    textInfos.classList.remove('info_message')
    textInfos.innerText = ''
}

function fillTextInfos(infos) {
    const textInfos = document.getElementById('textInfos')

    if(infos) {
        if(infos.message) {
            textInfos.innerText = infos.message
            textInfos.classList.add('info_message')
            if(isUpdated) {
                textInfos.innerText =  `${infos.message} La page va s'actualiser dans quelques instants...`
                setTimeout(() => {
                    window.location.reload()
                }, 2500)
            }
        }
        else if(infos.error) {
            textInfos.innerText = infos.error
            textInfos.classList.add('error_message')
        }
        
        textInfos.style.display = 'flex'
    }
}

function initVisitedTr() {
    const url = window.location.href
    const id = url.split('#')[1]

    if(id && document.getElementById(id)) {
        document.getElementById(id).classList.add('hover')

        document.querySelectorAll('.ctn_table tr[id]').forEach(tr => tr.addEventListener('mouseover', resetVisitedTr))
    }
}

function resetVisitedTr() {
    const tr = document.querySelector('.ctn_table tr[id].hover')

    if(tr) {
        document.querySelector('.ctn_table tr[id].hover').classList.remove('hover')
    }
}

function textarea_auto_height(elem) {
    elem.style.height = "1px";
    elem.style.height = (elem.scrollHeight)+"px";
}

window.addEventListener('load', () => {
    initVisitedTr()
})