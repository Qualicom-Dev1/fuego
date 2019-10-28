const models = require('./models/index')
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

require('./globals');

io.on('connection', function (socket) {

    socket.on('NeedSession', (data) => {
        socket.emit('SendSession', {sess: sess})
    })
    
    socket.on('JoinProspection', (data) => {
        console.log(data.user+' Join Prospection rooms');
        socket.nickname = data.user;
        socket.join(data.room);
    });
});

module.exports = io;