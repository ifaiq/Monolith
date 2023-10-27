const camelcaseKeys = require("camelcase-keys");
const snakecaseKeys = require("snakecase-keys");

/**
 * This function takes a customerId, productId as body and criteria, it create if not exit else reutn promise
 *
 * @param {object} body
 * @returns {Promise}
 */
const createLikeProduct = async body =>
  await LikedProductCustomerJunction.findOrCreate(
    snakecaseKeys(body),
    snakecaseKeys(body),
  );


/**
 * This function takes a customerId, productId as criteria and returns promise
 *
 * @param {object} criteria
 * @returns {Promise}
 */
const unLikeProduct = async criteria => (await LikedProductCustomerJunction.destroyOne(snakecaseKeys(criteria)));


/**
 * This function takes a customerId, returns productIds promise
 *
 * @param {Object} criteria
 * @returns {Array} ProductIds
 */
const getLikeProductIds = async ({ customerId, skip, limit }) =>
  camelcaseKeys(
    await LikedProductCustomerJunction.find({
      select: ["product_id"],
      where: { customer_id: customerId },
    })
      .sort("id", "ASC")
      .skip(skip)
      .limit(limit),
  );


module.exports = {
  createLikeProduct,
  unLikeProduct,
  getLikeProductIds,
};
