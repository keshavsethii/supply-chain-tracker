// Loads .env.<NODE_ENV> (falls back to .env). Shared by every script and the server.
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const mode = process.env.NODE_ENV || 'development';
const file = path.join(__dirname, '..', `.env.${mode}`);
if (fs.existsSync(file)) dotenv.config({ path: file });
else dotenv.config();

module.exports = { mode, envFile: file };
