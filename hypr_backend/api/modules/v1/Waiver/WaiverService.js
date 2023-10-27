const { findbyCriteria } = require("./WaiverDao");
const { constants: { WAIVER } } = require("../../../constants/services");
const orderDoa = require("../Order/OrderAmountAdjustmentDao");

/**
 * This function takes orderId and returns waiverAmount.
 *
 * @param {Number} orderId
 * @returns {Number} waiverAmount
 */
const findWaiverAmount = async orderId => {
  let waiverAmount = 0;
  const orderWaiver = await orderDoa.findbyCriteria({ orderId, contextName: WAIVER, deletedAt: null });
  if (!_.isEmpty(orderWaiver)) {
    const waiver = await findbyCriteria({ id: orderWaiver.contextId });
    waiverAmount = waiver ? waiver.amount : 0;
  }
  return waiverAmount;
};

module.exports = {
  findWaiverAmount,
};
