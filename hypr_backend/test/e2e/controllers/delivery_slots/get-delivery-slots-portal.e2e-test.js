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

const {
  getDeliverySlotsData: {
    createDeliverySlots,
    expectedApiResponse,
    upsertDeliverySlots,
    locationId,
    expectedApiResponseWithDefault,
  },
} = require("./test_data");

const getApiEndpoint = `/${prefix}/${v1}/delivery-slots/portal`;
const upsertApiEndpoint = `/${prefix}/${v1}/${"delivery-slots"}`;

describe("api/v1/delivery-slots/portal (GET)", () => {
  it("should respond with Unauthorized (401) if no token is provided", async () => {
    await request(sails.hooks.http.app)
      .get(`${getApiEndpoint}?location=${locationId}`)
      .expect(401);
  });

  it("should respond with Unauthorized (401) on consumer token", async () => {
    await request(sails.hooks.http.app)
      .get(`${getApiEndpoint}?locationId=${locationId}`)
      .set("Authorization", CONSUMER_TOKEN)
      .expect(401);
  });

  it("should respond with Unauthorized (401) on sales agent token", async () => {
    await request(sails.hooks.http.app)
      .get(`${getApiEndpoint}?locationId=${locationId}`)
      .set("Authorization", SALES_AGENT_TOKEN)
      .expect(401);
  });

  it("should respond with Unauthorized (401) on company owner (role 9) token", async () => {
    await request(sails.hooks.http.app)
      .get(`${getApiEndpoint}?locationId=${locationId}`)
      .set("Authorization", ADMIN_TOKEN)
      .expect(401);
  });

  it(
    "should respond with Bad request (400) for admin token if request body is not passed",
    async () => {
      const response = await request(sails.hooks.http.app)
        .get(`${getApiEndpoint}`)
        .set("Authorization", SUPER_ADMIN_TOKEN);

      expect(response.status).to.equal(400);
      expect(response.body).to.deep.equalInAnyOrder({
        code: "E_BAD_REQUEST",
        message: "\"query.locationId\" is required",
        userMessage:
            "Something is amiss, Please try with different parameters",
        data: {},
        success: false,
      });
    },
    TEST_TIMEOUT,
  );

  it(
    "should return 7 delivery slots",
    async () => {
      const adminToken = SUPER_ADMIN_TOKEN;
      await request(sails.hooks.http.app)
        .put(upsertApiEndpoint)
        .send({ locationId: locationId, deliverySlots: createDeliverySlots })
        .set("Authorization", adminToken);

      const response = await request(sails.hooks.http.app)
        .get(`${getApiEndpoint}?locationId=${locationId}`)
        .set("Authorization", adminToken);

      expect(response.body.data.length).equal(7);
      expect(response.body.data).to.deep.equal(expectedApiResponse);
    },
    TEST_TIMEOUT,
  );

  it(
    "should return 7 consecutive slots - dummy slots will be added if slot against that day is missing",
    async () => {
      const adminToken = SUPER_ADMIN_TOKEN;
      await request(sails.hooks.http.app)
        .put(upsertApiEndpoint)
        .send({
          locationId: locationId,
          deliverySlots: upsertDeliverySlots,
        })
        .set("Authorization", adminToken);

      const response = await request(sails.hooks.http.app)
        .get(`${getApiEndpoint}?locationId=${locationId}`)
        .set("Authorization", adminToken)
        .expect(200);

      expect(response.body.data).to.deep.equal(expectedApiResponseWithDefault);
    },
    TEST_TIMEOUT,
  );
});

afterEach(async () => {
}, TEST_TIMEOUT);
