const camelcaseKeys = require("camelcase-keys");

/**
 * This function takes a categoryId and returns all of its junctions with products
 *
 * @param {Number} categoryId
 * @returns {Array} products
 */
const findProductIdsFromCategoriesJunction = async categoryId =>
  (await ProductCategoriesJunction.find({ category_id: categoryId })).map(
    camelcaseKeys,
  );

const findByProductId = async productId =>
  (await ProductCategoriesJunction.find({ product_id: productId })).map(
    camelcaseKeys,
  );

module.exports = {
  findProductIdsFromCategoriesJunction,
  findByProductId,
};
