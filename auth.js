const models = require('./models/index.js')

auth = function (req, res, next) { 

    // début auth automatique
    // models.User.findOne({
    //     where:{
    //         // login: 'root'
    //         // login: 'njacquet'
    //         login: 'wbaadji'
    //     },
    //     include: [
    //         {model: models.Role, include: models.Privilege},
    //         {model: models.Structure, include: models.Type},
    //         {model: models.Usersdependence}
    //     ],
    // })
    // .then((user) => {
        
    //     req.session.client = user
    // fin auth automatique, voir fin pour catch également

        if ( req.path == '/' || req.path == '' || req.path == '/logout' || req.path == '/favicon.ico' || req.path.startsWith('/forget') || req.path.startsWith('/pdf') || req.path.startsWith('/api') || req.path.startsWith('/public/assets/')) return next();

        // pages d'accès public pour le BDC
        // /adv/bdc/signature/info/callback
        // /adv/bdc/:Id_BDC/signature/success
        // /adv/bdc/:Id_BDC/signature/cancel
        // /adv/bdc/:Id_BDC/signature/fail
        // /adv/bdc/:Id_BDC/pdf/:Nom_PDF?
        // /adv/bdc/:Id_BDC/relance        
        if(/^\/adv\/bdc\/(signature\/info\/callback|\d+\/(signature|pdf|relance))/.test(req.path)) return next()

        let isAuthenticated = true;
        if(typeof req.session.client == 'undefined'){
            isAuthenticated = false
        }

        if (isAuthenticated) {
            console.log(`(${req.session.client.login}) ${req.session.client.prenom} ${req.session.client.nom} accède à ${req.path}`)
            
            if ( req.path.startsWith('/teleconseiller/recherche/') || req.path.startsWith('/teleconseiller/rappels/')) return next();
            if(req.path.startsWith('/badging/client/')) return next()

            if (req.method == 'POST') return next();

            if ( req.session.client.login == 'root') return next();
            if ( req.path == '/menu') return next();
            
            if(allow(req.session.client.Role.Privileges, req.path)){
                next();
            }
            else{
                console.log(`(${req.session.client.login}) ${req.session.client.prenom} ${req.session.client.nom} accès refusé à ${req.path}`)
                req.flash('error_msg', 'Vous n\'avez pas le droit d\'acceder à cette page')
                res.redirect('/menu')
            }
        }
        else {
            req.flash('error_msg', 'Vous devez vous connecter pour accéder à cette page')
            res.redirect('/')
        }
//    }).catch((err) => {

//    })
}

module.exports = auth

allow = (privileges, url) => {
    for(const privilege of privileges) {
        if(privilege.url == url || url.startsWith(privilege.url)) return true
    }

    return false
}
