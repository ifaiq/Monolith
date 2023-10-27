const { request, expect } = require("../../common-imports");
const {
  authTokens: { CONSUMER_TOKEN, SUPER_ADMIN_TOKEN, ADMIN_TOKEN },
  constants: { TEST_TIMEOUT },
} = require("../../constants");

const categoryApiEndPoint = "/api/v1/category";
const createCategoryApiEndPoint = "/categories/createProductCategory";

const createCategoryBody = {
  name: "test category 1",
  start_date: "2022-10-26T06:39:37.727Z",
  end_date: "2022-10-26T06:39:37.727Z",
  image_url: "",
  location_id: 707,
  priority: 1,
  sub_categories: [],
};

describe("/api/v1/category (GET)", () => {
  it(
    "should return missing parameter error",
    async () => {
      await request(sails.hooks.http.app)
        .post(createCategoryApiEndPoint)
        .send(createCategoryBody)
        .set("Authorization", SUPER_ADMIN_TOKEN)
        .expect(200);

      request(sails.hooks.http.app)
        .get(categoryApiEndPoint)
        .query({})
        .set("Authorization", CONSUMER_TOKEN)
        .expect(400);
    },
    TEST_TIMEOUT
  );

  it(
    "should return no category found error",
    async () => {
      const response = await request(sails.hooks.http.app)
        .get(categoryApiEndPoint)
        .query({
          locationId: 1,
          page: 1,
          perPage: 50,
        })
        .set("Authorization", CONSUMER_TOKEN);

      expect(response.body).to.eql({
        success: false,
        status: "BAD_REQUEST",
        message: "No categories were found against this location!",
        error: {},
      });
    },
    TEST_TIMEOUT
  );

  it(
    "should get categories by location ID",
    async () => {
      await request(sails.hooks.http.app)
        .post(createCategoryApiEndPoint)
        .send(createCategoryBody)
        .set("Authorization", SUPER_ADMIN_TOKEN)
        .expect(200);

      await request(sails.hooks.http.app)
        .post(createCategoryApiEndPoint)
        .send({
          ...createCategoryBody,
          name: "test category 2",
          priority: 2,
        })
        .set("Authorization", SUPER_ADMIN_TOKEN)
        .expect(200);

      const response = await request(sails.hooks.http.app)
        .get(categoryApiEndPoint)
        .query({
          locationId: 707,
          perPage: 20,
          page: 1,
        })
        .set("Authorization", CONSUMER_TOKEN)
        .expect(200);

      expect(response.body).to.eql({
        code: "OK",
        message: "Operation is successfully executed",
        userMessage: "Your request has been processed successfully",
        data: {
          categories: [
            {
              id: 1,
              name: "test category 1",
              imageUrl: "",
              priority: 1,
            },
            {
              id: 2,
              name: "test category 2",
              imageUrl: "",
              priority: 2,
            },
          ],
          total: 2,
        },
        success: true,
      });
    },
    TEST_TIMEOUT
  );

  it(
    "should get categories by category Id",
    async () => {
      await request(sails.hooks.http.app)
        .post(createCategoryApiEndPoint)
        .send({
          ...createCategoryBody,
          sub_categories: [
            {
              id: 2,
              name: "test sub 1",
              priority: 2,
              image_url: "",
              location_id: 13,
              multilingual: [],
            },
            {
              id: 3,
              name: "test sub 2",
              priority: 3,
              image_url: "",
              location_id: 13,
              multilingual: [],
            },
            {
              id: 4,
              name: "test sub 3",
              priority: 4,
              image_url: "",
              location_id: 13,
              multilingual: [],
            },
          ],
        })
        .set("Authorization", SUPER_ADMIN_TOKEN)
        .expect(200);

      const response = await request(sails.hooks.http.app)
        .get(categoryApiEndPoint)
        .query({
          categoryId: 1,
          perPage: 20,
          page: 1,
        })
        .set("Authorization", CONSUMER_TOKEN)
        .expect(200);

      expect(response.body).to.eql({
        code: "OK",
        message: "Operation is successfully executed",
        userMessage: "Your request has been processed successfully",
        data: {
          categories: [
            {
              id: 2,
              name: "test sub 1",
              imageUrl: "",
              priority: 2,
            },
            {
              id: 3,
              name: "test sub 2",
              imageUrl: "",
              priority: 3,
            },
            {
              id: 4,
              name: "test sub 3",
              imageUrl: "",
              priority: 4,
            },
          ],
          total: 3,
        },
        success: true,
      });
    },
    TEST_TIMEOUT
  );

  it(
    "should get only one category by location ID",
    async () => {
      await request(sails.hooks.http.app)
        .post(createCategoryApiEndPoint)
        .send(createCategoryBody)
        .set("Authorization", SUPER_ADMIN_TOKEN)
        .expect(200);

      await request(sails.hooks.http.app)
        .post(createCategoryApiEndPoint)
        .send({
          ...createCategoryBody,
          name: "test category 2",
          priority: 2,
        })
        .set("Authorization", SUPER_ADMIN_TOKEN)
        .expect(200);

      const response = await request(sails.hooks.http.app)
        .get(categoryApiEndPoint)
        .query({
          locationId: 707,
          perPage: 1,
          page: 1,
        })
        .set("Authorization", CONSUMER_TOKEN)
        .expect(200);

      expect(response.body.data.categories.length).equal(1);
    },
    TEST_TIMEOUT
  );
});
