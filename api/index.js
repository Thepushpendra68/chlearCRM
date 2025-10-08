// Vercel Serverless Function Wrapper for Express Backend
// This file allows the entire Express app to run on Vercel

const app = require('../backend/src/app');

module.exports = app;
