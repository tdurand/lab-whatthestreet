const express = require('express')
const basicAuth = require('express-basic-auth')
const next = require('next')
const compression = require('compression');
const bodyParser = require('body-parser');
const router = require('./api/router');

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare()
.then(() => {
  const server = express()

  // API routes
  server.use(bodyParser.urlencoded({ extended: true }));
  server.use(bodyParser.json());
  server.use(compression());

  // Credentials allowed
  server.use(basicAuth({
    users: {
      moovellab: "moovellab"
    },
    challenge: true,
    realm: 'what_the_street'
  }));

  server.get('/about', (req, res) => {
    console.log('handled by /about');
    return app.render(req, res, '/about', req.query);
  })

  server.get('/:cityName/explore/:vehicleType/:areaType/:itemId', (req, res) => {
    console.log('handled by /:cityName/explore/:vehicleType/:areaType/:itemId');
    return app.render(req, res, '/map', req.query);
  })

  server.get('/:cityName/explore/:vehicleType', (req, res) => {
    console.log('handled by /:cityName/explore/:vehicleType');
    return app.render(req, res, '/explore', req.query);
  })

  server.get('/:cityName/explore', (req, res) => {
    console.log('handled by /:cityName/explore');
    return app.render(req, res, '/explore', req.query);
  })

  server.get('/:cityName/results', (req, res) => {
    console.log('handled by /:cityName/results');
    return app.render(req, res, '/results', req.query);
  })

  server.get('/:cityName', (req, res) => {
    console.log('handled by /:cityName');
    return app.render(req, res, '/', req.query);
  })

  server.use('/api/v1', router);

  server.get('*', (req, res) => {
    console.log('handled by next.js *');
    return handle(req, res)
  })

  server.listen(process.env.PORT || 4000, (err) => {
    if (err) throw err
    console.log(`> Ready on http://localhost:${process.env.PORT || 4000}`)
  })
})
