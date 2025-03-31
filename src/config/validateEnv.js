const envalid = require("envalid");
const { str } = envalid;

function validateEnv() {
  const env = envalid.cleanEnv(process.env, {
    JWT_SECRET: str({ desc: "JWT secret key" }),
    DATASTORE: str({ desc: "Determines the primary data store" }),
  });
  return env;
}

module.exports = validateEnv;
