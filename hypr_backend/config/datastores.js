const { mysql, mongo } = require("../utils/keys");

module.exports.datastores = {
  default: {
    adapter: "sails-mysql",
    url: `mysql://${mysql.user}:${mysql.password}@${mysql.host}:${mysql.port}/${mysql.database}`,
    charset: "utf8mb4",
  },
  readReplica: {
    adapter: "sails-mysql",
    url: `mysql://${mysql.user}:${mysql.password}@${mysql.read_replica}:${mysql.port}/${mysql.read_replica_db}`,
    charset: "utf8mb4",
  },
  // mongodatabase: {
  //   adapter: require('sails-mongo'),
  //   /**
  //    * Uncomment connection string for local dvelopment
  //    */
  //   // url:`mongodb+srv://test:1234@mongodbstore.8qzmx.mongodb.net/recommendedDB?retryWrites=true&w=majority`,
  //   url: `mongodb://${mongo.user}:${mongo.password}@${mongo.host}:${mongo.port}/${mongo.database}`,
  // },	
};
