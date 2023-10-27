const { constants: { request: { VERSIONING: { v1 } } } } = require("../../../constants/http");
const controller = `${v1}/CartController`;
const cartSwagger = require("./CartSwagger");

module.exports = {
  "GET /": {
    controller, action: "read", validate: "getCartValidation",
    swagger: cartSwagger.getCartValidationSchema,
  },
  "PUT /": {
    controller, action: "update", validate: "putCartValidation",
    swagger: cartSwagger.updateCartValidationSchema,
  },
  "POST  /calculateCartTotal": {
    controller, action: "calculateCartTotal", validate: "generateCartValidation",
    swagger: cartSwagger.generateCartValidationSchema,
  },
  "PUT  /updateForExternalResource": {
    controller, action: "updateForExternalResource", validate: "putCartValidation",
    swagger: cartSwagger.updateCartForExternalResourceSchema,
  },
};
