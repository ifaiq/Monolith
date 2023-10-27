const errors = {

  PRODUCT_NOT_FOUND: () => ({
    code: 1300,
    message: sails.__("PRODUCT_NOT_FOUND"),
  }),
  PRODUCT_DISABLED: productName => ({
    code: 1301,
    message: sails.__("PRODUCT_DISABLED", productName),
  }),
  PRODUCT_OUT_OF_STOCK: productName => ({
    code: 1302,
    message: sails.__("PRODUCT_OUT_OF_STOCK", productName),
  }),
  PRODUCT_STOCK_LOWER: productName => ({
    code: 1303,
    message: sails.__("PRODUCT_STOCK_LOWER", productName),
  }),
  INVALID_PRODUCT_LOCATION: productName => ({
    code: 1304,
    message: sails.__("INVALID_PRODUCT_LOCATION", productName),
  }),
  FUNNEL_PRODUCTS_NOT_FOUND: () => ({
    code: 1305,
    message: sails.__("FUNNEL_PRODUCTS_NOT_FOUND"),
  }),
  VOLUME_BASED_PRODUCT_PRICE_NOT_FOUND: () => ({
    code: 1306,
    message: sails.__("VOLUME_BASED_PRODUCT_PRICE_NOT_FOUND"),
  }),
};

module.exports = { errors };
