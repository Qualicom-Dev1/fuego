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
                }, 4000)
            }
        }
        else if(infos.error) {
            textInfos.innerText = infos.error
            textInfos.classList.add('error_message')
        }
        
        textInfos.style.display = 'flex'
    }
}