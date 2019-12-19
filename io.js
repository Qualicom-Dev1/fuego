const models = require('./models/index')
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

require('./globals');

io.on('connection', function (socket) {
    
    socket.on('JoinProspection', (data) => {
        socket.join(data.room);
        console.log(data);
    });
    
    socket.in('Prospection').on('Leave', (data) => {
        usedIdLigne.splice( usedIdLigne.indexOf(parseInt(data.idClient)) , 1)
    });

});

module.exports = io;