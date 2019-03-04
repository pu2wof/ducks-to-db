module.exports = function (app) {
  'use strict';

  // Base route
  app.get('/', (req, res, next) => {
    res.json({"running": true})
  })

  app.use('/api/devices', require('./devices'));
};