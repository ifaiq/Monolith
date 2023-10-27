const { globalConf: { redisEnv, redisServer } } = require("../../../../config/globalConf");

module.exports = {
  constants: {
    cart: "cart",
    product: "product",
    FUNNEL_PRODUCTS_KEY: ":funnelProducts:",
    FUNNEL_KEY: ":funnels:",
    CATEGORY_SUBCATEGORIES_KEY: ":categorySubcategories:",
    LOCATION_CATEGORIES_KEY: ":locationCategories:",
    PRODUCT_KEY: ":products:",
    BRAND_SUBBRANDS_KEY: ":brandSubBrands:",
    LOCATION_BRANDS_KEY: ":locationBrands:",
    FUNNEL_JIT_PRODUCTS_KEY: ":funnelProducts_jit:",
  },
  redisEnv,
  redisServer,
};
