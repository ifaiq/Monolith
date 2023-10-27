/* eslint-disable max-len */
const { test_mysql } = require("../../utils/keys");

module.exports = {
  datastores: {
    default: {
      adapter: "sails-mysql",
      url: `mysql://${test_mysql.user}:${test_mysql.password}@${test_mysql.host}:${test_mysql.port}/${test_mysql.database}`,
      charset: "utf8mb4",
      connectTimeout: 60 * 60 * 1000,
      acquireTimeout: 60 * 60 * 1000,
      timeout: 60 * 60 * 1000,
    },
    readReplica: {
      adapter: "sails-mysql",
      url: `mysql://${test_mysql.user}:${test_mysql.password}@${test_mysql.host}:${test_mysql.port}/${test_mysql.database}`,
      charset: "utf8mb4",
      connectTimeout: 60 * 60 * 1000,
      acquireTimeout: 60 * 60 * 1000,
      timeout: 60 * 60 * 1000,
    },
  },

  models: {
    migrate: "safe",
  },

  // blueprints: {
  //   shortcuts: false,
  // },

  security: {
    cors: {
      allowOrigins: "*",
    },
  },

  session: {
    cookie: {
      // secure: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  },
  sockets: {
    onlyAllowOrigins: [],
  },

  http: {
    cache: 365.25 * 24 * 60 * 60 * 1000, // One year
    trustProxy: true,
  },

  port: 8090,
};

