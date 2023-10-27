const nock = require("nock");

const { request, expect } = require("../../common-imports");
const {
  authTokens: { CONSUMER_TOKEN, SUPER_ADMIN_TOKEN },
  constants: { TEST_TIMEOUT, prefix, v1, locationId },
} = require("../../constants");

const {
  products,
  categories,
  multipleProductsOrder,
  createCategoriesAndProducts,
} = require("../../stubs/products-categories-stubs");
const orderService = `/${prefix}/${v1}/order`;

const mockCustomerShopDetails = () => {
  nock(`${process.env.USER_SERVICE_BASE_URL}`, { allowUnmocked: true })
    .persist()
    .get("/shop-detail")
    .query(true)
    .reply(200, {
      userMessage: "SHOP_DETAIL_FETCHED",
      keyName: "data",
      data: [
        {
          id: 1,
          shopName: "Mocked Shop",
          shopLocation:
            "{\"longitude\":68.47542959646323,\"latitude\":24.356883218974094}",
          shopTypeId: 1,
        },
      ],
    });
};

const mockCustomerStoreLocation = locId => {
  nock(`${process.env.CONFIG_SERVICE_BASE_URL}`, { allowUnmocked: true })
    .persist()
    .get("/location/getStore")
    .query(true)
    .reply(200, {
      userMessage: "LOCATION_FETCHED",
      keyName: "data",
      data: {
        store: {
          locationId: locId,
          name: "NPD Warehouse - Mocked",
          minOrderLimit: 1000,
          maxOrderLimit: 6000,
          deliveryChargeValue: 100,
          deliveryChargeType: "FLAT",
          freeDeliveryLimit: 0,
          currency: "PKR",
          businessUnitId: 4,
          longitude: 60.92554886381065,
          latitude: 34.12549616382759,
        },
      },
    });
};

describe("api/v1/order (POST)", () => {
  it(
    "should place a single order [Customer token]",
    async () => {
      mockCustomerShopDetails();
      mockCustomerStoreLocation(locationId);
      await createCategoriesAndProducts(categories, products);

      const response = await request(sails.hooks.http.app)
        .post(orderService)
        .send({
          locationId,
          paymentType: "COD",
          products: [
            {
              id: 2,
              quantity: 1,
            },
            {
              id: 6,
              quantity: 2,
            },
          ],
        })
        .set("Authorization", CONSUMER_TOKEN)
        .expect(200);

      for (const order of response.body.data.order) {
        delete order.timersDict;
      }

      expect(response.body).to.eql({
        code: "OK",
        message: "Operation is successfully executed",
        userMessage: "Order placed successfully.",
        data: {
          message: "Order(s) created successfully",
          order: [{ orderId: 1, subTotal: 3950 }],
        },
        success: true,
      });
    },
    TEST_TIMEOUT,
  );

  it(
    "should place multiple orders [Customer token]",
    async () => {
      mockCustomerShopDetails();
      mockCustomerStoreLocation(locationId);
      await createCategoriesAndProducts(categories, multipleProductsOrder);

      const response = await request(sails.hooks.http.app)
        .post(orderService)
        .send({
          locationId,
          paymentType: "COD",
          products: [
            {
              id: 1,
              quantity: 8,
            },
            {
              id: 3,
              quantity: 4,
            },
          ],
        })
        .set("Authorization", CONSUMER_TOKEN)
        .expect(200);

      for (const order of response.body.data.order) {
        delete order.timersDict;
      }

      expect(response.body).to.eql({
        code: "OK",
        message: "Operation is successfully executed",
        userMessage: "Order placed successfully.",
        data: {
          message: "Order(s) created successfully",
          order: [{ orderId: 1, subTotal: 1850 }, { orderId: 2, subTotal: 1850 }],
        },
        success: true,
      });
    },
    TEST_TIMEOUT,
  );

  it(
    "should throw ORDER_TOTAL_LESS_THAN_MIN_LIMIT exception",
    async () => {
      mockCustomerShopDetails();
      mockCustomerStoreLocation(locationId);
      await createCategoriesAndProducts([categories[0]], [products[1]]);

      const response = await request(sails.hooks.http.app)
        .post(orderService)
        .send({
          locationId,
          paymentType: "COD",
          products: [
            {
              id: 1,
              quantity: 1,
            },
          ],
        })
        .set("Authorization", CONSUMER_TOKEN);

      expect(response.status).to.equal(400);
      expect(response.body).to.eql({
        success: false,
        status: "BAD_REQUEST",
        message: "Invalid request params",
        error: {
          code: 1003,
          message: "Order total is below minimum order value limit",
        },
      });
    },
    TEST_TIMEOUT,
  );

  it(
    "should throw empty stock exception",
    async () => {
      mockCustomerShopDetails();
      mockCustomerStoreLocation(locationId);
      await createCategoriesAndProducts([categories[0]], [products[0]]);

      const response = await request(sails.hooks.http.app)
        .post(orderService)
        .send({
          locationId,
          paymentType: "COD",
          products: [
            {
              id: 1,
              quantity: 40,
            },
          ],
        })
        .set("Authorization", CONSUMER_TOKEN);

      expect(response.status).to.equal(400);
      expect(response.body).to.eql({
        message: "Invalid request params",
        status: "BAD_REQUEST",
        success: false,
        error: {
          couponValidation: null,
          productValidation: [
            {
              code: 1302,
              message: "Product empty-stock-sku inventory not available",
              products: [
                {
                  id: 1,
                  multilingual: [],
                  name: "empty-stock-sku",
                  stockQuantity: 0,
                },
              ],
            },
            {
              code: 1303,
              message: "Please reduce quantity of empty-stock-sku",
              products: [
                {
                  id: 1,
                  multilingual: [],
                  name: "empty-stock-sku",
                  stockQuantity: 0,
                },
              ],
            },
          ],
        },
      });
    },
    TEST_TIMEOUT,
  );

  it(
    "should throw PRODUCT_NOT_FOUND exception",
    async () => {
      mockCustomerShopDetails();
      mockCustomerStoreLocation(locationId);

      const response = await request(sails.hooks.http.app)
        .post(orderService)
        .send({
          locationId,
          paymentType: "COD",
          products: [
            {
              id: 2,
              quantity: 4,
            },
          ],
        })
        .set("Authorization", CONSUMER_TOKEN);

      expect(response.status).to.equal(400);
      expect(response.body).to.eql({
        success: false,
        status: "BAD_REQUEST",
        message: "Product not found!",
        error: {},
      });
    },
    TEST_TIMEOUT,
  );
});

afterEach(async () => {
  nock.cleanAll();
}, TEST_TIMEOUT);
