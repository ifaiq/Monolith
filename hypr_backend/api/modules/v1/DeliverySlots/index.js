const { addPrefixWithRoutes } = require("../../../../utils/routes");
const {
  constants: {
    request: {
      VERSIONING: { v1, prefix },
    },
  },
} = require("../../../constants/http");

const deliverySlotsService = require("./DeliverySlotsService");
const deliverySlotsRoutes = require("./DeliverySlotsRoute");
const deliverySlotsValidation = require("./DeliverySlotsJoiValidation");
const { errors: deliverySlotsError } = require("./Errors");

module.exports = {
  deliverySlotsRoutes: addPrefixWithRoutes(
    `/${prefix}/${v1}/delivery-slots`,
    deliverySlotsRoutes,
  ),
  deliverySlotsService,
  deliverySlotsValidation,
  deliverySlotsError,
};
