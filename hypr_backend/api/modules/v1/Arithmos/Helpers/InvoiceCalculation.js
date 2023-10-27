const { $, multiply } = require("moneysafe");
const { TAX_CATEGORIES: { TAX_ON_MRP } } = require("../../../../services/Constants");
const { keepTwoDecimalPlacesWithoutRounding } = require("./calculationsUtils");
const { calculateBasePriceFromMRP } = require("./PriceCalculation");


/**
 * This function takes orderItems and returns invoice calculations.
 *
 * @param {Object} orderItems
 * @returns {Object} lineItems, specialLineItems, totalVat
 */
const getInvoiceCalculations = (
  orderItems,
  discount = 0,
  totalPrice,
  waiver = 0,
  creditBuyFee = 0,
  volumeBasedDiscount = 0,
  countryCode,
) => {
  const { lineItems, specialLineItems } = lineItemCalculations(orderItems, countryCode);
  const totalPriceTaxExcl = getTotalTaxExclPrice(lineItems);
  const totalItemsVAT = _.sum(_.map(lineItems, "taxAmount"));
  const calculatedTaxRate = calculateFinalTaxRate(totalItemsVAT, totalPriceTaxExcl);
  const totalDiscount = getTotalDiscount(discount, waiver, volumeBasedDiscount);
  const taxAdjustment = keepTwoDecimalPlacesWithoutRounding(getTaxAdjustment(totalDiscount, calculatedTaxRate));
  const netDiscount = getNetDiscount(totalDiscount, taxAdjustment);
  const ajilHandlingFee = keepTwoDecimalPlacesWithoutRounding($(creditBuyFee).toNumber()) / (1 + calculatedTaxRate);
  const taxableAmount = keepTwoDecimalPlacesWithoutRounding(
    getTotalTaxableAmount(totalPriceTaxExcl, netDiscount, ajilHandlingFee),
  );
  const totalVat = keepTwoDecimalPlacesWithoutRounding(taxableAmount * calculatedTaxRate);
  const totalAmount = $(taxableAmount).add($(totalVat)).toNumber();

  return {
    lineItems,
    specialLineItems,
    totalVat,
    totalPriceTaxExcl,
    taxAdjustment,
    netDiscount,
    taxableAmount,
    totalAmount,
    totalDiscount,
    ajilHandlingFee,
  };
};

/**
 * This function takes orderItems and calculates lineItem values.
 *
 * @param {Object} orderItems
 * @returns {Object} lineItems, specialLineItems
 */
const lineItemCalculations = (orderItems, countryCode) => {
  const lineItems = [];
  const specialLineItems = []; // Items with zero tax.
  for (const orderItem of orderItems) {
    const { adjustedPrice, price, quantity, taxPercentage } = orderItem;
    if (quantity !== 0) {
      const lineItem = {
        // Preference to use product name in AR
        name: countryCode !== "UAE" ? orderItem?.multilingual?.value || orderItem.name : orderItem.name,
        unitPrice: adjustedPrice ? adjustedPrice : price,
        quantity: quantity,
        taxRate: taxPercentage ? taxPercentage : 0,
        basePrice: price,
      };

      lineItem.taxableAmount = getTaxableAmount(orderItem, lineItem);
      lineItem.discount = getDiscount(orderItem);
      lineItem.taxAmount = getTaxAmount(orderItem);
      lineItem.totalPrice = getTotalPrice(lineItem);
      lineItem.totalPriceWithTax = $(lineItem.totalPrice).add($(lineItem.taxAmount)).toNumber();

      lineItems.push(lineItem);

      if (lineItem.taxRate < 15) specialLineItems.push(lineItem);
    }
  }
  return { lineItems, specialLineItems };
};

/**
 * This function takes orderItem, lineItem and return taxableAmount values.
 *
 * @param {Object} orderItem
 * @returns {Number} taxableAmount
 */
const getTaxableAmount = (orderItem, lineItem) => {
  const { taxCategory, mrp, quantity } = orderItem;
  const { taxRate, unitPrice } = lineItem;
  let taxableAmount;
  if (taxCategory === TAX_ON_MRP) {
    taxableAmount = multiply($(calculateBasePriceFromMRP(mrp, taxRate)), ($(quantity))).toNumber();
  } else {
    taxableAmount = multiply($(unitPrice), ($(quantity))).toNumber();
  }
  return taxableAmount;
};

/**
* This function takes orderItem and return discount values.
*
* @param {Object} orderItem
* @returns {Number} discount
*/
const getDiscount = orderItem => {
  const { adjustedDiscount, discount, quantity } = orderItem;
  const lineItemDiscount = adjustedDiscount ? adjustedDiscount : discount;
  const totalDiscount = lineItemDiscount ? multiply($(lineItemDiscount), ($(quantity))).toNumber() : 0;
  return totalDiscount;
};

/**
 * This function takes orderItem and return taxAmount values.
 *
 * @param {Object} orderItem
 * @returns {Number} taxAmount
 */
const getTaxAmount = orderItem => {
  const { tax, quantity } = orderItem;
  const lineItemTax = tax;
  const taxAmount = lineItemTax ? multiply($(lineItemTax), ($(quantity))).toNumber() : 0;
  return taxAmount;
};

