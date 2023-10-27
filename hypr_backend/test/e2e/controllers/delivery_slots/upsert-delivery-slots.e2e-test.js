/* eslint-disable max-len */

const { request, expect } = require("../../common-imports");
const {
  authTokens: {
    CONSUMER_TOKEN,
    SALES_AGENT_TOKEN,
    SUPER_ADMIN_TOKEN,
    ADMIN_TOKEN,
  },
  constants: { TEST_TIMEOUT, prefix, v1 },
} = require("../../constants");

const deliverySlotsService = "delivery-slots";
const upsertApiEndpoint = `/${prefix}/${v1}/${deliverySlotsService}`;
const getApiForConsumerEndpoint = `/${prefix}/${v1}/${deliverySlotsService}`;
const getApiForPortalEndpoint = `/${prefix}/${v1}/${deliverySlotsService}/portal`;

const {
  upsertDeliverySlotsData: {
    deliverySlots,
    getActiveDeliverySlotsForConsumer,
    createDeliverySlots,
    upsertDeliverySlots,
    expectedUpsertApiResponse,
    expectedCreatedDeliverySlotsLogs,
    expectedUpsertDeliverySlotsLogs,
    deliverySlotsAuditHistoryColumns,
  },
} = require("./test_data");

describe("api/v1/delivery-slots (PUT)", () => {
  it("should respond with Unauthorized (401) if no token is provided", async () => {
    await request(sails.hooks.http.app).put(upsertApiEndpoint).expect(401);
  });

  it("should respond with Unauthorized (401) on consumer token", async () => {
    await request(sails.hooks.http.app)
      .put(upsertApiEndpoint)
      .set("Authorization", CONSUMER_TOKEN)
      .expect(401);
  });

  it("should respond with Unauthorized (401) on sales agent token", async () => {
    await request(sails.hooks.http.app)
      .put(upsertApiEndpoint)
      .set("Authorization", SALES_AGENT_TOKEN)
      .expect(401);
  });

  it("should respond with Unauthorized (401) on company owner (role 9) token", async () => {
    await request(sails.hooks.http.app)
      .put(upsertApiEndpoint)
      .set("Authorization", ADMIN_TOKEN)
      .expect(401);
  });

  it(
    "should respond with Bad request (400) for super admin if request body is not passed",
    async () => {
      const response = await request(sails.hooks.http.app)
        .put(upsertApiEndpoint)
        .set("Authorization", SUPER_ADMIN_TOKEN);

      expect(response.status).to.equal(400);
      expect(response.body).to.deep.equalInAnyOrder({
        success: false,
        code: "E_BAD_REQUEST",
        message:
          "\"body.deliverySlots\" is required. \"body.locationId\" is required",
        userMessage: "Something is amiss, Please try with different parameters",
        data: {},
      });
    },
    TEST_TIMEOUT,
  );

  it(
    "should create new delivery slot(s) for the provided location and create logs",
    async () => {
      const locationId = 194;
      const response = await request(sails.hooks.http.app)
        .put(upsertApiEndpoint)
        .send({ deliverySlots, locationId })
        .set("Authorization", SUPER_ADMIN_TOKEN);

      expect(response.status).to.equal(200);
      expect(response.body).to.deep.equalInAnyOrder({
        code: "OK",
        message: "Operation is successfully executed",
        userMessage: "Your request has been processed successfully",
        data: {},
        success: true,
      });

      const createdDeliverySlots = await request(sails.hooks.http.app)
        .get(getApiForConsumerEndpoint)
        .query({ locationId })
        .set("Authorization", SUPER_ADMIN_TOKEN);

      const query = `SELECT ${deliverySlotsAuditHistoryColumns} FROM delivery_slots_audit_history WHERE location_id = ${locationId};`;
      const createdLogsRawPacket = (await sails.sendNativeQuery(query))?.rows;
      const createdLogsJson = Object.values(
        JSON.parse(JSON.stringify(createdLogsRawPacket)),
      );

      expect(createdLogsJson).to.deep.equal(expectedCreatedDeliverySlotsLogs);
      expect(createdDeliverySlots.body).to.deep.equalInAnyOrder({
        code: "OK",
        message: "Operation is successfully executed",
        userMessage: "Your request has been processed successfully",
        data: {
          deliverySlots: getActiveDeliverySlotsForConsumer,
        },
        success: true,
      });
    },

    TEST_TIMEOUT,
  );

  it(
    "should upsert delivery slot(s) for the provided location and create logs",
    async () => {
      const locationId = 13;

      // creating delivery slots
      await request(sails.hooks.http.app)
        .put(upsertApiEndpoint)
        .send({
          locationId,
          deliverySlots: createDeliverySlots,
        })
        .set("Authorization", SUPER_ADMIN_TOKEN);

      // updating delivery slots
      const upsertedDeliverySlots = await request(sails.hooks.http.app)
        .put(upsertApiEndpoint)
        .send({
          locationId,
          deliverySlots: upsertDeliverySlots,
        })
        .set("Authorization", SUPER_ADMIN_TOKEN);

      const getDeliverySlots2 = await request(sails.hooks.http.app)
        .get(getApiForPortalEndpoint)
        .query({ locationId })
        .set("Authorization", SUPER_ADMIN_TOKEN);

      const query = `SELECT ${deliverySlotsAuditHistoryColumns} FROM delivery_slots_audit_history WHERE location_id = ${locationId};`;
      const createdLogsRawPacket = (await sails.sendNativeQuery(query))?.rows;
      const createdLogsJson = Object.values(
        JSON.parse(JSON.stringify(createdLogsRawPacket)),
      );

      expect(createdLogsJson).to.deep.equal(expectedUpsertDeliverySlotsLogs);
      expect(createdLogsJson.length).to.equal(8);
      expect(upsertedDeliverySlots.status).to.equal(200);
      expect(getDeliverySlots2.body).to.deep.equal({
        code: "OK",
        message: "Operation is successfully executed",
        userMessage: "Your request has been processed successfully",
        data: expectedUpsertApiResponse,
        success: true,
      });
    },
    TEST_TIMEOUT,
  );
});

afterEach(async () => {
}, TEST_TIMEOUT);
