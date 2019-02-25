'use strict';

require('dotenv').config()

const fs = require('fs');
const path = require('path')

// Save Postgres certificate to file
const cert_b64 = process.env.PG_CERT_BASE_64
const cert_buffer = new Buffer(cert_b64, 'base64');  
const cert_ascii = cert_buffer.toString('ascii');
fs.writeFileSync("./pgroot.crt", cert_ascii)

const pg = require('./lib/pg.js');
const wiot = require('./lib/watson_iot.js');

// Watson IoT device type to subscribe too
const DEVICE_TYPE = process.env.WIOT_DEVICE_TYPE

let error_handle = (err) => {
  console.log(err)
  process.exit(1)
}

pg.setup().then(db => {
  wiot.setup().then(ducks => {
    console.log('listening for device events...')

    ducks.subscribeToDeviceEvents(DEVICE_TYPE)
    ducks.on("deviceEvent", pg.insertEvent);

  }, error_handle)
}, error_handle)

// Keep script alive without blocking the event loop
setInterval(_ => {
  console.log('still alive...')
}, 1000 * 60 * 60)
