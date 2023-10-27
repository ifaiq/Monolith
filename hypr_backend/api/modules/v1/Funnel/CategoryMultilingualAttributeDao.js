/**
 * This function takes the findCriteria and value.
 *
 * @param {Number} findCriteria
 * @param {Object} value
 */
const update = async (findCriteria, value) => await CategoryMultilingualAttribute.updateOne(findCriteria, value);


/**
 * This function takes the productLanguage object.
 *
 * @param {Object} categoryLanguage
 */
const create = async categoryLanguage => await CategoryMultilingualAttribute.create(categoryLanguage);

/**
 * This function takes criteria and returns multilingualCategory.
 *
 * @param {Object} criteria
 */
const find = async criteria => await CategoryMultilingualAttribute.findOne(criteria);

/**
 * This function takes criteria and returns all multilingualCategory.
 *
 * @param {Object} criteria
 */
const findAll = async criteria => await CategoryMultilingualAttribute.find(criteria);

/**
 * This function takes criteria and removes multilingualCategory.
 *
 * @param {Object} criteria
 */
const remove = async criteria => await CategoryMultilingualAttribute.destroyOne(criteria);

/**
* This function takes criteria and bulk creates multilingualCategory.
*
* @param {Object} criteria
*/
const bulkCreate = async criteria => await CategoryMultilingualAttribute.createEach(criteria);


module.exports = {
  update,
  create,
  find,
  findAll,
  remove,
  bulkCreate,
};
