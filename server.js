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
    next();
  });

//Routes
app.use('/', require('./routes/login'))
app.use('/menu', require('./routes/mainchoices'))
app.use('/dirco', require('./routes/dirco'))
app.use('/vendeur', require('./routes/vendeur'))
app.use('/telec', require('./routes/telec'))
app.use('/manager', require('./routes/manager'))

server.listen(PORT, console.log('Example app listening on port '+ PORT+'!'));