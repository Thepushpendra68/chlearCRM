// Vercel Serverless Function Handler
const serverless = require('serverless-http');
const app = require("../backend/src/app");

module.exports = serverless(app);
