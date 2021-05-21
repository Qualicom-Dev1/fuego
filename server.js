const dotenv = require('dotenv')
dotenv.config();

const express = require('express');
const expresslayouts = require('express-ejs-layouts');
const path = require('path');
const flash = require('connect-flash');
const session = require('express-session');
const db = require('./models/index')
const moment = require('moment');
const app = express();
const server = require('http').Server(app);
global.io = require('socket.io')(server);

const logger = require('./logger/logger')
console.log = (msg) => logger.log({ level : 'info', message : msg})
console.error = (msg) => logger.log({ level : 'error', message : msg})


// ajout de la base de données dans l'objet global
global.db = db
//SetingUp moment
// moment.updateLocale(moment.locale(), { invalidDate: "" })
moment.locale('fr')
global.moment = moment
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
          if(element.url == url /*|| url.startsWith(element.url)*/) res = true
      });

      if ( req.session.client.login == 'root') res = true

      return res;
    }
    
    res.locals.setUpUrl = (tab, id) => {
      let result = '';
      for(const privilege of tab) {
        if(privilege.categorie == id) return privilege.url
      }
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
app.use('/pdf', require('./routes/pdf').router)
app.use('/adv', require('./routes/ADV/index'))
app.use('/statistiques/podium', require('./routes/podium'))
app.use('/ecran', require('./routes/affichageSalle'))
app.use('/facturation', require('./routes/facturation/index'))


const PORT = 8080;
server.listen(PORT, console.log('Example app listening on port '+ PORT+'!'));