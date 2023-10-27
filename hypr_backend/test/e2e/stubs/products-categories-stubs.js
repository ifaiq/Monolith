const { request } = require("../common-imports");

const {
  constants: { locationId },
  authTokens: { SUPER_ADMIN_TOKEN },
} = require("../constants");

// creating product categories
const chaiMainCategory = {
  name: "Chai & Coffee",
  start_date: "2020-01-01T00:00:00.000Z",
  end_date: "2040-01-01T00:00:00.000Z",
  priority: 9,
  sub_categories: [],
  image_url: "",
  multilingual: [],
  location_id: locationId,
};

const tapalSubCategory = {
  name: "Tapal",
  start_date: "2020-01-01T00:00:00.000Z",
  end_date: "2040-01-01T00:00:00.000Z",
  priority: 2,
  sub_categories: [],
  image_url: "",
  multilingual: [],
  location_id: locationId,
};

const categories = [chaiMainCategory, tapalSubCategory];

const emptyStockSku = {
  name: "empty-stock-sku",
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
  stock_quantity: 0,
  physical_stock: 0,
};

const nonJitCerelac = {
  name: "non-jit-cerelac-sku",
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
  sku: "non-jit-cerelac-sku",
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
  stock_quantity: 10000,
  delivery_time: "",
  physical_stock: 20,
};

const nonJitSkuNido = {
  name: "nido milk",
  categories: [
    {
      id: 1,
      product_priority: null,
    },
    {
      id: 2,
      product_priority: "maxPriority",
    },
  ],
  price: 1900,
  size: "1kg",
  unit: "",
  brand: "Nestle",
  urdu_name: "",
  urdu_size: "",
  urdu_brand: "",
  urdu_unit: "",
  disabled: 0,
  mrp: "2220",
  trade_price: 1950,
  barcode: "HYPR803983581",
  cost_price: 98,
  sku: "non-JIT-sku-nido",
  description: "",
  tax_percent: 2,
  tax_inclusive: true,
  consent_required: false,
  tax_category: "1",
  multilingual: [],
  quantity_limit: null,
  is_volume_based_price_enabled: false,
  volume_based_prices: [],
  reason: "",
  delivery_time: "",
  location_id: locationId,
  updated_by: 160,
  stock_quantity: 42000,
  physical_stock: 3000,
};

const jitSkuTapalChai = {
  name: "chai",
  categories: [
    {
      id: 1,
      product_priority: null,
    },
    {
      id: 2,
      product_priority: "maxPriority",
    },
  ],
  price: 100,
  size: "1kg",
  unit: "1000",
  brand: "tapal",
  urdu_name: "",
  urdu_size: "",
  urdu_brand: "",
  urdu_unit: "",
  disabled: 0,
  mrp: "120",
  trade_price: 200,
  barcode: "HYPR803983581",
  cost_price: 98,
  sku: "sku-tapal-chai",
  description: "",
  tax_percent: 1,
  tax_inclusive: true,
  consent_required: false,
  tax_category: "1",
  multilingual: [],
  quantity_limit: null,
  is_volume_based_price_enabled: false,
  volume_based_prices: [],
  reason: "",
  delivery_time: "55",
  location_id: locationId,
  updated_by: 160,
  stock_quantity: 12000,
  physical_stock: 1200,
};

const jitSkuEverydayMilk = {
  name: "everyday milk",
  categories: [
    {
      id: 1,
      product_priority: null,
    },
    {
      id: 2,
      product_priority: "maxPriority",
    },
  ],
  price: 250,
  size: "1kg",
  unit: "2000",
  brand: "tapal",
  urdu_name: "",
  urdu_size: "",
  urdu_brand: "",
  urdu_unit: "",
  disabled: 0,
  mrp: "220",
  trade_price: 260,
  barcode: "HYPR803983581",
  cost_price: 98,
  sku: "sku-PAK-everyday",
  description: "",
  tax_percent: 2,
  tax_inclusive: true,
  consent_required: false,
  tax_category: "1",
  multilingual: [],
  quantity_limit: null,
  is_volume_based_price_enabled: false,
  volume_based_prices: [],
  reason: "",
  delivery_time: "96",
  location_id: locationId,
  updated_by: 160,
  stock_quantity: 32000,
  physical_stock: 3,
};

const jitSkuNido = {
  name: "nido milk",
  categories: [
    {
      id: 1,
      product_priority: null,
    },
    {
      id: 2,
      product_priority: "maxPriority",
    },
  ],
  price: 1900,
  size: "1kg",
  unit: "",
  brand: "Nestle",
  urdu_name: "",
  urdu_size: "",
  urdu_brand: "",
  urdu_unit: "",
  disabled: 0,
  mrp: "2220",
  trade_price: 1950,
  barcode: "HYPR803983581",
  cost_price: 98,
  sku: "jit-sku-nido",
  description: "",
  tax_percent: 2,
  tax_inclusive: true,
  consent_required: false,
  tax_category: "1",
  multilingual: [],
  quantity_limit: null,
  is_volume_based_price_enabled: false,
  volume_based_prices: [],
  reason: "",
  delivery_time: "32",
  location_id: locationId,
  updated_by: 160,
  stock_quantity: 42000,
  physical_stock: 3000,
};

const nonJitCartProduct1 = {
  categories: [{ id: 1, product_priority: null }],
  name: "Aata Sunridge - 10.KG x1",
  sku: "Retailo-13-000005",
  image_url: "",
  description: "",
  weight: 0,
  length: 0,
  width: 0,
  height: 0,
  price: 2000,
  cost_price: 2500,
  mrp: 3000,
  trade_price: null,
  size: "",
  unit: "",
  brand: "Sunridge",
  urdu_name: "Aata Sunridge - 10.KG x1",
  urdu_unit: "",
  urdu_size: "",
  urdu_brand: "",
  disabled: false,
  barcode: "HYPR473455395",
  consent_required: false,
  location_id: locationId,
  tax_inclusive: true,
  tax_percent: 10,
  tax_category: 2,
  delivery_time: "",
  quantity_limit: null,
  updated_by: 160,
  stock_quantity: 217683,
  physical_stock: 443,
};

const products = [
  emptyStockSku,
  nonJitCerelac,
  jitSkuTapalChai,
  jitSkuEverydayMilk,
  jitSkuNido,
  nonJitSkuNido,
];

const multipleProductsOrder = [
  nonJitCerelac,
  jitSkuTapalChai,
  jitSkuEverydayMilk,
];

const nonJitCartProducts = [nonJitCartProduct1];

const createCategoriesAndProducts = async (categoriesArray, productsArray) => {
  for (const category of categoriesArray) {
    await request(sails.hooks.http.app)
      .post("/categories/createProductCategory")
      .send(category)
      .set("Authorization", SUPER_ADMIN_TOKEN)
      .expect(200);
  }

  for (const product of productsArray) {
    const createdProductResponse = await request(sails.hooks.http.app)
      .post("/product/createProduct")
      .send(product)
      .set("Authorization", SUPER_ADMIN_TOKEN)
      .expect(200);

    const {
      data: {
        data: { id },
      },
    } = createdProductResponse.body;

    // stocks are not inserted when inserting a single product
    await sails.sendNativeQuery(`UPDATE products
       SET stock_quantity = ${product.stock_quantity}, physical_stock = ${product.physical_stock}
       WHERE id = ${id}`);
  }
};

module.exports = {
  categories,
  products,
  multipleProductsOrder,
  nonJitCartProducts,
  createCategoriesAndProducts,
};
