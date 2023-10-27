// TODO Remove redis configuration from this file and we should create redis configuration in seperate file e.g redisConfig.
// Redis configs
const redis = require("ioredis");
if (process.env.REDIS_SERVER) {
  var client = redis.createClient({ host: process.env.REDIS_SERVER });
} else {
  var client = redis.createClient();
}

const lock = require("redis-lock")(client);

console.log("assigning key:");
client.set("test", "test");
console.log("assigned:");
client.keys("test", redis.print);

module.exports.globalConf = {
  AWS_ACCOUNT_ID: process.env.AWS_ACCOUNT_ID || "718230964299",
  AWS_KEY: process.env.AWS_KEY || "AKIA2OOPGZBF4JXNR2P5",
  AWS_SECRET: process.env.AWS_SECRET || "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",
  AWS_REGION: process.env.AWS_REGION || "me-south-1",
  AWS_BUCKET: process.env.AWS_BUCKET || "dev-retailo-images-bucket",
  // TODO need to remove the redisLock and redisClient
  redisLock: lock, // for redis lock
  redisClient: client, // for redis client
  redisEnv: "TEST_" + process.env.NODE_ENV,
  redisServer: process.env.REDIS_SERVER,
  // TODO: Need to add in env
  ODOO_HOST: process.env.ODOO_HOST || "https://mario-technologies-master-staging-2127823.dev.odoo.com/",
  ODOO_PASSWORD: process.env.ODOO_PASSWORD || "shamas05",
  ODOO_USERNAME: process.env.ODOO_USERNAME || "sahmed@comstarusa.com",
  ODOO_DB_NAME: process.env.ODOO_DB_NAME || "mario-technologies-master-staging-2127823",
  ODOO_ADD_PRODUCT_FEATURE: process.env.ODOO_ADD_PRODUCT_FEATURE || false,
  ODOO_CREATE_SALE_ORDER_FEATURE: process.env.ODOO_CREATE_SALE_ORDER_FEATURE || false,
  ODOO_CREATE_RETURN_ORDER_FEATURE: process.env.ODOO_CREATE_RETURN_ORDER_FEATURE || false,
  ODOO_PRODUCT_SYNC_FEATURE: process.env.ODOO_PRODUCT_SYNC_FEATURE || false,
  AWS_SQS_HOST: process.env.AWS_SQS_HOST || "https://sqs.me-south-1.amazonaws.com/",
  AWS_SES_EMAIL: process.env.AWS_SES_EMAIL || "operations@retailo.co",
  ODOO_INVENTORY_SYNC_SQS_HOST: process.env.ODOO_INVENTORY_SYNC_SQS_HOST || "https://sqs.me-south-1.amazonaws.com/",
  ODOO_INVENTORY_SYNC_SQS_NAME: process.env.ODOO_INVENTORY_SYNC_SQS_NAME || "stage-odoo-inventory-sync",
  EOCEAN_SMS_SQS_NAME: process.env.EOCEAN_SMS_SQS_NAME || "stage-eocean-sms-queue",
  EOCEAN_SMS_FORWARDER: process.env.EOCEAN_SMS_FORWARDER || true,
  ELASTIC_APP_SEARCH_HOST: process.env.APP_SEARCH_EP,
  ELASTIC_APP_SEARCH_PRIVATE_KEY: process.env.APP_SEARCH_KEY,
  ELASTIC_APP_SEARCH_ENGINE: process.env.APP_SEARCH_ENGINE,
  JWT_PUBLIC_KEY: process.env.JWT_PUBLIC_KEY,
  // Set Products limit for Recommended Product list
  RECOMMENDED_PRODUCT_LIMIT: process.env.RECOMMENDED_PRODUCT_LIMIT,
  ODOO_RETRY_SQS_NAME: process.env.ODOO_RETRY_SQS_NAME || "stage-odoo-retry-queue",
  SMS_SERVICE_HOST: process.env.SMS_SERVICE_HOST || "https://devsms.retailo.me",
  IS_PAYMENTS_ENABLED: process.env.IS_PAYMENTS_ENABLED || "false",
  PAYMENT_WALLET_URL: process.env.PAYMENT_WALLET_URL || "https://dev.retailo.me/paymentwallet",
  BNPL_WALLET_URL: process.env.BNPL_WALLET_URL || "https://dev.retailo.me/wallet",
  USER_SERVICE_URL: process.env.USER_SERVICE_URL || "https://dev.retailo.me/user",
  OTP_SERVICE_URL: process.env.OTP_SERVICE_URL || "https://dev.retailo.me/otp",
  API_KEY: process.env.API_KEY || "test",
  MOV_LIMIT_BYPASSED: JSON.parse(process.env.MOV_LIMIT_BYPASSED || false),
  MONOLITH_TO_STOCKFLO_PRODUCT_INVENTORY_SYNC_QUEUE_NAME: process.env.MONOLITH_TO_STOCKFLO_PRODUCT_INVENTORY_SYNC_QUEUE_NAME || "dev-warehousing-monolith-to-stockflo-inventory-sync-sqs",
  STOCKFLO_TO_MONOLITH_PRODUCT_INVENTORY_SYNC_QUEUE_NAME: process.env.STOCKFLO_TO_MONOLITH_PRODUCT_INVENTORY_SYNC_QUEUE_NAME || "dev-warehousing-stockflo-to-monolith-inventory-sync-sqs",
  IS_TAXATION_ENABLED: process.env.IS_TAXATION_ENABLED === "true" ? true : false,
  PRICING_ENGINE_SQS_NAME: process.env.PRICING_ENGINE_SQS_NAME || "dev-dynamic-pricing-queue",
  PRICING_ENGINE_RETRY_SQS_NAME: process.env.PRICING_ENGINE_RETRY_SQS_NAME || "dev-dynamic-pricing-retry-queue",
  DYNAMIC_PRICING_FEATURE_FLAG: parseInt(process.env.DYNAMIC_PRICING_FEATURE_FLAG || 1),
  MOV_FEATURE_FLAG: parseInt(process.env.MOV_FEATURE_FLAG || 1),
  IS_INVOICING_SYNC_ENABLED: process.env.IS_INVOICING_SYNC_ENABLED === "true" ? true : false,
  GENERATE_SERIAL_FROM_INVOICING_SVC: process.env.GENERATE_SERIAL_FROM_INVOICING_SVC === "true" ? true : false
};

console.log("AFTER INIT REDIS ENV " + this.globalConf.redisEnv);
