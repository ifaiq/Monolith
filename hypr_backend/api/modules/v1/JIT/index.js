const { createJITShipment,
  getProductListByJIT,
  fetchOrderCalculations,
  fetchDeliveryAndServiceCharges,
  checkJITStatusBasedOnAppVersion} = require("./JITUtils");

module.exports =
{
  createJITShipment,
  getProductListByJIT: getProductListByJIT,
  fetchOrderCalculations,
  fetchDeliveryAndServiceCharges,
  checkJITStatusBasedOnAppVersion,
};
