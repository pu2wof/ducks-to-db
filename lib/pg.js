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
const error_msgs = require('../api/errors.js')
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
const observations_table = 'device_observations';

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

  // Pull out uuid into seperate column
  let uuid = ""
  
  try {
    let payload_obj = JSON.parse(payload.toString('utf-8'))
    if ('uuid' in payload_obj) {
      uuid = payload_obj.uuid
    }
  } catch(err) {
    console.log('Can\'t parse payload into JSON, no UUID added.')
  }
  let sql = `INSERT INTO ${data_table} 
    (event_type, payload, papa_duck_id, uuid, created_at, updated_at)
    VALUES ('${eventType}', '${payload}', '${deviceId}', '${uuid}',
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
    let current_date = new Date().toISOString();
    let sql = `INSERT INTO ${device_table} 
      (device_type, device_id, auth_token, created_at, updated_at) 
      VALUES ('${type}', '${device_id}', '${auth_token}', '${current_date}',
       '${current_date}');`;

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

let checkMessages = (req, res, next) => {
  let ids = req.body.message_ids
  // build sql string for each id
  if (ids.length === 0) {
    return res.json({})
  }
  let ids_str = '('
  ids.forEach(id => {
    ids_str += `'${id}',`
  })
  ids_str = ids_str.slice(0, -1) + ')'
  let sql = `SELECT uuid FROM ${data_table}
    WHERE event_type<>'androidDebug' AND
    uuid IN ${ids_str}`
  
  db.any(sql).then(db_results => {
    let result = {}
    db_results.forEach(dbr => {
      result[dbr.uuid] = 1
    })
    ids.forEach(requested_id => {
      if (!(requested_id in result)) {
        result[requested_id] = 0
      }
    })
    res.json(result)
  }, err => {
    console.log(err)
    res.status(500)
    res.json(err)
  })

}

let insertObservation = (req, res, next) => {
  if (!req.body.observation || !req.body.observation.timestamp ||
    !req.body.observation.device_type || !req.body.observation.device_id || 
    !req.body.observation.latitude || !req.body.observation.longitude) {
    res.status(400)
    return res.json({"err": error_msgs.missing_observation_fields})
  }

  let obs = req.body.observation;
  let current_date = new Date().toISOString();
  let timestamp = req.body.observation.timestamp;
  let device_type = req.body.observation.device_type;
  let device_id = req.body.observation.device_id;
  let latitude = req.body.observation.latitude;
  let longitude = req.body.observation.longitude;

  let sql = `INSERT INTO ${observations_table} 
    (observation_timestamp, device_type, device_id, latitude, 
    longitude, created_at, updated_at) 
    VALUES ('${timestamp}', '${device_type}', '${device_id}', 
    '${latitude}', '${longitude}', '${current_date}',
    '${current_date}');`;
  db.none(sql).then(_ => {
    res.json({"ok": true})
  }, err => {
    console.log(err)
    res.status(500)
    res.json(err)
  })
}

let getLatestObservation = (req, res, next) => {
  if (!req.query.device_type || !req.query.device_id) {
    res.status(400)
    return res.json({"err": error_msgs.no_device_type_and_id})
  }
  let device_type = req.query.device_type;
  let device_id = req.query.device_id;

  // Get all observations for this device type and id and
  // sort by max timestamp

}

module.exports = {
  setup, 
  insertEvent,
  insertDevice,
  deleteDevice,
  getDevice,
  checkMessages,
  insertObservation,
  getLatestObservation
};
