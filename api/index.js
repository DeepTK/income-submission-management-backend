const app = require("../app");
const serverless = require("serverless-http");

const handler = serverless(app, {
  binary: ["*/*"],
  timeout: 30,
});

module.exports = serverless(app);