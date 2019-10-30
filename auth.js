const models = require('./models/index.js')

auth = function (req, res, next) { 

    models.User.findOne({
        where:{
            login: 'root'
        },
        include: [
            {model: models.Role, include: models.Privilege},
            {model: models.Structure}
        ],
    })
    .then((user) => {

        req.session.client = user

        if ( req.path == '/' || req.path == '' || req.path == '/logout' || req.path == '/favicon.ico' || req.path.startsWith('/forget')) return next();

        let isAuthenticated = true;
        if(typeof req.session.client == 'undefined'){
            isAuthenticated = false
        }

        if (isAuthenticated) {
            
            if (req.method == 'POST') return next();

            if ( req.session.client.login == 'root') return next();
            if ( req.path == '/menu' ) return next();

            if(allow(req.session.client.Role.Privileges, req.path)){
                next();
            }else{
                req.flash('error_msg', 'Vous n\'avez pas le droit d\'acceder à cette page')
                res.redirect('/menu')
            }
        }
        else {
            req.flash('error_msg', 'Vous devez vous connecter pour accéder à cette page')
            res.redirect('/')
        }
    }).catch((err) => {

    })
}

module.exports = auth

allow = (privileges, url) => {
    let result = false
    privileges.forEach((element) => {
        if(element.url == url) result = true
    })
    return result
}
