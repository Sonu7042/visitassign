require('dotenv').config();

const app = require('../src/app');
const connectDB = require('../src/config/db');

let dbReady = null;

module.exports = async (req, res) => {
  if (!dbReady) {
    dbReady = connectDB();
  }

  await dbReady;
  return app(req, res);
};
