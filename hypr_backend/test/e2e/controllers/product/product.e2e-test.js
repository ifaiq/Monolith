const { request, expect } = require("../../common-imports");
const {
  authTokens: { CONSUMER_TOKEN },
  constants: { prefix, v1 },
} = require("../../constants");

const {
  categories,
  multipleProductsOrder,
  createCategoriesAndProducts,
} = require("../../stubs/products-categories-stubs");

const UNAUTHORIZED_STATUS_CODE = 401;
const UNAUTHORIZED_CODE = "E_UNAUTHORIZED";
const SERVICE_NAME = "product";

describe("ProductController", () => {
  describe("GET Products", () => {
    it("should fail with unauthorized error", async () => {
      const response = await request(sails.hooks.http.app)
        .get(`/${prefix}/${v1}/${SERVICE_NAME}/`);
      expect(response.status).to.equal(UNAUTHORIZED_STATUS_CODE);
      expect(response.body.code).to.equal(UNAUTHORIZED_CODE);
      expect(response.body.success).to.false;
    });

    it("should only return products in locationId query param", async () => {
      await createCategoriesAndProducts(categories, multipleProductsOrder);
      const response = await request(sails.hooks.http.app)
        .get(`/${prefix}/${v1}/${SERVICE_NAME}`)
        .query({
          categoryId: 1,
          locationId: 194,
          page: 1,
          perPage: 10,
        })
        .set("Authorization", CONSUMER_TOKEN)
        .expect(200);

      expect(response.body).to.eql({
        code: "OK",
        message: "Operation is successfully executed",
        userMessage: "Your request has been processed successfully",
        data: {
          products: [
            {
              brand: "",
              description: null,
              discount: "",
              expectedDeliveryDate: null,
              id: 1,
              imageUrl: null,
              isDynamicPriceEnabled: false,
              isVolumeBasedPriceEnabled: false,
              mrp: 120,
              name: "non-jit-cerelac-sku",
              price: 100,
              productPriority: 1,
              quantityLimit: null,
              size: "",
              sku: "non-jit-cerelac-sku",
              stockQuantity: 10000,
              tradePrice: "",
              unit: "",
              volumeBasedPrices: [],
            },
          ],
          totalProducts: 1,
        },
        success: true,
      });
    });

    it("should not return products in locationId if there aren't any", async () => {
      await createCategoriesAndProducts(categories, multipleProductsOrder);
      const response = await request(sails.hooks.http.app)
        .get(`/${prefix}/${v1}/${SERVICE_NAME}`)
        .query({
          categoryId: 1,
          locationId: 1,
          page: 1,
          perPage: 10,
        })
        .set("Authorization", CONSUMER_TOKEN)
        .expect(400);

      expect(response.body).to.eql({
        error: {},
        message: "No Products Found",
        status: "BAD_REQUEST",
        success: false,
      });
    });
  });
});
