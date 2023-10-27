const deepLinksRoutes = require("./DeepLinksRoutes");
const { addPrefixWithRoutes } = require("../../../../utils/routes");
const {
  constants: {
    request: {
      VERSIONING: { v1, prefix },
    },
  },
} = require("../../../constants/http");

module.exports = {
  deepLinksRoutes: addPrefixWithRoutes(
    `/${prefix}/${v1}/deeplinks`,
    deepLinksRoutes,
  ),
};
