const dotenv = require('dotenv')
dotenv.config();

const logger = require('./logger/logger')
console.log = (msg) => logger.log({ level : 'info', message : msg})
console.error = (msg) => logger.log({ level : 'error', message : msg})

const express = require('express');
const expresslayouts = require('express-ejs-layouts');

const path = require('path');
const flash = require('connect-flash');
const session = require('express-session');
const moment = require('moment');
const app = express();
const server = require('http').Server(app);
global.io = require('socket.io')(server);

const PORT = 8080;

//SetingUp moment
moment.updateLocale(moment.locale(), { invalidDate: "" })
//EJS
app.use(expresslayouts)
app.use(express.static(__dirname))
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, '/public/views'))
app.use(express.json({limit: '50mb'}))
app.use(express.urlencoded({limit: '50mb'}))

//Session
app.use(session({secret: 'Imsecretkey',saveUninitialized: true,resave: false}));

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

      if ( req.session.client.login == 'root') res = true

      return res;
    }

    res.locals.ifAllowMenu = (url) => {
      let res = false;
      req.session.client.Role.Privileges.forEach((element) => {
          if(element.url == url) res = true
      });

      if ( req.session.client.login == 'root') res = true

      return res;
    }
    
    res.locals.setUpUrl = (tab, id) => {
      let result = '';
      tab.reverse().forEach((element) => {
          if(element.categorie == id) result = element.url
      });
      return result;
    }

    next();
});

//Auth and Allowed Link
app.use(require('./auth'))

//Socket.IO
require("./io");

//Routes
app.use('/', require('./routes/login'))
app.use('/menu', require('./routes/mainchoices'))
app.use('/directeur', require('./routes/dirco'))
app.use('/commerciaux', require('./routes/vendeur'))
app.use('/teleconseiller', require('./routes/telec'))
app.use('/manager', require('./routes/manager'))
app.use('/marketing', require('./routes/marketing'))
app.use('/parametres', require('./routes/parametres'))
app.use('/statistiques', require('./routes/statistiques'))
app.use('/poses', require('./routes/poses'))
app.use('/leads', require('./routes/leads'))
app.use('/badging', require('./routes/badging'))
app.use('/terrain', require('./routes/terrain'))
app.use('/api', require('./routes/api'))
app.use('/pdf', require('./routes/pdf'))
app.use('/adv', require('./routes/adv'))

server.listen(PORT, console.log('Example app listening on port '+ PORT+'!'));