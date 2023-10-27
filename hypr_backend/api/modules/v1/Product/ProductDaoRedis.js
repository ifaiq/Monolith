const productDao = require("./ProductDao");
const {
  redisService: {
    getAsync,
    setAsync,
  },
} = require("../Redis");
const camelcaseKeys = require("camelcase-keys");
const { constants: { request: { VERSIONING: { v1 } } } } = require("../../../constants/http");
const {
  redisService: {
    setMultipleEntities,
    createSortedSet,
  },
  constants: { PRODUCT_KEY },
} = require("../Redis");

/**
 * This function takes id and returns product.
 *
 * @param {Number} id
 * @returns {Object} product
 */
const findById = async id => await findByCheckedId(id);

/**
 * This function takes the id and return product.
 *
 * @param {Number} id
 * @returns {product} product
 */
const findByCheckedId = async id => {
  sails.log.info(`getting product from redis dao ${id}`);
  const productRedisKey = `${PRODUCT_KEY}${id}`;
  sails.log.info(productRedisKey);
  let product = await getAsync(productRedisKey);
  product = !_.isEmpty(product) && JSON.parse(product);
  if (_.isEmpty(product)) {
    product = await productDao.findOneWithPopulate({ id }); // Needed multilingual obj here.
    sails.log.info(`got product from redis dao ${id} product ${product.id}`);
    await setAsync(productRedisKey, JSON.stringify(product));
  }
  sails.log.info(`set product in redis ${id} product ${product.id}`);

  const camelCasedProduct = camelcaseKeys(product, { deep: true });
  return camelCasedProduct;
};

const updateByCriteria = async (criteria, toUpdate) => {
  sails.log(`DEBUG: Product Update by Criteria Redis: Criteria: 
  ${JSON.stringify(criteria)}, ToUpdate: ${JSON.stringify(toUpdate)}`);
  const updatedProduct = await productDao.updateByCriteria(criteria, toUpdate);
  if (updatedProduct) {
    const camelCasedProduct = camelcaseKeys(updatedProduct, { deep: true });
    return camelCasedProduct;
  }

  return updatedProduct;
};

const setProductsSortedSet = async (key, products, scoreOn) => {
  const logIdentifier = `API version: ${v1}, Context: ProductDaoRedis.setProductsSortedSet()`;
  try {
    const zsetRes = await createSortedSet(key, products, scoreOn);
    return zsetRes;
  } catch (err) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(err.stack || err)}`);
    return err;
  }
};

const setProducts = async products => {
  const logIdentifier = `API version: ${v1}, Context: ProductDaoRedis.setProducts()`;
  try {
    const msetResponse = await setMultipleEntities(PRODUCT_KEY, products);
    return msetResponse;
  } catch (err) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(err.stack || err)}`);
    return err;
  }
};

module.exports = {
  findById,
  updateByCriteria,
  setProductsSortedSet,
  setProducts,
};
