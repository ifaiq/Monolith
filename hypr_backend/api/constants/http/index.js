const constants = {
  routes:
  {
    ELASTIC_APP_SEARCH: {
      VERSION: "v1/",
      API: "/api/as/",
      ENGINES: "engines/",
      SYNONYMS: "/synonyms/",
    },
    ODOO_INTEGRATION: {
      AUTH_API: "web/session/authenticate/",
      ADD_PRODUCT_API: "api/product.product",
      CREATE_SALE_ORDER_API: "sale_create",
      DELIVERY_RETURN_API: "delivery/return/",
      UPDATE_PRODUCT_API: "api/product.product",
    },
    SMS_SERVICE_INTEGRATION: {
      SEND_SMS: "send-sms",
    },
  },
  request: {
    HEADER: {
      COOKIE: "Cookie",
      CONTENT: "Content-Type",
      CONTENT_TYPE_JSON: "application/json",
      AUTH: {
        AUTHORIZATION: "Authorization",
        BEARER: "Bearer",
      },
    },
    OPTIONS: {
      PAGE_SIZE: 20,
      CURRENT_PAGE: 1,
    },
    RESOURSES: {
      GET: "GET",
      POST: "POST",
      PUT: "PUT",
      DELETE: "DELETE",
    },
    VERSIONING: {
      prefix: "api",
      v1: "v1",
      v2: "v2",
    },
  },
  response: {
    HEADER: {
      updatedToken: "x-auth-token",
    },
  },
  productTypes: {
    CONSUMABLE: "consu",
    PRODUCT: "product",
  },
};
module.exports = { constants };
