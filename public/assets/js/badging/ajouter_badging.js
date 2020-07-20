function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function emptySelect() {
    $('#select_refparrain').find('option').remove().end()
}

async function searchForClient() {
    emptySelect()
    const search = document.getElementById('input_refparrain').value
    const select = $('#select_refparrain')
    let length_clients = 0
    if(search !== undefined && typeof search === 'string' && search.length > 3) {        
        try {
            const url = '/badging/get-referent'
            const option = {
                method : 'POST',
                headers : new Headers({
                    "Content-type" : "application/json"
                }),
                body : JSON.stringify({
                    "search" : search
                })
            }

            const response = await fetch(url, option)
            if(response.ok) {
                const data = await response.json()
                emptySelect()
                
                if(data.error) {
                    select.append(`<option selected='selected'>${data.error_message}</option>`)
                }
                else {                      
                    if(data.clients !== undefined && data.clients.length > 0) {
                        length_clients = data.nb_clients
                        select.append(`<option value=''></option>`)
                        for(const client of data.clients) {
                            select.append(`<option value='${client.id}'>${client.nom}</option>`)
                        }
                    }
                }
            }
        }
        catch(error) {
            console.error(error)

        }
    }
    document.getElementById('span_refparrain').innerHTML = length_clients
}

async function createClient() {
    const divError = document.getElementById('error_message')
    divError.innerHTML = ''
    divError.style.display = 'none'

    // $('.ctn_infos_client input').prop('disabled', true);
    // $('.ctn_infos_client select').prop('disabled', true);
    // $('.ctn_infos_client textarea').prop('disabled', true);

    let client = {}
    $(".ctn_infos_client :input:not([type=select])").each((index ,element) => {
        if(element.checked || element.value != ''){
            client[element.name] = element.checked ? "1" : element.value;
        }
    });

    $("select").each((index ,element) => {
        client[element.name] = $(element).children("option").filter(":selected").val()
    });

    const idParrain = ($('#select_refparrain').val() !== '') ? $('#select_refparrain').val() : undefined
    const idVendeur = ($('#idVendeur').val() !== '') ? $('#idVendeur').val() : undefined

    try {
        const url = '/badging/create-client'
        const option = {
            method : 'POST',
            headers : new Headers({
                "Content-type" : "application/json"
            }),
            body : JSON.stringify({
                client : client,
                idParrain : idParrain,
                idVendeur : idVendeur
            })
        }

        const response = await fetch(url, option)
        if(response.ok) {
            const data = await response.json()
            if(data.error) {
                throw data.error_message
            }

            if(data.idClient === undefined) {
                throw 'Une erreur est survenue, veuillez réessayer plus tard.'
            }

            window.location.assign(`/badging/client/${data.idClient}`)
        }
        else {
            throw 'Une erreur est survenue, veuillez réessayer plus tard.'
        }
    }
    catch(error) {        
        divError.innerHTML = error
        divError.style.display = 'block'
    }
}

function initUI() {
    document.getElementById('input_refparrain').onkeyup = searchForClient
    document.querySelector('.btn_modifier_client').onclick = createClient
}

window.addEventListener('load', () => {
    initUI()
})