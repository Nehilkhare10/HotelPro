// Lightweight JSON-file database (no external DB server needed).
// Great for running the project instantly in VS Code / for a demo.
// Swap this out for MongoDB/Postgres later if you want to productionize it.
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');

const adapter = new FileSync(path.join(__dirname, 'data', 'db.json'));
const db = low(adapter);

db.defaults({
  users: [],
  rooms: [],
  guests: [],
  bookings: [],
  payments: []
}).write();

module.exports = db;
