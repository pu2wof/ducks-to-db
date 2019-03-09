const io = require('socket.io-client');

// Local
//const socket_host = 'http://localhost:3000'

// IBM Cloud
const socket_host = 'http://ducks-to-db.mybluemix.net'
const socket = io(socket_host);

socket.on('connect', function(){
  console.log('socket connected')

  // subscribe to events
  socket.on('civilian', function(data){
    console.log(data)
  });
  socket.on('androidDebug', function(data){
    console.log(data)
  });
  socket.on('health', function(data){
    console.log(data)
  });
  socket.on('device-observation', function(data){
    console.log(data)
  });
});

socket.on('disconnect', function(){
  console.log('disconnected')
});