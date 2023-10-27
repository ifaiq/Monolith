const camelcaseKeys = require("camelcase-keys");
const snakecaseKeys = require("snakecase-keys");

/**
* This function takes category ids and returns max product priorities.
*
* @param {Array} categoryId
* @returns {Array} maxProductPriority
*/
const findMaxProductPriority = async categoryId =>
  camelcaseKeys(
    (
      await ProductCategoriesJunction.find(snakecaseKeys({ categoryId }))
        .sort("product_priority DESC")
        .limit(1)
    )[0],
  );

module.exports = {
  findMaxProductPriority,
};
