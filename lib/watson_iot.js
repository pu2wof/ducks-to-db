const Client = require('ibmiotf');
const config = {
  "org": process.env.WIOT_ORG,
  "id": 'ducks-to-db',
  "domain": process.env.WIOT_DOMAIN,
  "auth-key": process.env.WIOT_API_KEY,
  "auth-token": process.env.WIOT_TOKEN,
  "type": "shared"
}

const wiot = new Client.IotfApplication(config);

let setup = () => {
  return new Promise((resolve, reject) => {
    wiot.connect();
    wiot.on("connect", function () {
      console.log('Connected to Watson IoT at: '+config.org+'.'+config.domain)
      resolve(wiot)
    });

    wiot.on("error", function (err) {
      reject(err)
    });
  })
}

module.exports = {
  setup
}
