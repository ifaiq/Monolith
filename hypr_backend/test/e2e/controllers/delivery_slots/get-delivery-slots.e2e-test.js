const { request, expect } = require("../../common-imports");
const {
  authTokens: { CONSUMER_TOKEN, SUPER_ADMIN_TOKEN },
  constants: { TEST_TIMEOUT, prefix, v1 },
} = require("../../constants");

const getApiEndpoint = `/${prefix}/${v1}/delivery-slots`;
const upsertApiEndpoint = `/${prefix}/${v1}/${"delivery-slots"}`;

const {
  upsertDeliverySlotsData: { deliverySlots, getActiveDeliverySlotsForConsumer },
  getDeliverySlotsData: { locationId },
} = require("./test_data");

describe("api/v1/delivery-slots (GET)", () => {
  it("should respond with Unauthorized (401) if no token is provided", async () => {
    await request(sails.hooks.http.app).get(`${getApiEndpoint}?location=${locationId}`).expect(401);
  });


  it("should respond with authorized (200) on consumer token", async () => {
    await request(sails.hooks.http.app)
      .get(`${getApiEndpoint}?locationId=${locationId}`)
      .set("Authorization", CONSUMER_TOKEN)
      .expect(200);
  });

  it(
    "should respond with Bad request (400) for if request body is not passed",
    async () => {
      const response = await request(sails.hooks.http.app)
        .get(`${getApiEndpoint}`)
        .set("Authorization", CONSUMER_TOKEN);
      expect(response.status).to.equal(400);
      expect(response.body).to.deep.equalInAnyOrder({
        code: "E_BAD_REQUEST",
        message: "\"query.locationId\" is required",
        userMessage: "Something is amiss, Please try with different parameters",
        data: {},
        success: false,
      });
    },
    TEST_TIMEOUT,
  );
  it(
    "should respond with success response with enabled delivery dates",
    async () => {
      await request(sails.hooks.http.app)
        .put(upsertApiEndpoint)
        .send({ deliverySlots, locationId })
        .set("Authorization", SUPER_ADMIN_TOKEN);
      const response = await request(sails.hooks.http.app)
        .get(`${getApiEndpoint}?locationId=${locationId}`)
        .set("Authorization", CONSUMER_TOKEN);
      expect(response.body.data.deliverySlots).to.deep.equal(getActiveDeliverySlotsForConsumer);
    },
    TEST_TIMEOUT,
  );
});
