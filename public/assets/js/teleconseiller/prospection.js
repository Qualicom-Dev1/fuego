let socket = io.connect();

let usedClient = [];

socket.on('connect', function() {
   socket.emit('NeedSession')

   socket.on('SendSession', (data) => {
        socket.emit('JoinProspection', {room: 'Prospection', user:data.sess.nom+' '+data.sess.prenom});
   })

   socket.on('SendUsedClients', (data) => {
      usedClient = data
   })
});