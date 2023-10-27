const { errors: { PRODUCT_NOT_FOUND } } = require("./Errors");
const snakecaseKeys = require("snakecase-keys");
const camelcaseKeys = require("camelcase-keys");

/**
 * This function takes ids and returns categories.
 *
 * @param {Array} ids
 * @returns {Array} categories
 */
const findManyByIds = async ids =>
  (await Product.find({ id: ids }).populate("multilingual").populate("volume_based_prices")).map(camelcaseKeys);

/**
 * This function takes skus and returns products.
 *
 * @param {Array} skus
 * @returns {Array} products
 */
const findManyBySkus = async skus =>
  await Product.find({ sku: skus });

/**
 * This function takes a list of productIds and locationId and returns all products which are not disabled
 *
 * @param {Array} productIds
 * @param {Number} skip
 * @param {Number} limit
 * @returns {Array} products
 */
const findEnabledProductsByIds = async (productIds, locationId) =>
  (await Product.find({ id: productIds, disabled: 0, location_id: locationId})
    .populate("multilingual").populate("volume_based_prices")).map(camelcaseKeys);

/**
 * This function takes a list of productIds and locationId and returns all products
 * which are not disabled and does not have delivery time
 *
 * @param {Array} productIds
 * @param {Number} skip
 * @param {Number} limit
 * @returns {Array} products
 */
const findNonJitEnabledProductsByIds = async (productIds, locationId) =>
  (await Product.find({ id: productIds, disabled: 0, delivery_time: null, location_id: locationId})
    .populate("multilingual").populate("volume_based_prices"))
    .map(camelcaseKeys);

/**
 * This function takes the id and return product.
 *
 * @param {Number} id
 * @returns {Object} product
 */
const findById = async id => await findByCheckedId(id);

/**
 * This function takes the skip, limit and return products.
 *
 * @param {Number} skip
 * @param {Number} limit
 * @returns {Product[]} products
 */
const findAll = async (skip, limit) => await Product.find().skip(skip).limit(limit);

/**
 * This function takes the criteria and return product count.
 *
 * @param {Object} criteria
 * @returns {Number} total products
 */
const count = async criteria => await Product.count(criteria);

/**
 * This function takes the id, product and return updated product.
 *
 * @param {Number} id
 * @param {Object} product
 * @param connection
 * @returns {Object} product
 */
const update = async (id, product, connection = null) => {
  let updatePromise = Product.updateOne({ id }, snakecaseKeys(product));
  if (connection) {
    updatePromise = updatePromise.usingConnection(connection);
  }
  return camelcaseKeys(await updatePromise);
};

/**
 * Function takes criteria to be matched to one unique entity and update enteries in toUpdate
 * @param {Object} Criteria to be matched
 * @param {Object} Entries to be updated
 * @returns {Object} Updated entity
 */
const updateByCriteria = async (criteria, toUpdate) => await Product.updateOne(criteria).set(toUpdate);

/**
 * This function takes the product and return new product.
 *
 * @param {Object} product
 * @returns {Object} product
 */
const create = async product => await Product.create(product);

/**
* This function takes the id and return product.
*
* @param {Number} id
* @returns {product} product
*/
const findByCheckedId = async id => {
  const product = await Product.findOne({ id });
  if (_.isEmpty(product)) {
    throw PRODUCT_NOT_FOUND;
  }
  return camelcaseKeys(product);
};

/**
 * This function takes the id and subCriteria return product.
 *
 * @param {Number} id
 * @param {Number} subCriteria
 * @returns {Object} product
 */
const findOneWithPopulate = async ({ id }, subCriteria = {}) => {
  const product = await Product.findOne({ id }).populate("multilingual", subCriteria).populate("volume_based_prices");
  if (_.isEmpty(product)) {
    throw PRODUCT_NOT_FOUND();
  }
  return camelcaseKeys(product);
};

/**
* This function takes criteria and returns product.
*
* @param {Number} criteria
* @returns {product} product
*/
const findByCriteria = async criteria =>
  camelcaseKeys(
    await Product.find(snakecaseKeys(criteria)).populate("multilingual").populate("volume_based_prices"),
  );


const recommendedProductsByCustomer = async customerId => {
  const productList = await RecommendedProductSQL.findOne({ customer_id: customerId });
  if (_.isEmpty(productList)) {
    return [];
  }
  return JSON.parse(productList.product_ids);
};
const genericRecommendedProducts = async locationId => {
  const productList = await GenericProduct.findOne({ location_id: locationId });
  if (_.isEmpty(productList)) {
    throw PRODUCT_NOT_FOUND();
  }
  return JSON.parse(productList.product_ids);
};

/**
 * This function takes a list of productIds, locationId and returns all products which are not disabled
 *
 * @param {Array} productIds
 * @param {Number} locationId
 * @returns {Array} products
 */
