const {
  constants: {
    request: {
      VERSIONING: { v1 },
    },
  },
} = require("../../../constants/http");

const deliverySlotsSwagger = require("./DeliverySlotsSwagger");
const controller = `${v1}/DeliverySlotsController`;

module.exports = {
  "GET /portal": {
    controller,
    action: "getDeliverySlotsPortal",
    validate: "getDeliverySlotsValidation",
    swagger: deliverySlotsSwagger.getDeliverySlotsForPortalSchema,
  },
  "GET /": {
    controller,
    action: "getDeliverySlots",
    validate: "getDeliverySlotsValidation",
    swagger: deliverySlotsSwagger.getDeliverySlotsForConsumerSchema,
  },
  "PUT /": {
    controller,
    action: "upsertDeliverySlotsForPortal",
    validate: "upsertDeliverySlotsForPortal",
    swagger: deliverySlotsSwagger.upsertDeliverySlotsForPortalSchema,
  },
};
