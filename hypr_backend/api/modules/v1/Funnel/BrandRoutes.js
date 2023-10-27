const { constants: { request: { VERSIONING: { v1 } } } } = require("../../../constants/http");
const brandSwagger = require("./BrandSwagger");
const controller = `${v1}/FunnelController`;

module.exports = {
  "GET /": { controller, action: "getBrands", validate: "getBrandsValidation",
    swagger: brandSwagger.getBrandValidationSchema },
};