/**
 * This function takes totalPriceTaxExcl and taxableAmount and return totalVat.
 *
 * @param {Object} orderItems
 * @returns {Number} totalVat
 */
// eslint-disable-next-line no-unused-vars
const getTotalVat = orderItems => {
  let totalVat = 0;
  // eslint-disable-next-line no-param-reassign
  orderItems = _.cloneDeep(orderItems);
  for (const orderItem of orderItems) {
    const { quantity, adjustedTax, tax } = orderItem;
    orderItem.tax = adjustedTax ? adjustedTax : tax;
    if (quantity !== 0) {
      totalVat = $(totalVat).add($(getTaxAmount(orderItem))).toNumber();
    }
  }
  return totalVat;
};

/**
 * This function takes the totalPrice and totalVat and calculates the difference.
 *
 * @param {Decimal} totalPrice
 * @param {Decimal} totalVat
 */
const subtractVatFromTotalPrice = (totalPrice, totalVat) => parseFloat($(totalPrice).minus($(totalVat)).toNumber());

/**
 * This function takes lineItems and return totalPriceTaxExcl.
 *
 * @param {Object} lineItems
 * @returns {Number} totalPriceTaxExcl
 */
const getTotalTaxExclPrice = lineItems => {
  let totalPriceTaxExcl = 0;
  for (const item of lineItems) {
    const { basePrice, quantity } = item;
    if (quantity !== 0) {
      totalPriceTaxExcl = $(totalPriceTaxExcl).add($(multiply($(basePrice), ($(quantity))).toNumber())).toNumber();
    }
  }
  return totalPriceTaxExcl;
};

//  TODO REVISIT
// /**
//  * This function takes orderItems and return taxAdjustment.
//  *
//  * @param {Object} orderItems
//  * @returns {Number} taxAdjustment
//  */
// const  getTaxAdjustment = orderItems => {
//   let taxAdjustment = 0;
//   for (const item of orderItems) {
//     const { tax, adjustedTax, quantity } = item;
//     if (quantity !== 0 && adjustedTax) {
//       const taxDifference = $(tax).minus($(adjustedTax)).toNumber();
//       const totalTaxDifference = $(multiply($(taxDifference), ($(quantity))).toNumber());
//       taxAdjustment = $(taxAdjustment).add($(totalTaxDifference)).toNumber();
//     }
//   }
//   return taxAdjustment;
// };

/**
 * This function takes totalDiscount and return taxAdjustment.
 *
 * @param {Number} totalDiscount
 * @returns {Number} taxAdjustment
 */
const getTaxAdjustment = (totalDiscount, taxRate = 0.15) => (totalDiscount * taxRate / (1 + taxRate));

/**
 * This function takes totalPriceTaxExcl, totalDiscount, taxAdjustment and return taxableAmount.
 *
 * @param {Object} totalPriceTaxExcl
 * @param {Object} netDiscount
 * @param {Object} ajilHandlingFee
 * @returns {Number} taxableAmount
 */
const getTotalTaxableAmount = (totalPriceTaxExcl, netDiscount, ajilHandlingFee) => {
  const priceWithoutDiscount = $(totalPriceTaxExcl).minus($(netDiscount)).toNumber();
  const taxableAmount = $(priceWithoutDiscount).add($(ajilHandlingFee)).toNumber();
  return taxableAmount;
};

/**
 * This function takes lineItem and return totalPrice.
 *
 * @param {Object} lineItem
 * @returns {Number} totalPrice
 */
const getTotalPrice = lineItem => {
  const { basePrice, quantity } = lineItem;
  const totalPrice = multiply($(basePrice), ($(quantity))).toNumber();
  return totalPrice;
};

/**
 * This function takes discount and waiver and returns totalDiscount.
 *
 * @param {Number} discount
 * @param {Number} waiver
 * @returns {Number} totalDiscount
 */
const getTotalDiscount = (discount, waiver, volumeBasedDiscount) =>
  $(discount).add($(waiver)).add($(volumeBasedDiscount)).toNumber();

/**
 * This function takes totalDiscount and taxAdjustment and returns netDiscount.
 *
 * @param {Number} totalDiscount
 * @param {Number} taxAdjustment
 * @returns {Number} netDiscount
 */
const getNetDiscount = (totalDiscount, taxAdjustment) => $(totalDiscount).minus($(taxAdjustment)).toNumber();

/**
 * This function takes totalVAT and taxPrice and returns calculated tax rate.
 *
 * @param {Number} totalVAT
 * @param {Number} taxPrice
 * @returns {Number} taxRate
 */
const calculateFinalTaxRate = (totalVAT, taxPrice) => {
  const rate = $(totalVAT / taxPrice).toNumber();
  const roundedRate = keepTwoDecimalPlacesWithoutRounding(rate * 100);
  const hasDecimal = !!(roundedRate % 1);
  return hasDecimal ? rate : roundedRate / 100;
};

module.exports = {
  getInvoiceCalculations,
  subtractVatFromTotalPrice,
};
