const {
  constants: {
    request: {
      VERSIONING: { v1 },
    },
  },
} = require("../../../constants/http");
const orderFeedbackSwagger = require("./OrderFeedbackSwagger");

const controller = `${v1}/OrderFeedbackController`;

module.exports = {
  "POST /": {
    controller,
    action: "createFeedback",
    validate: "createOrderFeedbackValidation",
    swagger: orderFeedbackSwagger.createOrderFeedbackValidationSchema,
  },
  "GET /order": {
    controller,
    action: "getOrderFeedback",
    validate: "getOrderFeedbackValidation",
    swagger: orderFeedbackSwagger.getOrderFeedbackValidationSchema,
  },
  "GET /customer": {
    controller,
    action: "getCustomerFeedback",
    validate: "getCustomerFeedbackValidation",
    swagger: orderFeedbackSwagger.getCustomerFeedbackValidationSchema,
  },
  "GET /feedback-missing-order": {
    controller,
    action: "getFeedbackMissingOrder",
    validate: "getFeedbackMissingOrderValidation",
    swagger: orderFeedbackSwagger.getFeedbackMissingOrderValidationSchema,
  },
};
