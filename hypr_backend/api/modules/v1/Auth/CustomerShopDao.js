/**
 * This file is responsible for communication between service
 * and database table customer_retailer_shop_details.
 */

const snakecaseKeys = require("snakecase-keys");
const customerRetailerShopExtractionService =
  require("../../../user_service_extraction/customerRetailerShopDetailService");
/**
 * This method is responsible to add a new shop
 * @param shop to be saved
 */
const createShop = async shop => await CustomerRetailerShopDetails.create(shop);

/**
 * This method is responsible to update a shop
 * @param shop to be updated
 */
const updateShop = async (customerId, shop) =>
  await CustomerRetailerShopDetails.update(snakecaseKeys({ customerId }), shop);

/**
 * This method is responsible to find customer shop's details by customerId
 * @param customerId for whom shop details to be fetched
 * @returns {Promise<*>} shop details
 */
const findShopByCustomerId = async customerId => {
  if (!customerId) {
    return {};
  }

  return await customerRetailerShopExtractionService.findOne({ customer_id: customerId });
};


module.exports = {
  createShop,
  findShopByCustomerId,
  updateShop,
};
