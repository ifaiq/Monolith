const { constants: { request: { VERSIONING: { v1 } } } } = require("../../../constants/http");
const controller = `${v1}/productController`;
const productSwagger = require("./ProductSwagger");

module.exports = {
  "GET /": {
    controller,
    action: "getProducts",
    validate: "getProductsValidation",
    swagger: productSwagger.getProductsValidationSchema,
  },
  "GET /getProductsFromSkus": {
    controller,
    action: "getProductsFromSkus",
    validate: "getProductsFromSkusValidation",
    swagger: productSwagger.getProductsFromSkusValidation,
  },
  "GET /searchFromEs": {
    controller,
    action: "searchFromEs",
    validate: "searchFromEsValidation",
    swagger: productSwagger.searchFromEsValidationSchema,
  },
  "PUT /multilingual": {
    controller,
    action: "updateLanguages",
    validate: "updateLanguages",
    swagger: productSwagger.updateLanguagesSchema,
  },
  "POST /liked": {
    controller,
    action: "likeProduct",
    validate: "likeProductValidation",
    swagger: productSwagger.likeProductValidationSchema,
  },
  "GET /liked": {
    controller,
    action: "getLikedProducts",
    validate: "getLikeProductsValidation",
    swagger: productSwagger.getLikeProductsValidationSchema,
  },
  "GET /previousOrderedItems": {
    controller,
    action: "previousOrderedItems",
    validate: "getLikeProductsValidation",
    swagger: productSwagger.getLikeProductsValidationSchema,
  },
  "GET /frequentlyOrderedItems": {
    controller,
    action: "frequentlyOrderedItems",
    validate: "getLikeProductsValidation",
    swagger: productSwagger.getLikeProductsValidationSchema,
  },
  "GET /recommendedProducts": {
    controller,
    action: "recommendedProducts",
    validate: "recommendedProductsValidation",
    swagger: productSwagger.recommendedProductsValidationSchema,
  },
  "POST /upsertRecommendedProducts": {
    controller,
    action: "upsertRecommendedProducts",
    validate: "upsertRecommendedProductValidation",
    swagger: productSwagger.upsertRecommendedProductValidationSchema,
  },
  "POST /upsertGenericProducts": {
    controller,
    action: "upsertGenericProducts",
    validate: "upsertGenericProductValidation",
    swagger: productSwagger.upsertGenericProductValidationSchema,
  },

  "GET /:id": {
    controller,
    action: "getProductIdForExternalResource",
    validate: "getProductIdValidation",
    swagger: productSwagger.getProductIdValidationSchema,
  },

  "GET /getProductsForExternalResource": {
    controller,
    action: "getProductsForExternalResource",
    validate: "getProductExternalResourceValidation",
    swagger: productSwagger.getProductExternalResourceValidationSchema,
  },

  "GET /portal": {
    controller,
    action: "getProductsForPortal",
    validate: "getProductsForPortalValidation",
    swagger: productSwagger.getProductsForPortalValidationSchema,
  },
};
