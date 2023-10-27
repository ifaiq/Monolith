// const { getTax } = require("./TaxCalulation");
const { constants: { FLAT } } = require("../../../../constants/services");
const Big = require("big.js");

/**
 * This function takes the order item and calculates the total price of order items.
 *
 * @param {Object} product
 * @param {Number} quantity
 * @returns {Decimal} total
 */
const calculateTotal = (product, quantity) => {
  // const { taxPercent, taxInclusive } = product;
  const { price } = product;
  // price = taxInclusive ? calculateExclusiveTaxPrice(price, getTax(taxPercent, price)) : price;
  return parseFloat(Big(price).times(Big(quantity)));
};

/**
 * This function takes the price, tax and calculates the exclusive price.
 *
 * @param {Decimal} price
 * @param {Decimal} tax
 * @returns {Decimal} price
 */
const calculateExclusiveTaxPrice = (price, taxPercent) => parseFloat(price - (price / ((100 / taxPercent) + 1)));

/**
 * This function takes the price and tax amount and calculates the exclusive price.
 *
 * @param {Decimal} price
 * @param {Decimal} taxAmount
 * @returns {Decimal} price
 */
const subtractTaxFromConsumerPrice = (price, taxAmount) => parseFloat(Big(price).minus(Big(taxAmount)));

/**
 * This function takes the total, tax, couponDiscount, serviceCharge, deliveryCharge and calculates the grand total.
 *
 * @param {Decimal|Number} total
 * @param {Decimal|Number} tax
 * @param {Decimal|Number} couponDiscount
 * @param {Decimal|Number} serviceCharge
 * @param {Decimal|Number} deliveryCharge
 * @returns {Decimal} grandTotal
 */
// TODO REMOVE couponDiscount from grand total calculation,
// prices passed to this function will already be adjusted for discount
const calculateGrandTotal = (
  total,
  tax,
  couponDiscount = 0,
  serviceCharge = 0,
  deliveryCharge = 0,
) =>
  parseFloat(
    Big(total)
      .plus(Big(tax))
      .plus(Big(-1).times(Big(couponDiscount)))
      .plus(Big(serviceCharge))
      .plus(Big(deliveryCharge)),
  );

const getChargeValue = (type, value, total) =>
  type === FLAT ? value : parseFloat((Big(value).div(Big(100))).times(Big(total)));


/**
 * This function takes the type, value, total and calculates the service charge.
 *
 * @param {String} type
 * @param {Number} value
 * @param {Decimal|Number} total
 * @returns {Decimal }service charge value
 */
const calculateServiceCharge = (type, value, total) => getChargeValue(type, value, total);

/**
 * This function takes the type, value, total and calculates the delivery charge.
 *
 * @param {String} type
 * @param {Number} value
 * @param {Decimal|Number} total
 * @returns {Decimal} delivery charge value
 */
const calculateDeliveryCharge = (type, value, total) => getChargeValue(type, value, total);

/**
* This function takes the price, quantity, tax and calculates the total for one item.
*
* @param {Number|DEecimal} price, quantity, tax
* @param {Number} quantity
* @param {Number|Decimal} tax
* @returns {Decimal} total
*/
const calculateItemTotal = (price, quantity, tax) => parseFloat((Big(price).plus(Big(tax))).times(Big(quantity)));

/**
 * Function calculates baseprice from mrp
 * @param mrp: number
 * @param taxPercent: number
 * @returns number
 */
const calculateBasePriceFromMRP = (mrp, taxPercent) =>
  parseFloat(
    Big(mrp).minus(Big(mrp).div(Big(100).div(Big(taxPercent)).plus(Big(1)))),
  );

/**
 * Function calculates baseprice from mrp
 * @param mrp: number
 * @param taxPercent: number
 * @returns number
 */
const calculateMRPTaxExclusivePrice = (price, mrpTax) => parseFloat(Big(price).minus(Big(mrpTax)));

/**
 * Function calculates consumer price given taxExclusivePrice and tax
 * @param {Number} taxExclusivePrice
 * @param {Number} tax
 * @returns {Number} sum of both inputs
 */
const calculateConsumerPrice = (taxExclusivePrice, tax) => parseFloat((Big(taxExclusivePrice).plus(Big(tax))));

/**
 * Function subtracts discount from total_payment to calculate grandTotal
 * @param total
 * @param discount
 * @return grandTotal
 */
const getPaymentPrice = (total, discount = 0, creditBuyFee = 0, volumeBasedDiscount = 0) => {
  let totalPrice = total;
  if (discount && !isNaN(discount)) {
    totalPrice = parseFloat(Big(totalPrice).minus(Big(discount)));
  }
  if (creditBuyFee && !isNaN(creditBuyFee)) {
    totalPrice = parseFloat(Big(totalPrice).plus(Big(creditBuyFee)));
  }

  if (volumeBasedDiscount > 0) {
    totalPrice = parseFloat(Big(totalPrice).minus(Big(volumeBasedDiscount)));
  }

  return totalPrice;
};

/**
 * Function calculates sub_total (amount without any discount applied) for frontend consumers to use
 * @param {Number} grandTotal
 * @param {Number} discount
 * @returns {Number} sum of all inputs
 */
const getSubTotal = (grandTotal, discount, volumeBasedDiscount = 0) =>
  parseFloat(
    Big(grandTotal).plus(Big(discount)).plus(Big(volumeBasedDiscount)),
  );

/**
 * Function subtracts waiver amount from grandTotal
 * @param grandTotal
 * @param waiver
 * @return number
 */
const subtractWaiver = (grandTotal = 0, waiver = 0) => parseFloat((Big(grandTotal).minus(Big(waiver))));

const checkFreeDeliveryElgibleFee = (
  total,
  tax = 0) => parseFloat((Big(total).plus(tax)));

const getVolumeBasedProductPriceByQuantity = (
  product,
  quantity,
  convertVolumeBasedPriceToBaseCurrency = false,
  baseCurrencyMultiplier = 1,
) => {
  let volumeBasedPrice = product.price;
  let selectedTier = 1;

  if (!product.isVolumeBasedPriceEnabled) {
    return { volumeBasedPrice, selectedTier };
  }

  const sortedVolumeBasedProducts = product.volumeBasedPrices
    .slice()
    .sort((a, b) => b.quantityFrom - a.quantityFrom); // sorted by quantityFrom desc

  const tierLength = sortedVolumeBasedProducts.length;

  for (const [index, volumeBasedProductPrice] of sortedVolumeBasedProducts.entries()) {
    if (
      !volumeBasedProductPrice.disabled &&
      quantity >= volumeBasedProductPrice.quantityFrom
    ) {
      volumeBasedPrice = volumeBasedProductPrice.price;
      selectedTier = tierLength - index;
      break;
    }
  }

  volumeBasedPrice = convertVolumeBasedPriceToBaseCurrency
    ? parseFloat(volumeBasedPrice * baseCurrencyMultiplier)
    : parseFloat(volumeBasedPrice);

  return { volumeBasedPrice, selectedTier };
};

module.exports = {
  calculateDeliveryCharge,
  calculateServiceCharge,
  calculateGrandTotal,
  calculateTotal,
  calculateItemTotal,
  calculateExclusiveTaxPrice,
  subtractTaxFromConsumerPrice,
  calculateBasePriceFromMRP,
  calculateMRPTaxExclusivePrice,
  calculateConsumerPrice,
  getPaymentPrice,
  getSubTotal,
  subtractWaiver,
  getVolumeBasedProductPriceByQuantity,
  checkFreeDeliveryElgibleFee,
};
