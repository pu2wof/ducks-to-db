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
const android_debug_table = 'android_debug_messages';
const observations_table = 'device_observations';
const test_reports_table = 'deployment_test_reports';

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
    (event_type, payload, device_type, device_id, uuid, created_at, updated_at)
    VALUES ('${eventType}', '${payload}', '${deviceType}', '${deviceId}', '${uuid}',
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

let insertAndroidDebugEvent = (deviceType, deviceId, eventType, format, payload, io) => {
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
  let sql = `INSERT INTO ${android_debug_table} 
    (from_device_type, from_device_id, uuid, payload, created_at, updated_at)
    VALUES ('${deviceType}', '${deviceId}', '${uuid}', '${payload}',
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

let saveTestReport = (info, results, score_results) => {
  return new Promise((resolve, reject) => {
    let current_date = new Date().toISOString();
    let sql = `INSERT INTO ${test_reports_table}
      (name, results, message_success_rate, created_at, updated_at)
      VALUES ('${info}', '${JSON.stringify(results)}',
      '${JSON.stringify(score_results)}', '${current_date}','${current_date}');`
    console.log(sql)
    db.none(sql).then(_ => {
      resolve({"name": info, "results": results, "message_success_rate": score_results})
    }).catch(err => {
      console.log(err)
      reject(err)
    })
  })
}

let checkMessages = (req, res, next, io) => {
  let ids = req.body.message_ids;
  let info = req.body.name;

  // build sql string for each id
  if (ids.length === 0) {
    return res.json({})
  }
  let ids_str = '('
  ids.forEach(id => {
    ids_str += `'${id}',`
  })
  ids_str = ids_str.slice(0, -1) + ')'
  let sql = `SELECT uuid, payload, created_at FROM ${data_table}
    WHERE uuid IN ${ids_str}
    ORDER BY created_at;`
  
  db.any(sql).then(db_results => {
    let results = []
    let tmp_exists = []
    let hits = {}
    let hit = 0;
    let miss = 0;
    db_results.forEach(dbr => {
      let time = String(new Date(dbr.created_at).getTime())
      tmp_exists.push(dbr.uuid)
      let obj = {
        "uuid": dbr.uuid,
        "received": 1, 
        "path": dbr.payload.path, 
        "received_at": time
      }
      if (!(dbr.uuid in hits)) {
        hits[dbr.uuid] = 1
      }
      results.push(obj)
    })
    ids.forEach(requested_id => {
      if (!(tmp_exists.includes(requested_id))) {
        let obj = {
          "uuid": requested_id,
          "received": 0, 
          "path": [],
          "received_at": ""
        }
        miss += 1
        results.push(obj)
      }
    })
    let hit_score = 0+"%"
    let hits_length = Object.keys(hits).length;

    if ((hits_length + miss) > 0) {
      hit_score = (hits_length / (hits_length + miss)*100)+"%"
    }
    let score_results = {
      "hit_score": hit_score,
      "hits": hits_length,
      "miss": miss,
      "total": hits_length + miss
    }

    // save test report
    saveTestReport(info, results, score_results).then(report => {
      io.sockets.emit("new-test-report",JSON.stringify(report))
      res.json(report)
    }, err => {
      res.status(500)
      res.json(err)
    })
  }, err => {
    console.log(err)
    res.status(500)
    res.json(err)
  })
}

let insertObservation = (eventType, payload, io) => {
  return new Promise((resolve, reject) => {
    let parsed_obs = ""
    try {
       parsed_obs = JSON.parse(payload);
    } catch (err) {
      return reject(err)
    }
    if (parsed_obs === "") {
      console.log();
      return reject({"error": "observation could not be defined"})
    }
    if (!parsed_obs || !parsed_obs.timestamp ||
      !parsed_obs.deviceType || !parsed_obs.deviceID || 
      !parsed_obs.latitude || !parsed_obs.longitude) {
      return reject({"err":error_msgs.missing_observation_fields, "status": 400})
    }

    let current_date = new Date().toISOString();
    let sent_timestamp = parseInt(parsed_obs.timestamp);
    let timestamp = new Date(sent_timestamp).toISOString();
    parsed_obs.timestamp = timestamp
    let device_type = parsed_obs.deviceType;
    let device_id = parsed_obs.deviceID;
    let latitude = parsed_obs.latitude;
    let longitude = parsed_obs.longitude;

    let sql = `INSERT INTO ${observations_table} 
      (observation_timestamp, device_type, device_id, latitude, 
      longitude, created_at, updated_at) 
      VALUES ('${timestamp}', '${device_type}', '${device_id}', 
      '${latitude}', '${longitude}', '${current_date}',
      '${current_date}');`;
    db.none(sql).then(_ => {
      // Broadcast to all connected socket.io clients
      parsed_obs_str = JSON.stringify(parsed_obs)
      io.sockets.emit(eventType,parsed_obs_str)
      resolve()
    }, err => {
      console.log(err)
      reject({"err":err, "status": 500})
    })
  })
}

let getLatestObservation = (req, res, next) => {
  if (!req.query.deviceType || !req.query.deviceID) {
    res.status(400)
    return res.json({"err": error_msgs.no_device_type_and_id})
  }
  let device_type = req.query.deviceType;
  let device_id = req.query.deviceID;

  // Get all observations for this device type and id and
  // sort by max timestamp
  let sql = `SELECT DISTINCT ON (observation_timestamp) 
    observation_timestamp, device_type, device_id, latitude, longitude
    FROM ${observations_table}
    WHERE device_type='${device_type}'
    AND device_id='${device_id}'
    ORDER BY observation_timestamp DESC;`;

  db.any(sql).then(result => {
    if (result.length === 0) {
      res.json({})
    } else {
      res.json(result[0])
    }
  }, err => {
    res.status(500);
    res.json(err);
  })
}

let traceObservations = (req, res, next) => {
  if (!req.query.deviceType || !req.query.deviceID) {
    res.status(400)
    return res.json({"err": error_msgs.no_device_type_and_id})
  }
  let device_type = req.query.deviceType;
  let device_id = req.query.deviceID;
  // Get all observations for this device type and id
  let sql = `SELECT * FROM ${observations_table}
    WHERE device_type='${device_type}'
    AND device_id='${device_id}';`;

  db.any(sql).then(result => {
    res.json(result)
  }, err => {
    res.status(500);
    res.json(err);
  })
}

module.exports = {
  setup, 
  insertEvent,
  insertDevice,
  deleteDevice,
  getDevice,
  checkMessages,
  insertObservation,
  getLatestObservation,
  traceObservations,
  insertAndroidDebugEvent
};
