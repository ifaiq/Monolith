const { builder } = require("../Utils");
const {
  CAC_TAGS,
  CBC_TAGS,
} = require("../Constants");

function setPaymentMeans(code) {
  return builder
    .create(CAC_TAGS.PAYMENT_MEANS)
    .ele(CBC_TAGS.PAYMENT_MEANS_CODE)
    .text(code);
}

module.exports = {
  setPaymentMeans,
};
