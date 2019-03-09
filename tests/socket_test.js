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
    console.log('----- civilian: ', data)
    console.log('')
  });
  socket.on('androidDebug', function(data){
    console.log('----- androidDebug: ', data)
    console.log('')
  });
  socket.on('health', function(data){
    console.log('----- health: ',data)
    console.log('')
  });
  socket.on('device-observation', function(data){
    console.log('----- device-observation: ', data)
    console.log('')
  });
  socket.on('new-test-report', function(data){
    console.log('----- new-test-report: ', data)
    console.log('')
  });
});

socket.on('disconnect', function(){
  console.log('disconnected')
});