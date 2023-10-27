const locationService = require("./LocationService");
const locationValidator = require("./LocationValidator");
const { addPrefixWithRoutes } = require("../../../../utils/routes");
const { constants: { request: { VERSIONING: { v1, prefix } } } } = require("../../../constants/http");
const LocationRoutes = require("./LocationRoutes");

module.exports = {
  locationRoutes: addPrefixWithRoutes(`/${prefix}/${v1}/location`, LocationRoutes),
  locationService,
  locationValidator,
};
