let append_to_log = (etype, event_str) => {

  let current_time = moment().format('M/D/YY, h:mm:ss a');
  event_str = JSON.stringify(JSON.parse(event_str), null, 2);
  event_str_fmt = syntaxHighlight(event_str);
  let html_str = `<div class="container"><span class="time">${current_time}</span>
  <span class="etype">${etype}</span>: 
  <p class="event_str">${event_str_fmt}</p></div>`

  $("#log").append(html_str)
  $('#log').scrollTop($('#log')[0].scrollHeight);
}

function output(inp) {
    document.body.appendChild(document.createElement('pre')).innerHTML = inp;
}

function syntaxHighlight(json) {
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
      var cls = 'number';
      if (/^"/.test(match)) {
          if (/:$/.test(match)) {
              cls = 'key';
          } else {
              cls = 'string';
          }
      } else if (/true|false/.test(match)) {
          cls = 'boolean';
      } else if (/null/.test(match)) {
          cls = 'null';
      }
      return '<span class="' + cls + '">' + match + '</span>';
  });
}

$(document).ready(function() {
  
  // IBM Cloud
  const socket_host = 'http://ducks-to-db.mybluemix.net'
  const socket = io(socket_host);

  socket.on('connect', function(){
    console.log('socket connected')

    // subscribe to events
    socket.on('civilian', function(data){
      append_to_log('civilian',data)
    });
    socket.on('androidDebug', function(data){
      append_to_log('androidDebug',data)
    });
    socket.on('health', function(data){
      append_to_log('health',data)
    });
    socket.on('device-observation', function(data){
      append_to_log('device-observation',data)
    });
    socket.on('new-test-report', function(data){
      append_to_log('new-test-report',data)
    });
  });

  socket.on('disconnect', function(){
    console.log('disconnected')
  });
})