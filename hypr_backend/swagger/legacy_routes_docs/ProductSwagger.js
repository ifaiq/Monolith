const PRODUCTS = "Product";
const DESCRIPTION = "Product Legacy API";
const AUTHORIZATION = [
  {
    Authorization: [],
  },
];
const onBoardProducts = {
  summary: "Bulk product onboard [ADMIN PORTAL]",
  description: `${DESCRIPTION}<br><h4>Role(s) Allowed:</h4>
    <ol>
      <li>Store Manager(7)</li>
      <li>Company Owner(9)</li>
    </ol>
    <h4>Communicates with:</h4>
    <ul>
      <li><b>Config Service</b> To extract location data</li>
      <li><b>AWS s3</b> To store the file to process in controller and also used to store product images</li>
    </ul>`,
  tags: [PRODUCTS],
  security: AUTHORIZATION,
  requestBody: {
    content: {
      "application/json": {
        schema: {
          properties: {
            file_name: { type: "string" },
            file_url: { type: "string" },
            user_id: { type: "integer" },
            bulk: { type: "boolean" },
          },
          required: ["file_name"],
        },
      },
    },
  },
};

const updateProducts = {
  summary: "Update products [ADMIN PORTAL]",
  description: `${DESCRIPTION}<br><h4>Role(s) Allowed:</h4>
  <ol>
    <li>Store Manager(7)</li>
    <li>Company Owner(9)</li>
  </ol>
  <h4>Communicates with:</h4>
  <ul>
    <li><b>Elastic Search</b> To update product(s) in Elastic Search</li>
    <li><b>AWS s3</b> To store the file to process in controller and also used to store products images</li>
  </ul>`,
  tags: [PRODUCTS],
  security: AUTHORIZATION,
  requestBody: {
    content: {
      "application/json": {
        schema: {
          properties: {
            file_name: { type: "string" },
            file_url: { type: "string" },
            user_id: { type: "integer" },
            bulk: { type: "boolean" },
          },
          required: ["file_name"],
        },
      },
    },
  },
};

const updateMultipleLocationPrices = {
  summary: "Update multiple location prices [ADMIN PORTAL]",
  description: `${DESCRIPTION}<br><h4>Role(s) Allowed:</h4>
  <ol>
    <li>Company Owner(9)</li>
  </ol>
  <h4>Communicates with:</h4>
    <ul>
      <li><b>AWS s3</b> To store the file to process in controller</li>
      <li><b>Elastic Search</b> To update product(s) in Elastic Search</li>
    </ul>`,
  tags: [PRODUCTS],
  security: AUTHORIZATION,
  requestBody: {
    content: {
      "application/json": {
        schema: {
          properties: {
            file_name: { type: "string" },
            file_url: { type: "string" },
            user_id: { type: "integer" },
            bulk: { type: "boolean" },
          },
          required: ["file_name"],
        },
      },
    },
  },
};

const bulkUpdateSkuDeactivation = {
  tags: [PRODUCTS],
  security: AUTHORIZATION,
  description: DESCRIPTION,
  requestBody: {
    content: {
      "application/json": {
        schema: {
          properties: {
            file_name: { type: "string" },
            file_url: { type: "string" },
          },
          required: ["file_name"],
        },
      },
    },
  },
};

const bulkUpdateProductPriorities = {
  summary: "Bulk update product priorities [ADMIN PORTAL]",
  description: `${DESCRIPTION}<br><h4>Role(s) Allowed:</h4>
  <ol>
    <li>Company Owner(9)</li>
  </ol>`,
  tags: [PRODUCTS],
  security: AUTHORIZATION,
  requestBody: {
    content: {
      "application/json": {
        schema: {
          properties: {
            file_name: { type: "string" },
            user_id: { type: "integer" },
          },
          required: ["file_name"],
        },
      },
    },
  },
};

const getAllProducts = {
  summary: "Get all products [ADMIN PORTAL]",
  description: `${DESCRIPTION}<br><h4>Role(s) Allowed:</h4>
  <ol>
    <li>Store Manager(7)</li>
    <li>Company Owner(9)</li>
  </ol>`,
  tags: [PRODUCTS],
  security: AUTHORIZATION,
  requestBody: {
    content: {
      "application/json": {
        schema: {
          properties: {
            search: { type: "string" },
            searchOnAttributes: { type: "string" },
            pricingTypes: { type: "string" },
            page: { type: "integer" },
            per_page: { type: "integer" },
            isAdmin: { type: "boolean" },
            company_id: { type: "integer" },
            sortBy: { type: "string" },
            sortOrder: { type: "string" },
            category_id: { type: "integer" },
            location_id: { type: "integer" },
            disabled: { type: "boolean" },
          },
          required: ["page", "per_page", "company_id", "search"],
        },
      },
    },
  },
};

