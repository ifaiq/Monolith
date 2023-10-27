const {
  productService: {
    clearAllAssociatedSortedsetsRedis,
    clearProductFromRedis,
  },
} = require("../modules/v1/Product");
const { clearProductCache } = require("../modules/v1/Redis/RedisService");

module.exports = {
  tableName: "products",
  created_at: true,
  updated_at: true,
  deleted_at: true,
  attributes: {
    id: {
      type: "number",
      columnType: "integer",
      required: false,
      autoIncrement: true,
    },
    name: {
      type: "string",
      required: false,
      columnType: "varchar(45)",
      allowNull: true,
    },
    sku: {
      type: "string",
      required: true,
      columnType: "varchar(45)",
    },
    image_url: {
      type: "string",
      allowNull: true,
    },
    description: {
      type: "string",
      allowNull: true,
    },
    stock_quantity: {
      type: "number",
      allowNull: true,
      columnType: "integer",
      defaultsTo: 0,
    },
    weight: {
      type: "number",
      allowNull: true,
      columnType: "float",
    },
    length: {
      type: "number",
      allowNull: true,
      columnType: "float",
    },
    width: {
      type: "number",
      allowNull: true,
      columnType: "float",
    },
    height: {
      type: "number",
      allowNull: true,
      columnType: "float",
    },
    price: {
      type: "number",
      allowNull: true,
      columnType: "float",
    },
    cost_price: {
      type: "number",
      allowNull: true,
      columnType: "float",
    },
    mrp: {
      type: "number",
      allowNull: true,
      columnType: "float",
    },
    trade_price: {
      type: "number",
      allowNull: true,
      columnType: "float",
    },
    size: {
      type: "string",
      allowNull: true,
    },
    unit: {
      type: "string",
      allowNull: true,
    },
    brand: {
      type: "string",
      allowNull: true,
    },
    urdu_name: {
      type: "string",
      allowNull: true,
    },
    urdu_unit: {
      type: "string",
      allowNull: true,
    },
    urdu_size: {
      type: "string",
      allowNull: true,
    },
    urdu_brand: {
      type: "string",
      allowNull: true,
    },
    disabled: {
      type: "boolean",
      defaultsTo: false,
    },
    deleted_by: {
      type: "number",
      allowNull: true,
      // model: "User",
    },
    updated_by: {
      type: "number",
      allowNull: true,
      // model: "User",
    },
    barcode: {
      type: "string",
      allowNull: true,
    },
    consent_required: {
      type: "boolean",
      defaultsTo: false,
    },
    location_id: {
      type: "number",
    },
    tax_inclusive: {
      type: "boolean",
      defaultsTo: false,
    },
    tax_percent: {
      type: "number",
      allowNull: true,
      columnType: "float",
      defaultsTo: 0.0,
    },
    multilingual: {
      collection: "ProductMultilingualAttribute",
      via: "productId",
    },
    tax_category: {
      type: "number",
      columnType: "int",
      required: true,
    },
    delivery_time: {
      type: "number",
      columnType: "int",
      required: false,
      allowNull: true,
    },
    quantity_limit: {
      type: "number",
      allowNull: true,
    },
    is_volume_based_price_enabled: {
      type: "boolean",
      defaultsTo: false,
    },
    volume_based_prices: {
      collection: "VolumeBasedProductPrice",
      via: "productId",
    },
    physical_stock: {
      type: "number",
      allowNull: true,
      columnType: "integer",
      defaultsTo: 0,
    },
    created_by:{
      type: "number",
      allowNull: true,
      columnType: "integer",
    },
    is_dynamic_price_enabled: {
      type: "boolean",
      defaultsTo: false,
    },
    marketplace_fvr: {
      type: "boolean",
      defaultsTo: false,
    },
  },
  afterCreate: (data, next) => {
    clearAllAssociatedSortedsetsRedis(data.id);
    clearProductFromRedis(data.id);
    clearProductCache(data).then((e) => next());
  },
  afterUpdate: (data, next) => {
    clearAllAssociatedSortedsetsRedis(data.id);
    clearProductFromRedis(data.id);
    clearProductCache(data).then((e) => next());
  },
  afterDestroy: (data, next) => {
    clearAllAssociatedSortedsetsRedis(data.id);
    clearProductFromRedis(data.id);
    clearProductCache(data).then((e) => next());
  },
  beforeUpdate: async (product, next) => {
    try {
      product.created_at =
        typeof product.created_at == "string"
          ? product.created_at.split(".")[0]
          : product.created_at;
      product.updated_at =
        typeof product.updated_at == "string"
          ? product.updated_at.split(".")[0]
          : product.updated_at;
    } catch (err) {
      console.log("PRODUCT ITEM HOOK ERROR", err);
    } finally {
      next();
    }
  },
};
