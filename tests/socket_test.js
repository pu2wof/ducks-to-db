const io = require('socket.io-client');
const port = process.env.PORT || 3000
const socket = io('http://localhost:'+port);

socket.on('connect', function(){
  console.log('socket connected')
});
socket.on('civilian', function(data){
  console.log(data)
});
socket.on('disconnect', function(){
  console.log('disconnected')
});