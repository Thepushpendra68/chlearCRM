// Vercel Serverless Function Handler
// This file wraps the Express app for Vercel deployment

const app = require("../backend/src/app");

// Export the Express app as a Vercel serverless function handler
module.exports = (req, res) => {
  app(req, res);
};
