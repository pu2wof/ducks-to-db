module.exports = function (app) {
  'use strict';

  // Base route
  const base = '/api'
  app.get(base, (req, res, next) => {
    res.json({"running": true})
  })

  // Devices
  app.use(base+'/devices', require('./devices'));
};