const {
  CAC_TAGS,
  CBC_TAGS,
} = require("../Constants");
const { builder } = require("../Utils");

function setDelivery(deliveryDate) {
  return builder
    .create(CAC_TAGS.DELIVERY)
    .ele(CBC_TAGS.ACTUAL_DELIVERY_DATE)
    .text(deliveryDate);
}

module.exports = {
  setDelivery,
};
