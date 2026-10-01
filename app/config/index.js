require("dotenv").config();

const config = {
  app: {
    port: process.env.PORT || 5000,
  },
  db: {
    uri: process.env.DATABASE_URL,
  },
};

module.exports = config;
