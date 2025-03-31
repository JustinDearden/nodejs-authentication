// Determine which data store to use based on the DATASTORE environment variable.
const dataStore = process.env.DATASTORE;

let userStore;

if (dataStore === "redis") {
    userStore = require("./userRedisStore");
} else {
    userStore = require("./userPostgresStore");
}

module.exports = userStore;
