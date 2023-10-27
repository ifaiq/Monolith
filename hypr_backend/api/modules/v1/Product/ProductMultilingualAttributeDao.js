/**
 * This function takes the findCriteria and value.
 *
 * @param {Number} findCriteria
 * @param {Object} value
 */
const update = async (findCriteria, value) => await ProductMultilingualAttribute.updateOne(findCriteria, value);

/**
 * This function takes the productLanguage object.
 *
 * @param {Object} productLanguage
 */
const create = async productLanguage => await ProductMultilingualAttribute.create(productLanguage);

/**
 * This function takes criteria and returns multilingualProduct.
 *
 * @param {Object} criteria
 */
const find = async criteria => await ProductMultilingualAttribute.findOne(criteria);

/**
* This function takes criteria and returns multilingualProducts.
*
* @param {Object} productIds
*/
const findAll = async criteria => await ProductMultilingualAttribute.find(criteria);

/**
 * This function takes criteria and removes multilingualProduct.
 *
 * @param {Object} criteria
 */
const remove = async criteria => await ProductMultilingualAttribute.destroyOne(criteria);

/**
 * This function takes criteria and bulk creates multilingualProduct.
 *
 * @param {Object} criteria
 */
const bulkCreate = async criteria => await ProductMultilingualAttribute.createEach(criteria);

module.exports = {
  update,
  create,
  find,
  findAll,
  remove,
  bulkCreate,
};
