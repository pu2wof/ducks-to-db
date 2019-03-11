$(document).ready(function() {

  let append_to_log = (event_str) => {
    $("#log").append(event_str+'<br>')
    $('#log').scrollTop($('#log')[0].scrollHeight);
  }
  // IBM Cloud
  const socket_host = 'http://ducks-to-db.mybluemix.net'
  const socket = io(socket_host);

  socket.on('connect', function(){
    console.log('socket connected')

    // subscribe to events
    socket.on('civilian', function(data){
      let current_time = new Date()
      append_to_log('----- '+ current_time+' | civilian: '+data)
    });
    socket.on('androidDebug', function(data){
      let current_time = new Date()
      append_to_log('----- '+ current_time+' | androidDebug: '+data)
    });
    socket.on('health', function(data){
      let current_time = new Date()
      append_to_log('----- '+ current_time+' | health: '+data)
    });
    socket.on('device-observation', function(data){
      let current_time = new Date()
      append_to_log('----- '+ current_time+' | device-observation: '+data)
    });
    socket.on('new-test-report', function(data){
      let current_time = new Date()
      append_to_log('----- '+ current_time+' | new-test-report: '+data)
    });
  });

  socket.on('disconnect', function(){
    console.log('disconnected')
  });
})