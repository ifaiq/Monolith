require("dotenv").config();
module.exports = {
  mysql: {
    host: process.env.DB_ADDRESS || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "test",
    password: process.env.DB_PASSWORD || "test",
    database: process.env.DB_NAME || "hypr",
    read_replica: process.env.READ_REPLICA || "test",
    read_replica_db: process.env.READ_REPLICA_DB || "hypr",
  },
  test_mysql: {
    host: process.env.TEST_DB_ADDRESS,
    port: process.env.TEST_DB_PORT,
    user: process.env.TEST_DB_USER,
    password: process.env.TEST_DB_PASSWORD,
    database: process.env.TEST_DB_NAME,
  },
  mongo: {
    host: process.env.MONGO_DB_ADDRESS || "localhost",
    port: process.env.MONGO_DB_PORT || 27017,
    user: process.env.MONGO_DB_USER || "",
    password: process.env.MONGO_DB_PASSWORD || "",
    database: process.env.MONGO_DB_NAME || "testDb",
    read_replica: process.env.MONGO_READ_REPLICA || "test",
    read_replica_db: process.env.MONGO_READ_REPLICA_DB || "hypr",
  },
  secret: process.env.secret || "c6aSsUzQBACrdWoWy6g7BkuxwKfkPbmB",
  topic_arn: process.env.TOPIC_ARN || "arn:aws:sns:me-south-1:718230964299:Test_alerts",
  topic_region: process.env.TOPIC_REGION || "me-south-1",
  invoice_topic_arn: process.env.INVOICE_TOPIC_ARN
};
