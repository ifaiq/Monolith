const { request, expect } = require("../../common-imports");
const {
  authTokens: { CONSUMER_TOKEN, SALES_AGENT_TOKEN, ADMIN_TOKEN },
  constants: { prefix, v1 },
} = require("../../constants");

const customerReportSkuEndpoint = `/${prefix}/${v1}/${"report-customer-sku"}`;

describe("api/v1/report-customer-sku (POST)", () => {
  it("should respond with Unauthorized (401) if no token is provided", async () => {
    await request(sails.hooks.http.app).post(customerReportSkuEndpoint).expect(401);
  });

  it("should respond with Unauthorized (401) on consumer token", async () => {
    await request(sails.hooks.http.app)
      .post(customerReportSkuEndpoint)
      .set("Authorization", CONSUMER_TOKEN)
      .expect(401);
  });

  it("should respond with Unauthorized (401) on sales agent token", async () => {
    await request(sails.hooks.http.app)
      .post(customerReportSkuEndpoint)
      .set("Authorization", SALES_AGENT_TOKEN)
      .expect(401);
  });

  it("should fail with bad request (400) when no body is supplied", async () => {
    const response = await request(sails.hooks.http.app)
      .post(customerReportSkuEndpoint)
      .set("Authorization", ADMIN_TOKEN);

    expect(response.status).to.equal(400);
    expect(response.body).to.deep.equalInAnyOrder({
      code: "E_BAD_REQUEST",
      message: "\"body.filename\" is required. \"body.fileurl\" is required",
      userMessage:
        "Something is amiss, Please try with different parameters",
      data: {},
      success: false,
    });
  });

  it("should pass with correct message of records updated/inserted (200)", async () => {
    const response = await request(sails.hooks.http.app)
      .post(customerReportSkuEndpoint)
      .set("Authorization", ADMIN_TOKEN)
      .send({
        filename: "Customer Sku Report - Sheet1 - e2e.csv",
        fileurl: "https://dev-retailo-images.s3.me-south-1.amazonaws.com/Customer%20Sku%20Report%20-%20Sheet1%20-%20e2e.csv"
      });
    expect(response.status).to.equal(200);
    expect(response.body.message).to.equal("Records have been processed successfully!");
  });
});
