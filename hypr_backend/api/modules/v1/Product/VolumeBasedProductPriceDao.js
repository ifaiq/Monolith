const {
  errors: { VOLUME_BASED_PRODUCT_PRICE_NOT_FOUND },
} = require("./Errors");

/**
 * This function takes criteria and returns VolumeBasedProductPrices
 *
 * @param {Object} criteria
 * @param {Number} skip
 * @param {Number} limit
 * @returns {Object[]} VolumeBasedProductPrice
 */
const findByCriteria = async (criteria, skip, limit) =>
  await VolumeBasedProductPrice.find(criteria).skip(skip).limit(limit);

/**
 * This function takes the id and return VolumeBasedProductPrice
 *
 * @param {Number} id
 * @returns {Object} VolumeBasedProductPrice
 */
const findById = async id => {
  if (!id) {
    return null;
  }

  const volumeBasedProductPrice = await VolumeBasedProductPrice.findOne({ id });
  if (_.isEmpty(volumeBasedProductPrice)) {
    throw VOLUME_BASED_PRODUCT_PRICE_NOT_FOUND();
  }
  return volumeBasedProductPrice;
};

/**
 * This function takes the criteria and return VolumeBasedProductPrice count
 *
 * @param {Object} criteria
 * @returns {Number} total VolumeBasedProductPrices
 */
const count = async criteria => await VolumeBasedProductPrice.count(criteria);

/**
 * This function takes the id, VolumeBasedProductPrice and return updated VolumeBasedProductPrice
 *
 * @param {Number} id
 * @param {Object} volumeBasedProductPrice
 * @returns {Object} VolumeBasedProductPrice
 */
const update = async (id, volumeBasedProductPrice) =>
  await VolumeBasedProductPrice.updateOne({ id }, volumeBasedProductPrice);

/**
 * Function takes criteria to be matched to one unique entity and update entries
 * @param {Object} Criteria to be matched
 * @param {Object} Entry to be updated
 * @returns {Object} Updated entity
 */
const updateByCriteria = async (criteria, toUpdate) =>
  await VolumeBasedProductPrice.updateOne(criteria).set(toUpdate);

/**
 * This function takes the VolumeBasedProductPrice and return new VolumeBasedProductPrice
 *
 * @param {Object} volumeBasedProductPrices
 * @returns {Object} VolumeBasedProductPrice
 */
const createEach = async volumeBasedProductPrices => await VolumeBasedProductPrice.createEach(volumeBasedProductPrices);
/**
* This function takes the Ids and return delete VolumeBasedProductPrice
*
* @param {Number} product
* @returns {Object} VolumeBasedProductPrice
*/
const deleteByProductId = async productId => await VolumeBasedProductPrice.destroy({ productId: productId });

module.exports = {
  findByCriteria,
  findById,
  count,
  update,
  updateByCriteria,
  createEach,
  deleteByProductId,
};
