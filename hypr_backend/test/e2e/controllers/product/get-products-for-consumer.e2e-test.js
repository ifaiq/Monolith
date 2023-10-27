const { request, expect } = require("../../common-imports");
const {
  authTokens: { CONSUMER_TOKEN, SUPER_ADMIN_TOKEN, ADMIN_TOKEN },
  constants: { TEST_TIMEOUT, prefix, v1 },
} = require("../../constants");

const productService = "product";
const createApiEndpoint = `/${productService}/createProduct`;
const getApiForConsumerEndpoint = `/${prefix}/${v1}/${productService}`;

const locationId = 194;

const categoryStub = {
  name: "test",
  start_date: "2020-01-01T00:00:00.000Z",
  end_date: "2030-01-01T00:00:00.000Z",
  priority: 100,
  sub_categories: [],
  image_url: "",
  multilingual: [],
  location_id: locationId,
};

const productStub = {
  name: "test",
  categories: [{ id: 1, product_priority: null }],
  price: 100,
  size: "",
  unit: "",
  brand: "",
  urdu_name: "",
  urdu_size: "",
  urdu_brand: "",
  urdu_unit: "",
  disabled: 0,
  mrp: "120",
  trade_price: null,
  barcode: "HYPR923090703",
  cost_price: 100,
  sku: "test-sku",
  description: "",
  tax_percent: 10,
  tax_inclusive: false,
  consent_required: false,
  tax_category: "3",
  multilingual: [],
  quantity_limit: null,
  is_volume_based_price_enabled: false,
  volume_based_prices: [],
  reason: "",
  location_id: locationId,
  updated_by: 160,
};

describe("api/v1/product (GET)", () => {
  it("should respond with Unauthorized (401) if no token is provided", async () => {
    await request(sails.hooks.http.app).get(getApiForConsumerEndpoint).expect(401);
  });

  it("should respond with Unauthorized (401) on admin token", async () => {
    await request(sails.hooks.http.app)
      .get(getApiForConsumerEndpoint)
      .set("Authorization", ADMIN_TOKEN)
      .expect(401);
  });

  it(
    "should get products for the provided location [Consumer]",
    async () => {
      await request(sails.hooks.http.app)
        .post("/categories/createProductCategory")
        .send(categoryStub)
        .set("Authorization", SUPER_ADMIN_TOKEN)
        .expect(200);

      await request(sails.hooks.http.app)
        .post(createApiEndpoint)
        .send(productStub)
        .set("Authorization", SUPER_ADMIN_TOKEN)
        .expect(200);

      const response = await request(sails.hooks.http.app)
        .get(getApiForConsumerEndpoint)
        .query({ locationId, categoryId: 1, perPage: 20, page: 1 })
        .set("Authorization", CONSUMER_TOKEN)
        .expect(200);

      expect(response.body).to.eql({
        userMessage: "Your request has been processed successfully",
        code: "OK",
        message: "Operation is successfully executed",
        success: true,
        data: {
          totalProducts: 1,
          products: [
            {
              id: 1,
              brand: "",
              description: null,
              discount: "",
              expectedDeliveryDate: null,
              imageUrl: null,
              isVolumeBasedPriceEnabled: false,
              isDynamicPriceEnabled: false,
              mrp: 120,
              name: "test",
              price: 100,
              productPriority: 1,
              quantityLimit: null,
              size: "",
              tradePrice: "",
              sku: "test-sku",
              stockQuantity: 0,
              unit: "",
              volumeBasedPrices: [],
            },
          ],
        },
      });
    },
    TEST_TIMEOUT,
  );
});
