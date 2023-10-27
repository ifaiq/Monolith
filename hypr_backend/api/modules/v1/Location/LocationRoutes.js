const { constants: { request: { VERSIONING: { v1 } } } } = require("../../../constants/http");
const controller = `${v1}/LocationController`;
const locationSwagger = require("./LocationSwagger");

module.exports = {
  "GET /:id": {
    controller, action: "getLocationById", validate: "getLocationValidation",
    swagger: locationSwagger.getLocationValidationSchema,
  },
  "GET /:id/banners": {
    controller, action: "getBanners", validate: "getBannersValidation",
    swagger: locationSwagger.getBannersValidationSchema,
  },
  "PUT /:id/banners": {
    controller, action: "createOrUpdateBanners", validate: "putBannersValidation",
    swagger: locationSwagger.putBannersValidationSchema,
  },
  "DELETE /:id/banners": {
    controller, action: "deleteLocationBanners", validate: "removeBannersValidation",
    swagger: locationSwagger.removeBannersValidationSchema,
  },
  "GET /getStoreFeatures": { controller, action: "getStoreFeatures", validate: "" },
  "GET /": {
    controller, action: "getLocationsByCriteria", validate: "getLocationsByBusinessUnitValidation",
    swagger: locationSwagger.getLocationsByBusinessUnitValidationSchema,
  },
  "GET /portal/:id": {
    controller, action: "getLocationByIdForPortal", validate: "getLocationValidation",
    swagger: locationSwagger.getLocationValidationSchema,
  },
};
