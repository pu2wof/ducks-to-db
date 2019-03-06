let express = require('express');
let bodyParser = require('body-parser');
let router = express.Router();
let wiot = require('../../lib/watson_iot.js');
let pg = require('../../lib/pg.js');
let device_utils = require('./utils.js');
let error_msgs = require('../errors.js');

router.use(bodyParser.json());

// Get all the device types and devices currently registered
router.get('/', wiot.get_device_types);
router.get('/device', wiot.get_devices)
router.delete('/', (req, res) => {
  let type = req.query.type
  let id = req.query.id

  if (!type || !id) {
    res.status(400)
    return res.json({"err": error_msgs.no_device_type_and_id})
  }

  // Delete from Watson IoT
  wiot.lib.unregisterDevice(type, id).then(_ => {
    // Delete from Postgres
    pg.deleteDevice(type, id).then(_ => {
      res.json({"ok": true})
    })
  }, err => {
    res.status(500)
    res.json(err)
  });
});

// Create a device
router.post('/', (req, res, next) => {
  if (!req.body || !req.body.type || !req.body.id) {
    res.status(400)
    return res.json({"err": error_msgs.no_device_type_and_id})
  }
  let device = {
    "type": req.body.type,
    "id": req.body.id
  }
  let handle_err = (err) => {
    res.status(500)
    return res.json(err)
  }
  wiot.lib.getAllDeviceTypes().then(device_types => {
    let exists = false
    device_types.results.forEach(dt => {
      if (dt.id === device.type) {
        exists = true;
      }
    })

    let create_device_and_insert = () => {
      // Create in watson iot
      wiot.create_device(device.type, device.id, device.token, 
        device.info, device.location, device.meta_data).then(wiot_result => {
          // Save device credentials in postgres
          pg.insertDevice(wiot_result).then(pg_result => {
            // Generate file
            device_utils.generate_file(wiot_result).then(file => {
              let obj = {
                "file":file, 
                "credentials": {
                  "organization": process.env.WIOT_ORG,
                  "type": wiot_result.typeId,
                  "id": wiot_result.deviceId,
                  "token": wiot_result.authToken
                }
              }
              res.json(obj)
            }, handle_err)
          }, handle_err)
        }, err => {
          // If creating the same device, return the credentials
          if (err.status === 409 && err.data && err.data.exception &&
            err.data.exception.id && err.data.exception.id === 'CUDRS0020E') {
            pg.getDevice(device.type, device.id).then(existing => {
              delete existing["id"]
              res.json(existing)
            }, handle_err)
          } else {
            res.status(err.status)
            res.json(err)
          }
        })
    }

    // If the device type doesn't exist, create it
    if (!exists) {
      wiot.lib.registerDeviceType(device.type).then(_ => {
        create_device_and_insert()
      }, handle_err)
    } else {
      create_device_and_insert()
    }
  }, handle_err)
});

// Create .ino file for device_id
router.get('/file', (req, res) => {
  let type = req.query.type
  let id = req.query.id

  if (!type || !id) {
    res.status(400)
    return res.json({"err": error_msgs.no_device_type_and_id})
  }

  // Get device from postgres inlcuding token
  pg.getDevice(type, id).then(device => {
    // Generate file
    let auth_token = device.auth_token
    if (auth_token) {
      let obj = {
        "typeId": type,
        "deviceId": id,
        "authToken": auth_token
      }
      device_utils.generate_file(obj).then(file => {
        res.send(file)
      }, err => {
        res.status(500)
        res.json(err)
      })
    } else {
      res.status(404)
      res.json({"err": error_msgs.device_not_found})
    }
  }, err => {
    res.status(500)
    res.json(err)
  })
});

module.exports = router;
