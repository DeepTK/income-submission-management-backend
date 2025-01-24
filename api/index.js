const serverless = require('serverless-http');
const app = require('../app');

const handler = serverless(app, {
  binary: ['*/*'],
  timeout: 30
});

module.exports = handler;
