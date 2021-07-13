const express = require('express')
const router = express.Router()
const { User, Role, Structure, Usersdependence, Privilege, Type } = db
const errorHandler = require('../../utils/errorHandler')
const isSet = require('../../utils/isSet')
const { validationEmail, validationString, validationMobilePhone, validationPhone, validationInteger } = require('../../utils/validations')

router
.get('/', (req, res) => {
    res.render('parametres/mon_compte', { 
        extractStyles: true, 
        title: 'Mon compte | FUEGO', 
        session: req.session.client, 
        options_top_bar: 'parametres'
    })
})
.post('/update/password', async (req, res) => {
    let infos = undefined

    try {
        const password = req.body.password

        // vérification du mot de passe
        if(!isSet(password)) throw "Un mot de passe doit être transmis."
        if(!(password.length > 5 && password.length < 19)) throw "Le mot de passe doit contenir entre 6 et 18 caractères."
        if(!(/[A-Z]+/g.test(password) && /[a-z]+/g.test(password) && /[0-9]+/g.test(password))) throw "Le mot de passe doit être composé au minimum d'une majuscule, une minuscule et d'un chiffre."

        const user = await User.findOne({
            where : {
                id : req.session.client.id
            }
        })
        if(user === null) throw "Un problème est survenu lors de la recherche de votre compte utilisateur. Veuillez recommencer plus tard."

        // hashage du mot de passe
        const hash = await bcrypt.hash(password, 10)

        // mise à jour de l'utilisateur
        user.password = hash
        await user.save()

        infos = errorHandler(undefined, "Votre mot de passe a bien été mis à jour.")
    }
    catch(error) {
        infos = errorHandler(error)
    }

    res.send({
        infos
    })
})
.post('/update', async (req, res) => {
    let infos = undefined

    try {
        const sentInfos = req.body

        if(!isSet(sentInfos)) throw "Vous devez transmettre vos informations."
        sentInfos.nom = validationString(sentInfos.nom, 'Le nom')
        sentInfos.prenom = validationString(sentInfos.prenom, 'Le prénom')
        sentInfos.tel1 = validationMobilePhone(sentInfos.tel1, 'portable')
        sentInfos.mail = validationEmail(sentInfos.mail, "L'adresse e-mail")
        if(isSet(sentInfos.tel2)) sentInfos.tel2 = validationPhone(sentInfos.tel2, "secondaire")
        else sentInfos.tel2 = null
        if(isSet(sentInfos.adresse)) sentInfos.adresse = validationString(sentInfos.adresse, "L'adresse postale")
        else sentInfos.adresse = null
        if(isSet(sentInfos.dep)) {
            sentInfos.dep = validationInteger(sentInfos.dep, "Le numéro de département principal")
            if(!(sentInfos.dep > 0 && sentInfos.dep < 96)) throw "Le département doit être compris entre 01 et 95."
        }
        else sentInfos.dep = null
        if(isSet(sentInfos.telcall)) sentInfos.telcall = validationPhone(sentInfos.telcall, "Le numéro de téléphone OVH")
        else sentInfos.telcall = null
        if(!isSet(sentInfos.billing)) sentInfos.billing = null

        let user = await User.findOne({
            include: [  
                {model: Role, include: Privilege},
                {model: Structure, include: Type},
                {model: Usersdependence}
            ],
            where : {
                id : req.session.client.id
            }
        })
        if(user === null) throw "Un problème est survenu lors de la recherche de votre compte utilisateur. Veuillez recommencer plus tard."

        user = Object.assign(user, sentInfos)
        await user.save()

        req.session.client = user

        infos = errorHandler(undefined, "Vos informations ont bien été mises à jour.")
    }
    catch(error) {
        infos = errorHandler(error)
    }

    res.send({
        infos
    })
})

module.exports = router