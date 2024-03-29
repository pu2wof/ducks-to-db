'use strict';

require('dotenv').config()
const path = require('path')
const pg = require('./lib/pg.js');
const wiot = require('./lib/watson_iot.js');
const express = require('express');
let app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

// Serve index.html on root
app.use(express.static(path.join(__dirname, 'public')));

// Portal
app.get('/portal', function(req, res) {
    res.sendFile('public/portal.html', {root: __dirname })
})

// Watson IoT device type to subscribe too
const device_types = process.env.WIOT_DEVICE_TYPES.split(',')

let error_handle = (err) => {
  console.log(err)
  process.exit(1)
}

let insertWrapper = (deviceType, deviceId, eventType, format, payload) => {
  // Handle Duck Observation events differently
  if (eventType === 'device-observation') {
    pg.insertObservation(eventType, payload.toString('utf-8'), io)
  } else if (eventType === 'androidDebug') {
    pg.insertAndroidDebugEvent(deviceType, deviceId, eventType, format, payload, io)
  }else {
    pg.insertEvent(deviceType, deviceId, eventType, format, payload, io)
  }
}

pg.setup().then(db => {
  wiot.setup().then(ducks => {
    console.log('listening for device events...')
    device_types.forEach(dt => {
      ducks.subscribeToDeviceEvents(dt)
    })
    ducks.on("deviceEvent", insertWrapper);

  }, error_handle)
}, error_handle)

// Load API routes
require('./api/routes.js')(app,io)

// Run server
let port = process.env.PORT || 3000
server.listen(port, function() {
  console.log('express + socket.io server listening on port: '+port)
});

module.exports = io