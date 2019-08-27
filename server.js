const express = require('express');
const path = require('path');
const expresslayouts = require('express-ejs-layouts');

const app = express();
const session = require('express-session');
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

//Routes
app.use('/', require('./routes/login'))
app.use('/menu', require('./routes/mainchoices'))
app.use('/dirco', require('./routes/dirco'))
app.use('/vendeur', require('./routes/vendeur'))
app.use('/telec', require('./routes/telec'))
app.use('/manager', require('./routes/manager'))

server.listen(PORT, console.log('Example app listening on port '+ PORT+'!'));