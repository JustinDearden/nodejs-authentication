const envalid = require("envalid");
const { makeValidator } = envalid;

// Custom validator to ensure a string is non-empty
const nonemptystr = makeValidator((x) => {
  if (typeof x !== "string" || x.trim() === "") {
    throw new Error("Expected a non-empty string");
  }
  return x;
});

// Validates that environment variables are present and non-empty.
function validateEnv() {
  return envalid.cleanEnv(process.env, {
    JWT_SECRET: nonemptystr({
      desc: "JWT secret key.",
    }),
    DATASTORE: nonemptystr({
      desc: "Determines primary data store.",
    }),
  });
}

module.exports = validateEnv;
