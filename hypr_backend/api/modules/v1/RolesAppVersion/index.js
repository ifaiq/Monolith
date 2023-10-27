const rolesAppVersionRoutes = require("./RolesAppVersionRoutes");
const rolesAppVersionService = require("./RolesAppVersionService");
const rolesAppVersionValidator = require("./RolesAppVersionsJoiValidations");
const { addPrefixWithRoutes } = require("../../../../utils/routes");
const {
  constants: {
    request: {
      VERSIONING: { v1, prefix },
    },
  },
} = require("../../../constants/http");

module.exports = {
  rolesAppVersionRoutes: addPrefixWithRoutes(
    `/${prefix}/${v1}/rolesAppVersion`,
    rolesAppVersionRoutes,
  ),
  rolesAppVersionService,
  rolesAppVersionValidator,
};
