'use strict';

require('dotenv').config()

const pg = require('./lib/pg.js');
const wiot = require('./lib/watson_iot.js');
const server = require('http').createServer();
const io = require('socket.io')(server);

// Watson IoT device type to subscribe too
const device_types = process.env.WIOT_DEVICE_TYPES.split(',')

let error_handle = (err) => {
  console.log(err)
  process.exit(1)
}

let insertWrapper = (deviceType, deviceId, eventType, format, payload) => {
  pg.insertEvent(deviceType, deviceId, eventType, format, payload, io)
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

// Run socket.io server
let port = process.env.PORT || 3000
server.listen(port, function() {
  console.log('socket.io server listening on port: '+port)
});

module.exports = io