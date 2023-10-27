const camelcaseKeys = require("camelcase-keys");
const snakecaseKeys = require("snakecase-keys");
const { errors: { CATEGORY_NOT_FOUND } } = require("./Errors");
const { CATEGORY_TYPE } = require("./Constants");

/**
 * This function takes a categoryId and returns all of its enabled subcategories
 *
 * @param {Number} categoryId
 * @returns {Array} subcategories
 */
const findEnabledCategoriesByParentCategoryId = async categoryId =>
  (
    await Categories.find({
      parent: categoryId,
      disabled_at: null,
      type: CATEGORY_TYPE.CATEGORY,
    })
      .sort("priority")
      .populate("multilingual")
  ).map(camelcaseKeys);

/**
 * This function takes a locationId and returns all of its L1/parent categories
 *
 * @param {Number} locationId
 * @returns {Array} categories
 */
const findEnabledParentCategoriesByLocationId = async locationId =>
  (
    await Categories.find({
      location_id: locationId,
      parent: null,
      disabled_at: null,
      type: CATEGORY_TYPE.CATEGORY,
    })
      .sort("priority")
      .populate("multilingual")
  ).map(camelcaseKeys);

/**
 * This function takes the id and returns categories.
 *
 * @param {Number} id
 * @returns {Array} categories
 */
const find = async id => await findByCheckedId(id);


/**
 * This function takes ids and returns categories.
 *
 * @param {Array} ids
 * @returns {Array} categories
 */
const findManyByIds = async ids =>
  (
    await Categories.find({ id: ids }).sort("priority").populate("multilingual")
  ).map(camelcaseKeys);

/**
 * This function takes skip and limit params and return categories.
 *
 * @param {Number} skip
 * @param {Number} limit
 * @returns {Array} categories
 */
const findAll = async (skip, limit) => await Categories.find().skip(skip).limit(limit);

/**
 * This function takes criteria and returns non-disabled categories count.
 *
 * @param {Object} criteria
 * @returns {Number} total categories
 */
const count = async criteria => {
  criteria.disabledAt = null;
  return await Categories.count(snakecaseKeys(criteria));
};

/**
 * This function takes the id, category and return updated category.
 *
 * @param {Number} id
 * @param {Object} category
 * @returns {Object} category
 */
const update = async (id, category) => await Categories.updateOne({ id }).set(category);

/**
 * This function takes category object and returns newly created category.
 *
 * @param {Object} category
 * @returns {Object} category
 */
const create = async category => await Categories.create(category);

/**
 * This function takes the id and return category.
 *
 * @param {Number} id
 * @returns {Object} category
 */
const findByCheckedId = async id => {
  const category = await Categories.findOne({ id });
  if (_.isEmpty(category)) {
    throw CATEGORY_NOT_FOUND();
  }
  return category;
};

/**
 * This function takes a brandId and returns all of its enabled subBrands
 *
 * @param {Number} brandId
 * @returns {Array} subBrands
 */
const findEnabledSubbrandsByParentBrandId = async brandId =>
  (
    await Categories.find({
      parent: brandId,
      disabled_at: null,
      type: CATEGORY_TYPE.BRAND,
    })
      .sort("priority")
      .populate("multilingual")
  ).map(camelcaseKeys);

/**
 * This function takes a locationId and returns all of its L1/parent brands
 *
 * @param {Number} locationId
 * @returns {Array} brands
 */
const findEnabledParentBrandsByLocationId = async locationId =>
  (
    await Categories.find({
      location_id: locationId,
      parent: null,
      disabled_at: null,
      type: CATEGORY_TYPE.BRAND,
    })
      .sort("priority")
      .populate("multilingual")
  ).map(camelcaseKeys);

/**
* This function takes criteria and returns category.
*
* @param {Number} criteria
* @returns {product} category
*/
const findByCriteria = async criteria =>
  camelcaseKeys(
    await Categories.find(snakecaseKeys(criteria)).populate("multilingual"),
  );

/**
 * Make query according to the params
 * @param {Number} category_id
 * @param {Number} type (0/1)(category/brand)
 * @param {String} disabled_at_string (disabled_at)
 * @param {String} parent_id (L1, L2)
 * @param {Number} location_id
 * @returns
 */
const makeQueryForCategories = (category_id, type, disabled_at_string, parent_id, location_id) => {
  let query = "select * from categories where deleted_at IS NULL";
  if(category_id) {
    query += ` AND id in (${category_id})`;
  }
  if(type) {
    query += ` AND type = ${type}`;
  }
  const disabled_at = (disabled_at_string === "exist");
  if(disabled_at) {
    query += " AND disabled_at IS NOT NULL";
  }
  if(location_id) {
    query += ` AND location_id = ${location_id}`;
  }
  if(parent_id) {
    if(parent_id === "L1") {
      query += " AND parent_id IS NULL";
    } else if(parent_id === "L2") {
      query += " AND parent_id IS NOT NULL";
    }
  }
  return query;
};

module.exports = {
  findAll,
  create,
  update,
  count,
  find,
  findEnabledCategoriesByParentCategoryId,
  findEnabledParentCategoriesByLocationId,
  findManyByIds,
  findEnabledSubbrandsByParentBrandId,
  findEnabledParentBrandsByLocationId,
  findByCriteria,
  makeQueryForCategories,
};
