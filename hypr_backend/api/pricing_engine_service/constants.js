const PRICING_ENGINE_BASE_URL = process.env.PRICING_ENGINE_BASE_URL || "https://dev.retailo.me/pricing-engine";

module.exports = {
  URLS: {
    PRICING_ENGINE_BASE_URL,
    API_PATH: "api/v1",
    CALCULATE_PRODUCT_PRICE: "pricing-rules/calculate-product-price",
    CALCULATE_MOV: "mov-rules/calculate-mov",
  },
};
