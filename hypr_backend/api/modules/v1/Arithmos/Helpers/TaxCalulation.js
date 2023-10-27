const Big = require("big.js");


/**
 * This function takes the tax, quantity and calculates the total tax.
 *
 * @param {Decimal} tax
 * @param {Number} quantity
 * @returns {Decimal} totalTax
 */
const getTotalTax = (tax, quantity) => parseFloat(Big(tax).times(Big(quantity)));

/**
 * This function takes the product and product quantity and calculates the tax amount.
 *
 * Product has tax percentage number and actual price in it this function calculate tax by getting a
 * percentage and apply it to the price of the product and then apply this tax to the quantity of the
 * product to get total tax on the product.
 *
 * @param {Object} product
 * @param {Number} quantity
 * @returns {Decimal} totalTax
 */
const calculateTax = (product, quantity) => {
  const { tax } = product;
  return getTotalTax(tax, quantity);
};

/**
 * This function takes the taxPercentage, price and calculates the tax value.
 *
 * @param {Decimal} taxPercentage
 * @param {Decimal} price
 * @returns {Decimal} tax
 */
const getTax = (taxPercentage, price) => parseFloat((Big(taxPercentage).div(Big(100))).times(Big(price)));

/**
 * This function takes the tax, price and returns tax percentage
 *
 * @param {Decimal} taxPercentage
 * @param {Decimal} price
 * @returns {Decimal} tax
 */
const getTaxPercentage = (tax, price) => parseFloat((Big(tax).div(Big(price))).times(Big(100)));

module.exports = {
  calculateTax,
  getTax,
  getTotalTax,
  getTaxPercentage,
};
