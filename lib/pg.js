// Decode Postgres certificate
const cert_b64 = process.env.PG_CERT_BASE_64
const cert_buffer = new Buffer(cert_b64, 'base64');  
const cert_ascii = cert_buffer.toString('ascii');
const init_options = {
  error: function (error, e) {
    if (e.cn) {
      // A connection-related error;
      console.log("CN:", e.cn);
      console.log("EVENT:", error.message);
      process.exit(1)
    }
  }
};

const pgp = require('pg-promise')(init_options);
const config = {
  database: process.env.PG_DATABASE,
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  database: process.env.PG_DATABASE,
  user: process.env.PG_USER,
  ssl: {
    rejectUnauthorized: true,
    ca: cert_ascii
  },
  password: process.env.PG_PASSWORD
}
const db = pgp(config);
const device_table = 'devices';
const data_table = 'clusterdata';

let setup = () => {
  return new Promise((resolve, reject) => {
    // Test connection
    db.connect().then(obj => {
      console.log('Connected to Postgres DB at: '+config.host)
      // Release the connection
      obj.done();
      resolve(db);
    }, err => {
      reject(err)
    })
  })
}

// Insert a papa-duck event into the database
let insertEvent = (deviceType, deviceId, eventType, format, payload, io) => {
  let current_date = new Date().toISOString();
  let sql = `INSERT INTO ${data_table} 
    (event_type, payload, papa_duck_id, created_at, updated_at)
    VALUES ('${eventType}', '${payload}', '${deviceId}',
    '${current_date}', '${current_date}');`

  db.none(sql).then(_ => {
    let log_msg = `🦆 ${current_date}: ${eventType} event received, event: ${payload}. Inserted to db.`
    console.log(log_msg)

    // Broadcast to all connected socket.io clients
    payload = payload.toString()
    io.sockets.emit(eventType,payload)
  }).catch(err => {
    console.log(err)
  })
}

let insertDevice = (wiot_result) => {
  return new Promise((resolve, reject) => {
    let type = wiot_result.typeId;
    let device_id = wiot_result.deviceId;
    let auth_token = wiot_result.authToken;
    let sql = `INSERT INTO ${device_table} 
      (device_type, device_id, auth_token) 
      VALUES ('${type}', '${device_id}', '${auth_token}');`;

    db.none(sql).then(_ => {
      resolve()
    }).catch(err => {
      console.log(err)
      reject(err)
    })
  })
}

let deleteDevice = (device_type, device_id) => {
  return new Promise((resolve, reject) => {
    let sql = `DELETE FROM ${device_table} 
      WHERE device_type = '${device_type}'
      AND device_id = '${device_id}';`
    db.none(sql).then(_ => {
      resolve()
    }).catch(err => {
      console.log(err)
      reject(err)
    })
  })
}

let getDevice = (device_type, device_id) => {
  return new Promise((resolve, reject) => {
    let sql = `SELECT * FROM ${device_table}
      WHERE device_type = '${device_type}'
      AND device_id = '${device_id}';`
    db.one(sql).then(resp => {
      resolve(resp)
    }, err => {
      console.log(err)
      reject(err)
    })
  })
}

module.exports = {
  setup, 
  insertEvent,
  insertDevice,
  deleteDevice,
  getDevice
};
