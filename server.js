const express = require('express');
const path = require('path');
const expresslayouts = require('express-ejs-layouts');
const flash = require('connect-flash');
const session = require('express-session');

const app = express();
const server = require('http').Server(app);

const PORT = 8080;

//EJS
app.use(expresslayouts);
app.use(express.static(__dirname));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/public/views'));

//Session
app.use(session({secret: 'FPggjxw7',saveUninitialized: true,resave: false}));

//Bodyparser
app.use(express.urlencoded({ extended: false }));

//// Connect flash
app.use(flash());
app.use(function(req, res, next) {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');

    //Fonction de teste Menu pour l'affichage ou non des carré de module
    /*
      tab: Tableau avec la liste des privileges
      id: identifiant du module
    */
    res.locals.ifAllow = (tab, id) => {
      let res = false;
      tab.forEach((element) => {
          if(element.categorie == id) res = true
      });

      if ( sess.login == 'root') res = true

      return res;
    }

    res.locals.setUpUrl = (tab, id) => {
      let result = '';
      tab.forEach((element) => {
          if(element.categorie == id) result = element.url
      });
      return result;
    }

    next();
});

//Auth and Allowed Link
app.use(require('./auth'))

//Routes
app.use('/', require('./routes/login'))
app.use('/menu', require('./routes/mainchoices'))
app.use('/dirco', require('./routes/dirco'))
app.use('/vendeur', require('./routes/vendeur'))
app.use('/telec', require('./routes/telec'))
app.use('/manager', require('./routes/manager'))

server.listen(PORT, console.log('Example app listening on port '+ PORT+'!'));