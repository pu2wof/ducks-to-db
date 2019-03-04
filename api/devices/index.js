var express = require('express');
var bodyParser = require('body-parser');

var router = express.Router();
router.use(bodyParser.json());

// Get all the devices currently registered
router.get('/', (req,res,next) => {
  // 

});


// Create a device
router.post('/', (req, res, next) => {
  // Create in watson iot

  // Save device credentials in postgres

  // Generate file URL

});


// Delete a device id
router.delete('/:device_id', (req, res, next) => {

});


// Create .ino file for device_id
router.get('/file/:device_id', (req, res, next) => {

});


module.exports = router;