const getProductByCategory = {
  summary: "Get products by category [ADMIN PORTAL]",
  description: `${DESCRIPTION}<br><h4>Role(s) Allowed:</h4>
  <ol>
    <li>Store Manager(7)</li>
    <li>Consumer(8)</li>
    <li>Company Owner(9)</li>
    <li>TDM App(14)</li>
    <li>BU Manager(15)</li>
    <li>Sales Agent(16)</li>
  </ol>
  <h4>Communicates with:</h4>
    <ul>
      <li><b>Redis</b> To fetch product(s) stored in redis cache</li>
  </ul>`,
  tags: [PRODUCTS],
  security: AUTHORIZATION,
  requestBody: {
    content: {
      "application/json": {
        schema: {
          properties: {
            per_page: { type: "string" },
            page: { type: "string" },
            dontPaginate: { type: "string" },
            showDisabled: { type: "string" },
            location_id: { type: "string" },
            search: { type: "string" },
            sku: { type: "string" },
            id: { type: "string" },
            brand: { type: "string" },
            sizes: {
              type: "array",
              items: {
                type: "number",
              },
            },
            sort: { type: "string" },
            location_id: { type: "integer" },
            category_id: { type: "string" },
          },
          required: ["per_page", "page"],
        },
      },
    },
  },
};

const createProduct = {
  summary: "Create Product [ADMIN PORTAL]",
  description: `${DESCRIPTION}<br><h4>Role(s) Allowed:</h4>
    <ol>
      <li>Store Manager(7)</li>
      <li>Company Owner(9)</li>
    </ol>
    <h4>Communicates with:</h4>
    <ul>
      <li><b>Odoo Service</b> To Sync products with Odoo inventory</li>
      <li><b>Elastic Search</b> To create or update products in Elastic Search</li>
    </ul>`,
  tags: [PRODUCTS],
  security: AUTHORIZATION,
  requestBody: {
    content: {
      "application/json": {
        schema: {
          properties: {
            sku: { type: "string" },
            name: { type: "string" },
            size: { type: "string" },
            unit: { type: "string" },
            brand: { type: "string" },
            urdu_name: { type: "string" },
            urdu_unit: { type: "string" },
            urdu_size: { type: "string" },
            urdu_brand: { type: "string" },
            disabled: { type: "boolean" },
            barcode: { type: "string" },
            description: { type: "string" },
            consent_required: { type: "boolean" },
            location_id: { type: "integer" },
            price: { type: "number" },
            cost_price: { type: "number" },
            mrp: { type: "number" },
            trade_price: { type: "number" },
            tax_percent: { type: "number" },
            tax_inclusive: { type: "boolean" },
            tax_category: { type: "string" },
            weight: { type: "number" },
            width: { type: "number" },
            length: { type: "number" },
            height: { type: "number" },
            updated_by: { type: "integer" },
            image_url: { type: "string" },
            catalogue_product_id: { type: "integer" },
            published: { type: "boolean" },
            delivery_time: { type: "integer" },
            isVolumeBasedPriceEnabled: { type: "boolean" },
            volume_based_prices: [
              {
                quantityTo: { type: "integer" },
                quantityFrom: { type: "integer" },
                price: { type: "number" },
                disabled: { type: "boolean" },
              },
            ],
            multilingual: { type: "array", items: { type: "string" } },
            categories: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "integer" },
                  product_priority: { type: "integer" },
                },
              },
            },
          },
        },
      },
    },
  },
};

const createProductCategory = {
  summary: "Create product category [ADMIN PORTAL]",
  description: `${DESCRIPTION}<br><h4>Role(s) Allowed:</h4>
    <ol>
      <li>Store Manager(7)</li>
      <li>Company Owner(9)</li>
    </ol>`,
  tags: [PRODUCTS],
  security: AUTHORIZATION,
  requestBody: {
    content: {
      "application/json": {
        schema: {
          properties: {
            name: { type: "string" },
            priority: { type: "integer" },
            start_date: { type: "string" },
            end_date: { type: "string" },
            image_url: { type: "string" },
            location_id: { type: "integer" },
            type: { type: "string" },
            multilingual: { type: "array", items: { type: "string" } },
            sub_categories: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "integer" },
                  product_priority: { type: "integer" },
                },
              },
            },
          },
          required: ["location_id", "name"],
        },
      },
    },
  },
};
module.exports = {
  onBoardProducts,
  updateProducts,
  updateMultipleLocationPrices,
  bulkUpdateProductPriorities,
  getAllProducts,
  getProductByCategory,
  createProduct,
  createProductCategory,
  bulkUpdateSkuDeactivation,
};
