'use strict';

require('dotenv').config()

const pg = require('./lib/pg.js');
const wiot = require('./lib/watson_iot.js');
const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

// Watson IoT device type to subscribe too
const device_types = process.env.WIOT_DEVICE_TYPES.split(',')

let error_handle = (err) => {
  console.log(err)
  process.exit(1)
}

let insertWrapper = (deviceType, deviceId, eventType, format, payload) => {
  // Handle Duck Observation events differently
  if (eventType === 'device-observation') {
    let parsed_obs = ""
    try {
       parsed_obs = JSON.parse(payload);
    } catch (err) {
      console.log(err);
    }
    if (parsed_obs !== "") {
      pg.insertObservation(parsed_obs).then(_ => {}, err => {
        console.log(err)
      });
    } else {
      console.log("error: observation could not be defined");
    }
  } else {
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
require('./api/routes.js')(app)

// Run server
let port = process.env.PORT || 3000
server.listen(port, function() {
  console.log('express + socket.io server listening on port: '+port)
});

module.exports = io