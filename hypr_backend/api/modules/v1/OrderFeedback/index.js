const orderFeedbackRoutes = require("./OrderFeedbackRoutes");
const { addPrefixWithRoutes } = require("../../../../utils/routes");
const {
  constants: {
    request: {
      VERSIONING: { v1, prefix },
    },
  },
} = require("../../../constants/http");
const orderFeedbackService = require("./OrderFeedbackService");

module.exports = {
  orderFeedbackRoutes: addPrefixWithRoutes(
    `/${prefix}/${v1}/order-feedback`,
    orderFeedbackRoutes,
  ),
  orderFeedbackService,
};
