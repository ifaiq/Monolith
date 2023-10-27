const { mysql } = require("../../utils/keys");

module.exports = {
  datastores: {
    default: {
      adapter: "sails-mysql",
      url: `mysql://${mysql.user}:${mysql.password}@${mysql.host}:${mysql.port}/${mysql.database}`,
      charset: 'utf8mb4'
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
