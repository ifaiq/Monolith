const { request, expect } = require("../../common-imports");
const {
  authTokens: { CONSUMER_TOKEN, SALES_AGENT_TOKEN, ADMIN_TOKEN },
  constants: { prefix, v1 },
} = require("../../constants");

const skuDeactivationReasonEndpoint = `/${prefix}/${v1}/${"sku-deactivation-reason"}`;

const commonTests = () => {
  it("should respond with Unauthorized (401) if no token is provided", async () => {
    await request(sails.hooks.http.app)
      .post(skuDeactivationReasonEndpoint)
      .expect(401);
  });

  it("should respond with Unauthorized (401) on consumer token", async () => {
    await request(sails.hooks.http.app)
      .post(skuDeactivationReasonEndpoint)
      .set("Authorization", CONSUMER_TOKEN)
      .expect(401);
  });

  it("should respond with Unauthorized (401) on sales agent token", async () => {
    await request(sails.hooks.http.app)
      .post(skuDeactivationReasonEndpoint)
      .set("Authorization", SALES_AGENT_TOKEN)
      .expect(401);
  });
};

describe("api/v1/sku-deactivation-reason (POST)", () => {
  commonTests();

  it("should fail with bad request (400) when no body is supplied", async () => {
    const response = await request(sails.hooks.http.app)
      .post(skuDeactivationReasonEndpoint)
      .set("Authorization", ADMIN_TOKEN);

    expect(response.status).to.equal(400);
    expect(response.body).to.deep.equalInAnyOrder({
      code: "E_BAD_REQUEST",
      message: "\"body.reason\" is required. \"body.type\" is required",
      userMessage: "Something is amiss, Please try with different parameters",
      data: {},
      success: false,
    });
  });

  it("should fail with bad request (400) when reason is not supplied in body", async () => {
    const response = await request(sails.hooks.http.app)
      .post(skuDeactivationReasonEndpoint)
      .set("Authorization", ADMIN_TOKEN)
      .send({
        type: "ENABLED",
      });

    expect(response.status).to.equal(400);
    expect(response.body).to.deep.equalInAnyOrder({
      code: "E_BAD_REQUEST",
      message: "\"body.reason\" is required",
      userMessage: "Something is amiss, Please try with different parameters",
      data: {},
      success: false,
    });
  });

  it("should fail with bad request (400) when reason type is not supplied in body", async () => {
    const response = await request(sails.hooks.http.app)
      .post(skuDeactivationReasonEndpoint)
      .set("Authorization", ADMIN_TOKEN)
      .send({
        reason: "very bad quality",
      });

    expect(response.status).to.equal(400);
    expect(response.body).to.deep.equalInAnyOrder({
      code: "E_BAD_REQUEST",
      message: "\"body.type\" is required",
      userMessage: "Something is amiss, Please try with different parameters",
      data: {},
      success: false,
    });
  });

  it("should pass with correct message when all data is provided in the body", async () => {
    const response = await request(sails.hooks.http.app)
      .post(skuDeactivationReasonEndpoint)
      .set("Authorization", ADMIN_TOKEN)
      .send({
        reason: "very bad quality",
        type: "DISABLED",
      });

    expect(response.status).to.equal(200);
    expect(response.body.message).to.equal(
      "Operation is successfully executed",
    );
  });
});

describe("api/v1/sku-deactivation-reason (GET)", () => {
  commonTests();

  it("should respond with reason when correct token is provided", async () => {
    const response = await request(sails.hooks.http.app)
      .get(skuDeactivationReasonEndpoint)
      .set("Authorization", ADMIN_TOKEN);
    expect(response.status).to.equal(200);
    expect(response.body.message).to.equal(
      "Operation is successfully executed",
    );
  });
});

describe("api/v1/sku-deactivation-reason (PUT)", () => {
  commonTests();

  it("should respond bad request when no id is provided to update reason", async () => {
    const response = await request(sails.hooks.http.app)
      .put(skuDeactivationReasonEndpoint)
      .set("Authorization", ADMIN_TOKEN);
    expect(response.status).to.equal(400);
    expect(response.body).to.deep.equalInAnyOrder({
      code: "E_BAD_REQUEST",
      message: "\"body.id\" is required",
      userMessage: "Something is amiss, Please try with different parameters",
      data: {},
      success: false,
    });
  });

  it("should respond with the updated reason result", async () => {
    const response = await request(sails.hooks.http.app)
      .put(skuDeactivationReasonEndpoint)
      .set("Authorization", ADMIN_TOKEN)
      .send({ id: 3, type: "DISABLED" });
    expect(response.status).to.equal(200);
    expect(response.body.message).to.equal(
      "Operation is successfully executed",
    );
  });
});

describe("api/v1/sku-deactivation-reason (DELETE)", () => {
  commonTests();

  it("should respond bad request when no id is provided to update reason", async () => {
    const response = await request(sails.hooks.http.app)
      .delete(skuDeactivationReasonEndpoint)
      .set("Authorization", ADMIN_TOKEN);
    expect(response.status).to.equal(400);
    expect(response.body).to.deep.equalInAnyOrder({
      code: "E_BAD_REQUEST",
      message: "\"body.id\" is required",
      userMessage: "Something is amiss, Please try with different parameters",
      data: {},
      success: false,
    });
  });
});