const findEnabledProductsByLocationAndIds = async (productIds, locationId) =>
  (
    await Product.find({
      id: productIds,
      disabled: 0,
      location_id: locationId,
    }).populate("multilingual").populate("volume_based_prices")
  ).map(camelcaseKeys);

/**
 * This function takes a list of productIds, locationId and returns all products
 * which are not disabled and doesnot have delivery time
 *
 * @param {Array} productIds
 * @param {Number} locationId
 * @returns {Array} products
 */
const findNonJitEnabledProductsByLocationAndIds = async (productIds, locationId) =>
  (
    await Product.find({
      id: productIds,
      disabled: 0,
      location_id: locationId,
      delivery_time: null,
    }).populate("multilingual").populate("volume_based_prices")
  ).map(camelcaseKeys);

/**
 * This function takes a list of productIds, locationId and returns all products which are not disabled
 *
 * @param {Number} locationId
 * @returns {Array} products
 */
const findEnabledProductsByLocation = async locationId =>
  (
    await Product.find({
      disabled: 0,
      location_id: locationId,
    }).populate("multilingual").populate("volume_based_prices")
  ).map(camelcaseKeys);

/**
 * This function takes a list of productIds, locationId and returns all products
 * which are not disabled and doesnot have delivery time
 *
 * @param {Number} locationId
 * @returns {Array} products
 */
const findNonJitEnabledProductsByLocation = async locationId =>
  (
    await Product.find({
      disabled: 0,
      location_id: locationId,
      delivery_time: null,
    }).populate("multilingual").populate("volume_based_prices")
  ).map(camelcaseKeys);

/**
 * This function takes a list of productIds, locationId and returns all
 * products which are not disabled and not out of stocks
 *
 * @param {Array} productIds
 * @param {Number} locationId
 * @returns {Array} products
 */
const findProductsByLocationAndIdsWithStock = async (productIds, locationId) =>
  (
    await Product.find({
      id: productIds,
      disabled: 0,
      location_id: locationId,
      stock_quantity: { ">": 0 },
    }).populate("multilingual").populate("volume_based_prices")
  ).map(camelcaseKeys);

/**
 * This function takes a list of productIds, customerId and returns
 * updated or new created object
 *
 * @param {Array} productIds
 * @param {Number} customerId
 * @returns {Object} product
 */
const createOrUpdateRecommendedProduct = async (customerId, productIds) => {
  let product = await RecommendedProductSQL.updateOne({ customer_id: customerId }).set({
    customer_id: customerId,
    product_ids: JSON.stringify(productIds),
  });
  if (!product) {
    product = await RecommendedProductSQL
      .create({ customer_id: customerId, product_ids: JSON.stringify(productIds) })
      .fetch();
  }
  product = { ...productList, product_ids: JSON.parse(productList.product_ids) };
  return camelcaseKeys(product);
};

/**
 * This function takes a list of productIds, locationId and returns
 * updated or new created object
 *
 * @param {Array} productIds
 * @param {Number} locationId
 * @returns {Object} product
 */
const createOrUpdateGenericProduct = async (locationId, productIds) => {
  let product = await GenericProduct.updateOne({ location_id: locationId }).set({
    location_id: locationId,
    product_ids: JSON.stringify(productIds),
  });
  if (!product) {
    product = await GenericProduct.create({
      location_id: locationId,
      product_ids: JSON.stringify(productIds),
    }).fetch();
  }
  product = { ...product, product_ids: JSON.parse(product.product_ids) };
  return camelcaseKeys(product);
};

/**
 * This function takes ids and criteria and returns products.
 *
 * @param {Array} ids
 * @returns {Array} products
 */

const findManyByIdsWithCriteria = async (ids, subCriteria = {}) =>
  (await Product.find({ id: ids })
    .populate("multilingual", subCriteria)
    .populate("volume_based_prices"))
    .map(camelcaseKeys);

/**
 * This function takes skus as criteria and returns productIds.
 *
 * @param {Array} skus
 * @returns {Array} products
 */

const findManyProductIdsBySkus = async skus =>
  (await Product.find({ select: ["id", "sku"], where: { sku: skus } })).map(camelcaseKeys);


module.exports = {
  findEnabledProductsByIds,
  findById,
  findAll,
  create,
  update,
  updateByCriteria,
  count,
  findManyByIds,
  findManyBySkus,
  findByCriteria,
  findOneWithPopulate,
  recommendedProductsByCustomer,
  genericRecommendedProducts,
  findEnabledProductsByLocationAndIds,
  findEnabledProductsByLocation,
  findProductsByLocationAndIdsWithStock,
  createOrUpdateRecommendedProduct,
  createOrUpdateGenericProduct,
  findNonJitEnabledProductsByIds,
  findNonJitEnabledProductsByLocationAndIds,
  findNonJitEnabledProductsByLocation,
  findManyByIdsWithCriteria,
  findManyProductIdsBySkus,
};
