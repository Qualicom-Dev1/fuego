const isSet = (val) => {
    if(typeof val === 'string') {
        val = val.trim()
    }

    if(val === '' || val === undefined || val === 'undefined' || val === null || val === 'NULL' || val.length === 0) {
        return false
    }

    return true
}

module.exports = isSet