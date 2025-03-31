const envalid = require("envalid");
const { str } = envalid;

function validateEnv() {
  const env = envalid.cleanEnv(process.env, {
    JWT_SECRET: str({ desc: "JWT secret key" }),
  });
  return env;
}

module.exports = validateEnv;
