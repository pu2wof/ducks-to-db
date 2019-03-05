const Client = require('ibmiotf');
const error_msgs = require('../api/errors.js')
const config = {
  "org": process.env.WIOT_ORG,
  "id": 'ducks-to-db',
  "domain": process.env.WIOT_DOMAIN,
  "auth-key": process.env.WIOT_API_KEY,
  "auth-token": process.env.WIOT_TOKEN,
  "type": "shared"
}

const wiot = new Client.IotfApplication(config);

// Connect to Watson IoT Foundation
let setup = () => {
  return new Promise((resolve, reject) => {
    wiot.connect();
    wiot.on("connect", function () {
      console.log('Connected to Watson IoT at: '+config.org+'.'+config.domain);
      resolve(wiot);
    });

    wiot.on("error", function (err) {
      reject(err);
    });
  })
}

// Create a new device
let create_device = (d_type, d_id, d_token, d_info, d_loc, d_meta) => {
  return new Promise((resolve, reject) => {
    if (typeof(d_type) !== 'string' || typeof(d_id) !== 'string') {
      return reject({"err": error_msgs.no_device_type_and_id});
    }
    wiot.registerDevice(d_type, d_id, d_token, d_info, d_loc, d_meta).then((argument) => {
      resolve(argument);
    }, (err) => {
      console.log(err);
      reject(err);
    });
  })
}

let get_device_types = (req, res) => {
  wiot.getAllDeviceTypes().then(result => {
    res.json(result)
  }, err => {
    res.status(500)
    res.json(err)
  })
}

let get_devices = (req, res) => {
  if (!req.query.type) {
    res.status(400)
    return res.json({"err": error_msgs.no_device_type})
  }
  wiot.listAllDevicesOfType(req.query.type).then(result => {
    res.json(result)
  }, err => {
    res.status(500)
    res.json(err)
  })
}

module.exports = {
  setup, 
  create_device,
  get_device_types,
  get_devices,
  lib: wiot
}
