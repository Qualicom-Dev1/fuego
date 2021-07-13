const nodemailer = require('nodemailer')
const { emails } = require('../config/config.json')

const TYPEMAIL = {
    SUPPORT : 'support',
    SIGNATURE : 'signature'
}

function sendSupportMail(mailOption) {
    const transporter = nodemailer.createTransport({
        host: 'ssl0.ovh.net',
        port:'465',
        secure : true,
        auth: {
            type: 'POP3',
            user: emails.support.user,
            pass: emails.support.pass
        }
    })

    mailOption.from = '"No-Reply" <support@fuego.ovh>'

    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOption, (err, info) => {
            if(err) return reject(err)
            resolve(info)
        })
    })
}

function sendSignatureMail(mailOption) {
    const transporter = nodemailer.createTransport({
        host: 'ssl0.ovh.net',
        port:'465',
        secure : true,
        auth: {
            user: emails.signature.user,
            pass: emails.signature.pass
        }
    })

    mailOption.from = '"No-Reply" <signature@fuego.ovh>'
    
    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOption, (err, info) => {
            if(err) return reject(err)
            resolve(info)
        })
    })
}


/**
 * Envoie un email
 * @param {string} type
 * @param {string} to - Destinataire
 * @param {string} subject - Sujet
 * @param {string} contentText - Corps du mail en version texte lorsqu'il n'est pas ouvert en html
 * @param {string} contentHTML - Corps du mail en html
 */
function sendMail(type, to, subject, contentText, contentHTML) {
    const mailOption = {
        to,
        subject,
        text : contentText,
        html : contentHTML
    }
    
    switch(type) {
        case TYPEMAIL.SUPPORT : 
            return sendSupportMail(mailOption)
        case TYPEMAIL.SIGNATURE : 
            return sendSignatureMail(mailOption)
        default : throw "Type d'email inconnu."
    }
}

module.exports = {
    TYPEMAIL,
    sendMail
}