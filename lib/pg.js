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

let setup = (cert) => {
  return new Promise((resolve, reject) => {
    const config = {
      database: process.env.PG_DATABASE,
      host: process.env.PG_HOST,
      port: process.env.PG_PORT,
      database: process.env.PG_DATABASE,
      user: process.env.PG_USER,
      ssl: {
        rejectUnauthorized: true,
        ca: cert
      },
      password: process.env.PG_PASSWORD
    }
    const db = pgp(config);

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
  let table_name = 'clusterdata';
  let sql = "INSERT INTO "+table_name+" "+
  "(event_type, payload, papa_duck_id, created_at, updated_at)"+
  "VALUES ('"+eventType+"', '"+payload+"', '"+deviceId+"', '"+current_date+"', '"+
  current_date+"');"

  db.none(sql).then(_ => {
    console.log('🦆 '+current_date+': '+eventType+' event received, event: '+payload+'. Inserted to db.')

    // Broadcast to all connected socket.io clients
    payload = payload.toString()
    io.sockets.emit(eventType,payload)
  }).catch(err => {
    console.log(err)
  })
}

module.exports = {
  setup, insertEvent
};
