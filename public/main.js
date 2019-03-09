$(document).ready(function() {

  let append_to_log = (event_str) => {
    $("#log").append(event_str+'<br>')
  }
  // IBM Cloud
  const socket_host = 'http://ducks-to-db.mybluemix.net'
  const socket = io(socket_host);

  socket.on('connect', function(){
    console.log('socket connected')

    // subscribe to events
    socket.on('civilian', function(data){
      append_to_log('----- civilian: '+data)
    });
    socket.on('androidDebug', function(data){
      append_to_log('----- androidDebug: '+data)
    });
    socket.on('health', function(data){
      append_to_log('----- health: '+data)
    });
    socket.on('device-observation', function(data){
      console.log(data)
      append_to_log('----- device-observation: '+data)
    });
    socket.on('new-test-report', function(data){
      append_to_log('----- new-test-report: '+data)
    });
  });

  socket.on('disconnect', function(){
    console.log('disconnected')
  });
})