let socket = io('wss://:port');

let usedClient = [];

socket.on('connect', function() {
   
   socket.emit('JoinProspection', {room: 'Prospection'});
 
});

window.onbeforeunload = function(e) {
   socket.emit('Leave', {idClient: $('.infos_client').attr('id').split('_')[1]})
   socket.disconnect();
 }; 