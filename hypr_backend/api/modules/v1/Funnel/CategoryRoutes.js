const { constants: { request: { VERSIONING: { v1 } } } } = require("../../../constants/http");
const controller = `${v1}/FunnelController`;
const categorySwagger = require("./CategorySwagger");

module.exports = {
  "GET /getCategoriesForExternalUse": {
    controller, action: "getCategoriesForExternalUse",
    validate: "getCategoriesExternalResourceValidation",
    swagger: categorySwagger.getCategoriesExternalResourceValidationSchema,
  },
  "GET /": {
    controller, action: "getCategories", validate: "getCategoriesValidation",
    swagger: categorySwagger.getCategoriesValidationSchema,
  },
  "PUT /multilingual": {
    controller, action: "updateLanguages", validate: "updateLanguages",
    swagger: categorySwagger.updateLanguagesSchema,
  },
};
