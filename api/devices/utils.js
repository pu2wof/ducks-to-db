let rp = require('request-promise');

// URL for papa duck .ino file
let papa_duck_url = 'https://raw.githubusercontent.com/Project-Owl/duck/master/ClusterDuck/papa.ino'

// Generate a .ino file for a device
let generate_file = (wiot_result) => {
  return new Promise((resolve, reject) => {
    let type = wiot_result.typeId;
    let device_id = wiot_result.deviceId;
    let auth_token = wiot_result.authToken;

    rp(papa_duck_url).then(base_ino_file => {
      // replace ino file with credentials
      // org regex
      base_ino_file = base_ino_file.replace(/(#define ORG\s+?"|')(.+?)("|')(\s*)/g, 
        "$1"+process.env.WIOT_ORG+"$3$4");

      // device id regex
      base_ino_file = base_ino_file.replace(/(#define DEVICE_ID\s+?"|')(.+?)("|')(\s*)/g, 
        "$1"+device_id+"$3$4");

      // device type regex
      base_ino_file = base_ino_file.replace(/(#define DEVICE_TYPE\s+?"|')(.+?)("|')(\s*)/g, 
        "$1"+type+"$3$4");

      // token regex
      base_ino_file = base_ino_file.replace(/(#define TOKEN\s+?"|')(.+?)("|')(\s*)/g, 
        "$1"+auth_token+"$3$4");

      resolve(base_ino_file)
    }, err => {
      console.log(err)
      reject(err)
    })
  })
}

module.exports = {
  generate_file
}