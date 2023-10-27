/* eslint-disable no-process-exit */
/* eslint-disable no-console */
/* eslint-disable max-len */

process.env.NODE_ENV = "test";

const redis = require("ioredis");
const sails = require("sails");
const nock = require("nock");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const dotenv = require("dotenv");
dotenv.config();

const HOOK_TIMEOUT = 240000;
const { request } = require("./common-imports");
const redisClient = redis.createClient({ host: process.env.REDIS_SERVER });

before(async function () {
  try {
    this.timeout(300000);
    const createDatabaseCommand = `MYSQL_FLAGS='-CONNECT_WITH_DB' db-migrate db:create ${process.env.TEST_DB_NAME} --config config/database.json -e test`;
    const runMigrationsCommand = `db-migrate up --config config/database.json -e test`;

    const databaseCreationResponse = await exec(createDatabaseCommand);
    console.log(`✅`, databaseCreationResponse.stdout.trim());

    const migrationExecutionResponse = await exec(runMigrationsCommand);
    console.log(`✅`, migrationExecutionResponse.stdout.trim());

    sails.lift(
      {
        hooks: { grunt: false },
        log: { level: "info" },
      },
      async err => {
        if (err) {
          console.log(`❌ Error occurred while lifting Sails app: ${err}`);
          process.exit(5);
        }
      },
    );
  } catch (err) {
    console.log(`❌ Before all hook failed: ${err}`);
    process.exit(5);
  }


  Object.defineProperties((request).Test.prototype, {
    _assert: {
      value: (request).Test.prototype.assert,
    },
    assert: {
      value: function (resError, res1, fn) {
        this._assert(resError, res1, (err, res) => {
          if (err) {
            const originalMessage = err.message;
            err.message = `${err.message}\nstatus: ${res.status}\nresponse: ${JSON.stringify(res.body, null, 2)}`;
            // Must update the stack trace as what supertest prints is the stacktrace
            err.stack = err.stack?.replace(originalMessage, err.message);
          }
          fn.call(this, err, res);
        });
      },
    },
  });

  nock(process.env.MONOLITHIC_SERVICE, {
    allowUnmocked: true,
    reqheaders: {
      authorization: header => (authHeader = header) && true,
    },
  })
    .persist()
    .post("/useridentity/generate-token")
    .query(true)
    .reply(200, () => ({
      code: "OK",
      message: "Operation is successfully executed",
      userMessage: "Token successfully created",
      token: authHeader,
    }));

  nock(`${process.env.MONOLITHIC_SERVICE}`, { allowUnmocked: true })
    .persist()
    .get("/config/businessunit/4")
    .query(true)
    .reply(200, {
      message: "Operation is successfully executed",
      code: "OK",
      keyName: "data",
      success: true,
      data: {
        createdAt: "2022-10-07T06:49:43.005Z",
        updatedAt: "2022-10-07T06:49:43.005Z",
        id: 4,
        name: "Karachi",
        disabled: false,
        companyId: 4,
        currency: "PKR",
      },
    });

  nock(`${process.env.MONOLITHIC_SERVICE}`, { allowUnmocked: true })
    .persist()
    .get("/config/location/194")
    .query(true)
    .reply(200, {
      message: "Operation is successfully executed",
      code: "OK",
      keyName: "data",
      success: true,
      data: {
        createdAt: "2020-06-24T15:14:04.000Z",
        updatedAt: "2022-07-18T13:46:54.000Z",
        id: 194,
        deletedAt: null,
        name: "Dua Store",
        phone: null,
        disabled: true,
        longitude: "65.88308482852288",
        latitude: "29.477127543826327",
        radius: "1787935.7737106362",
        imageUrl: "",
        serviceChargeType: "FLAT",
        serviceChargeValue: "0.00",
        deliveryChargeType: "FLAT",
        deliveryChargeValue: "0.00",
        companyId: 4,
        businessUnitId: 4,
        polygonCoords: null,
        minOrderLimit: "10.00",
        maxOrderLimit: null,
        freeDeliveryLimit: "150.00",
        priority: null,
        warehouseAddress: null,
        advanceBookableDays: 0,
        defaultCutOff: -24,
      },
    });
  nock(`${process.env.MONOLITHIC_SERVICE}`, { allowUnmocked: true })
    .persist()
    .get("/config/location/13")
    .query(true)
    .reply(200, {
      message: "Operation is successfully executed",
      code: "OK",
      keyName: "data",
      success: true,
      data: {
        createdAt: "2020-06-24T15:14:04.000Z",
        updatedAt: "2022-07-18T13:46:54.000Z",
        id: 13,
        deletedAt: null,
        name: "Dua Store",
        phone: null,
        disabled: true,
        longitude: "65.88308482852288",
        latitude: "29.477127543826327",
        radius: "1787935.7737106362",
        imageUrl: "",
        serviceChargeType: "FLAT",
        serviceChargeValue: "0.00",
        deliveryChargeType: "FLAT",
        deliveryChargeValue: "0.00",
        companyId: 4,
        businessUnitId: 4,
        polygonCoords: null,
        minOrderLimit: "10.00",
        maxOrderLimit: null,
        freeDeliveryLimit: "10.00",
        priority: null,
        warehouseAddress: null,
        advanceBookableDays: 0,
        defaultCutOff: -24,
      },
    });
}, HOOK_TIMEOUT);

after(async () => {
  nock.cleanAll();

  try {
    sails.lower(err => {
      if (err) {
        process.exit(5);
      }
    });

    const dropDatabaseCommand = `db-migrate db:drop ${process.env.TEST_DB_NAME} --config config/database.json -e test`;
    await exec(dropDatabaseCommand);
  } catch (err) {
    console.log(`❌ Error occured while dropping the database: ${err}`);
    process.exit(5);
  }
}, HOOK_TIMEOUT);


afterEach(async () => {
  try {
    redisClient.flushall(); // clearing redis

    const tables = [
      "products",
      "categories",
      "liked_products_customer_junction",
      "product_audit_history",
      "product_categories_junction",
      "volume_based_product_price",
      "delivery_slots",
      "delivery_slots_audit_history",
      "order_items",
      "order_status_history",
      "order_history",
      "orders",
    ];

    for (const table of tables) {
      await sails.sendNativeQuery(`DELETE FROM ${table} where id != 0`);
    }

    for (const table of tables) {
      await sails.sendNativeQuery(`ALTER TABLE ${table} AUTO_INCREMENT = 1`)
    }

    
  } catch (ex) {
    console.log("❌ afterEach failed", ex);
    process.exit(5);
  }
}, HOOK_TIMEOUT);
