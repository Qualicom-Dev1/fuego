auth = function (req, res, next) { 

    if ( req.path == '/' || req.path == '' ) return next();

    let isAuthenticated = true;
    if(typeof sess == 'undefined'){
        isAuthenticated = false
    }

    if (isAuthenticated) {

        if ( sess.login == 'root') return next();

        if(allow(sess.Role.Privileges, req.path) || req.path == '/menu'){
            next();
        }else{
            req.flash('error_msg', 'Vous n\'avez pas le droit d\'acceder a cette page')
            res.redirect('/menu')
        }
    }
    else {
        req.flash('error_msg', 'Vous devez vous connecter pour accéder a cette page')
        res.redirect('/')
    }
}

module.exports = auth

allow = (privileges, url) => {
    let result = false
    privileges.forEach((element) => {
        if(element.url == url) result = true
    })
    return result
}
