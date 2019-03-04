let express = require('express');
let bodyParser = require('body-parser');
let router = express.Router();
let wiot = require('../../lib/watson_iot.js')
let pg = require('../../lib/pg.js')

router.use(bodyParser.json());

// Get all the device types and devices currently registered
router.get('/', wiot.get_device_types);
router.get('/:device_type', wiot.get_devices)


// Create a device
router.post('/', (req, res, next) => {

  let device = req.body.device
  if (!device.type || !device.id) {
    res.status(400)
    return res.json({"err": "Please specify a device type or id"})
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
        device.info, device.location, device.meta_data).then(result => {
          // Save device credentials in postgres
          pg.insertDevice(result).then(pg_result => {
            // Generate file URL
            let url = req.protocol + '://' + req.get('host') 
              + req.baseUrl + '/file/'+device.id
            res.json({"result": "created", "arduino_url": url})
          }, handle_err)
        }, handle_err)
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


// Delete a device id
router.delete('/:device_id', (req, res, next) => {

});


// Create .ino file for device_id
router.get('/file/:device_id', (req, res, next) => {

});


module.exports = router;
