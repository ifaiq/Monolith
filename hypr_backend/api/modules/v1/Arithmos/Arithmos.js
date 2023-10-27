const Big = require("big.js");

const {
  calculateTotal,
  calculateTax,
  calculateServiceCharge,
  calculateDeliveryCharge,
  calculateGrandTotal,
  calculateDiscount,
  calculateItemTotal,
  calculateExclusiveTaxPrice,
  subtractTaxFromConsumerPrice,
  getTax,
  calculateBasePriceFromMRP,
  calculateMRPTaxExclusivePrice,
  calculateConsumerPrice,
  getTaxPercentage,
  getPaymentPrice,
  getSubTotal,
  calculateDiscountOnTradePrice,
  calculateProductDiscount,
  subtractWaiver,
  getVolumeBasedProductPriceByQuantity,
} = require("./Helpers");

const {
  TAX_CATEGORIES: { TAX_ON_MRP, NO_TAX, TAX_ON_PRICE },
  CURRENCY_TYPES: { PKR },
  BASE_CURRENCY_MULTIPLIER: { PKR_100, SAR_10000 },
} = require("../../../services/Constants.js");

const {
  couponTypes: {
    FIXED_AMOUNT,
  },
} = require("../Coupon");

const {
  roundAccurately,
  eliminateOffByOne,
  convertProductListIntoBaseCurrency,
  convertFromBaseCurrency,
  convertProductListFromBaseCurrency,
  convertIntoBaseCurrency,
} = require("./Helpers/calculationsUtils");
const { checkFreeDeliveryElgibleFee } = require("./Helpers/PriceCalculation");

/**
 * This function takes the product, quantity and calculates the tax value for one product.
 *
 * @param {Object} product
 * @param {Number} quantity
 * @returns {Decimal} tax
 */
const getProductTax = (product, quantity) => calculateTax(product, quantity);

/**
 * This function takes the product, quantity and calculates the total for one product.
 *
 * @param {Object} product
 * @param {Number} quantity
 * @returns {Decimal} total
 */
const getProductTotal = (product, quantity) => calculateTotal(product, quantity);

/**
 * This function takes the price, quantity, tax and calculates the total for one item.
 *
 * @param {Number|DEecimal} price, quantity, tax
 * @param {Number} quantity
 * @param {Number|DEecimal} tax
 * @returns {Decimal} total
 */
const getItemTotal = (price, quantity, tax) => calculateItemTotal(price, quantity, tax);

/**
 * This function takes the productQuantityList and calculates the tax for order.
 *
 * @param {productQuantity[]} productQuantityList
 * @returns {Decimal} tax
 */
const getOrderTax = productQuantityList => productQuantityList
  .reduce((tax, productQuantity) => {
    const { product, quantity } = productQuantity;
    return parseFloat((tax + getProductTax(product, quantity)));
  }, 0);


/**
 * This function takes the productQuantityList and calculates the total for order.
 *
 * @param {productQuantity[]} productQuantityList
 * @returns {Decimal} total
 */
const getOrderTotal = productQuantityList => productQuantityList
  .reduce((total, productQuantity) => {
    const { product, quantity } = productQuantity;
    return parseFloat((total + getProductTotal(product, quantity)));
  }, 0);

/**
 * This function takes the type, value, total and calculates the service charge.
 *
 * @param {String} type
 * @param {number} value
 * @param {Decimal|Number} total
 * @returns {Decimal} service charge value
 */
const getServiceCharge = (type, value, total) => calculateServiceCharge(type, value, total);

/**
 * This function takes the type, value, total and calculates the delivery charge.
 *
 * @param {String} type
 * @param {number} value
 * @param {Decimal|Number} total
 * @returns {Decimal} delivery charge value
 */
const getDeliveryCharge = (type, value, total) => calculateDeliveryCharge(type, value, total);

/**
 * This function takes the total, tax, couponDiscount, serviceCharge, deliveryCharge and calculates the grand total.
 *
 * @param {Decimal|Number} total
 * @param {Decimal|Number} tax
 * @param {Decimal|Number} couponDiscount
 * @param {Decimal|Number} serviceCharge
 * @param {Decimal|Number} deliveryCharge
 * @returns {Decimal} grand total.
 */
const getGrandTotal = (total, tax, couponDiscount = 0, serviceCharge = 0, deliveryCharge = 0) =>
  calculateGrandTotal(total, tax, couponDiscount, serviceCharge, deliveryCharge);


/**
 * Function returns total tax exclusive price from a product list.
 * @param productList: Array[Object]
 * @returns totalPrice: Number
 */
const getTotalAdjustedPrice = productList => productList.reduce((totalPrice, { product, quantity }) => {
  let price = product.price;

  // if product has adjustedPrice, then it takes precedence
  // adjustedPrice >> volumeBasedPrice >> price
  if (product.adjustedPrice || product.adjustedPrice === 0) {
    price = product.adjustedPrice;
  } else if (product.volumeBasedPrice > 0) {
    price = product.volumeBasedPrice;
  }

  const productPrice = Big(calculateTotal({ price }, quantity));
  const totalAdjustedPrice = parseFloat(Big(totalPrice).plus(productPrice));
  return totalAdjustedPrice;
}, 0);


/**
 * Function returns total tax  from a product list.
 * @param productList: Array[Object]
 * @returns totalTax: Number
 */
const getTaxFromOrderItems = productList => productList.reduce((totalTax, { product, quantity }) => {
  let tax = product.tax;

  // if product has adjustedTax, then it takes precedence
  // adjustedTax >> volumeBasedPriceTax >> tax
  if (product.adjustedTax || product.adjustedTax === 0) {
    tax = product.adjustedTax;
  } else if (product.volumeBasedPrice > 0) {
    tax = product.volumeBasedPriceTax;
  }

  const productTax = calculateTax({ tax }, quantity);
  const totalTaxAmount = parseFloat(Big(totalTax).plus(Big(productTax)));
  return totalTaxAmount;
}, 0);

/**
* This function takes the total, tax, couponDiscount, serviceCharge, deliveryCharge and calculates the grand total.
*
* @param {Decimal|Number} coupon
* @param {Decimal|Number} total
* @param {Decimal|Number} serviceCharge
* @param {Decimal|Number} deliveryCharge
* @returns {Decimal} coupon discount.
*/
const getCouponDiscount = (
  coupon,
  total,
  serviceCharge = 0,
  deliveryCharge = 0,
) =>
  calculateDiscount({
    coupon,
    total,
    serviceCharges: serviceCharge,
    deliveryCharges: deliveryCharge,
    isBatchFlow: false,
    baseCurrencyMultiplier: 0,
  });

/**
 * HOT FIX, Funtion runs calculations without coupons and extracts subtotal, then proceeds calculate discount
 * Fixes subtotal ERROR
 * TODO MAKE A MECHANISM TO HANDLE ROUNDING
 */
// const getOrderCalculations = async ({ productQuantityList, location, coupon, waiver = 0,
// isBatchFlow = false, currency, isCartFlow, noCouponFlow }) => {
// // TODO GET RID OF ALL THE FLAGS THAT POLLUTE THE FLOW
// const responseObject = await _getOrderCalculations(_.cloneDeep({ productQuantityList, location, coupon,
// waiver, isBatchFlow, currency, isCartFlow }));
// const noCoupon = await _getOrderCalculations(_.cloneDeep({ productQuantityList.map({ product } =>
// { product.adjustedPrice = null; product.adjustedDiscount = null; return item; }),
// location, waiver, isBatchFlow, currency, isCartFlow }));
//     responseObject.subTotal = noCoupon.subTotal;
//     responseObject.grandTotal = noCoupon.subTotal - responseObject.couponDiscount;
//     return responseObject;
// }

/**
 * Function to update the base currency values to default currency
 * @param {Object} Object
 * @returns Object
 */
const adjustCurrencyChanges = ({
  tax,
  total,
  couponDiscount,
  _eligibleList,
  _ineligibleList,
  adjustedItems,
  baseCurrencyMultiplier,
  deliveryCharge,
  remainingPriceForFreeDelivery,
  volumeBasedDiscount = 0,
}) => ({
  tax: convertFromBaseCurrency(tax, baseCurrencyMultiplier),
  total: convertFromBaseCurrency(total, baseCurrencyMultiplier),
  deliveryCharge: convertFromBaseCurrency(
    deliveryCharge,
    baseCurrencyMultiplier,
  ),
  remainingPriceForFreeDelivery: convertFromBaseCurrency(
    remainingPriceForFreeDelivery,
    baseCurrencyMultiplier,
  ),
  couponDiscount: convertFromBaseCurrency(
    couponDiscount,
    baseCurrencyMultiplier,
  ),
  _eligibleList: convertProductListFromBaseCurrency(
    _eligibleList,
    baseCurrencyMultiplier,
  ),
  _ineligibleList: convertProductListFromBaseCurrency(
    _ineligibleList,
    baseCurrencyMultiplier,
  ),
  adjustedItems: convertProductListFromBaseCurrency(
    adjustedItems,
    baseCurrencyMultiplier,
  ),
  volumeBasedDiscount: convertFromBaseCurrency(
    volumeBasedDiscount,
    baseCurrencyMultiplier,
  ),
});

/**
 * Function determine whether to use basePrice from MRP for tax calculations
 * Uses determined price to add tax to product object
 * @param Product: object
 * @param quantity: number
 * @param isBatchFlow: boolean
 * @return {Price & Tax}: object
 */
const calculateTaxAndPriceByCategory = (
  productDetails,
  quantity = 0,
  isBatchFlow = false,
  isPriceConvertedIntoBaseCurrency = false,
  baseCurrencyMultiplier = 1,
) => {
  const product = _.cloneDeep(productDetails);
  // setting default value for tax = 0
  let { taxPercent, price, taxCategory, tax = 0 } = product;
  const {
    taxInclusive,
    mrp,
    isVolumeBasedPriceEnabled,
    isVolumeBasedPriceCalculated,
    volumeBasedPriceInfo = {},
    volumeBasedPrices,
    dynamicPriceHistoryId,
  } = product;

  let volumeBasedPriceDetails = (isVolumeBasedPriceEnabled || product.volumeBasedPrice > 0)
  && !dynamicPriceHistoryId
    ? {
      ...volumeBasedPriceInfo,
      volumeBasedPrices,
    }
    : {};

  if (isVolumeBasedPriceEnabled
    && !isBatchFlow
    && !isVolumeBasedPriceCalculated
    && quantity > 0
    && !dynamicPriceHistoryId) {
    const { volumeBasedPrice, selectedTier } = getVolumeBasedProductPriceByQuantity(
      product,
      quantity,
      isPriceConvertedIntoBaseCurrency,
      baseCurrencyMultiplier,
    );

    volumeBasedPriceDetails = {
      volumeBasedPrice,
      volumeBasedPrices: getAdjustedVolumeBasedProductPrices(product),
      selectedTier,
    };

    // updating price with volume based price, all calculations will be based on the updated price
    price = volumeBasedPrice;
  }

  const originalPrice = price;
  let taxAmount = 0;
  if (taxPercent === 0) {
    taxCategory = NO_TAX;
  }
  if (taxCategory && taxCategory !== NO_TAX) { // don't do anything if tax cat is no tax
    if (taxCategory === TAX_ON_MRP) { // MRP product must always be tax inclusive
      let basePriceFromMRP = 0;
      if (!taxPercent && (tax || tax === 0)) { // for the case of orderItems and in case tax is zero
        basePriceFromMRP = parseFloat(Big(mrp).minus(Big(tax)));
        taxPercent = getTaxPercentage(tax, basePriceFromMRP);
      } else {
        basePriceFromMRP = calculateBasePriceFromMRP(mrp, taxPercent);
      }
      taxAmount = getTax(taxPercent, basePriceFromMRP);
      if (taxInclusive) {
        const priceTaxExclusive = calculateMRPTaxExclusivePrice(price, taxAmount);
        price = priceTaxExclusive;
      }
    } else if (taxInclusive) {
      if (!taxPercent && (tax || tax === 0)) { // for the case of orderItems and in case tax is zero
        taxAmount = tax;
        price = subtractTaxFromConsumerPrice(price, taxAmount);
      } else {
        price = calculateExclusiveTaxPrice(price, taxPercent);
        taxAmount = getTax(taxPercent, price);
      }
    } else { // if product is tax exclusive
      if (!taxPercent && (tax || tax === 0)) { // for the case of orderItems and in case tax is zero
        taxPercent = getTaxPercentage(tax, price);
      }
      taxAmount = getTax(taxPercent, price);
    }
  }

  price = price.toFixed(2);
  tax = taxAmount.toFixed(2);

  if (taxInclusive) {
    tax = (originalPrice - price).toFixed(2);
  }
  sails.log.info(
    `Arithmos - calculted tax & price on product - ProductID: ${product.id} Tax: ${taxAmount} Price: ${price}`,
  );

  return { price, tax, volumeBasedPriceDetails };
};

/**
 * Function readjusts product item (price, tax and discount) values after applying discount
 * @param productList: Array[objects]
 * @param discountValue: Number
 * @param eligibleListGrandTotal: Number
 * @param uncappedDiscount: Number
 * @returns productList: Array [Object]
 */
const readjustProductValues = (
  productList,
  discountValue,
  eligibleListGrandTotal,
  uncappedDiscount,
  isBatchFlow = false,
  baseCurrencyMultiplier,
) =>
  productList.map(listItem => {
    const { product, quantity } = listItem;
    const {
      discountForProduct,
      uncappedDiscountForProduct,
      consumerPriceAfterDiscount,
    } = calculateProductDiscount(
      product.price,
      product.tax,
      discountValue,
      eligibleListGrandTotal,
      uncappedDiscount,
    );
    const _product = _.cloneDeep(product); // do not mutate the original object
    _product.price = consumerPriceAfterDiscount;

    // since we're setting price to consumer facing price, it will always be tax inclusive.
    _product.taxInclusive = true;
    const {
      price,
      tax,
      volumeBasedPriceDetails: {
        volumeBasedPrice,
        volumeBasedPrices,
      } = {},
    } = calculateTaxAndPriceByCategory(
      _product,
      quantity,
      isBatchFlow,
      true,
      baseCurrencyMultiplier,
    );

    listItem.product.discount = uncappedDiscountForProduct;
    // TODO USE adjusted_values
    listItem.product.adjustedPrice = price;
    listItem.product.adjustedTax = tax;
    listItem.product.adjustedDiscount = discountForProduct;
    listItem.product.volumeBasedPrices = volumeBasedPrices;

    if (listItem.product.volumeBasedPriceInfo) {
      listItem.product.volumeBasedPriceInfo.volumeBasedPrice = volumeBasedPrice;
    }

    return listItem;
  });


/**
 * This function takes the productQuantityList, location and calculates the tax, total, grand total.
 *
 * @param {prodQuantityList} productQuantityList
 * @param {Object} location
 * @param coupon: object
 * @returns {Object} { tax, total, grandTotal, adjustedItems, eligibleProducts }
 */
// TODO GET RID OF ALL THE FLAGS THAT POLLUTE THE FLOW
const getOrderCalculations = async ({
  productQuantityList: prodQuantityList,
  location,
  coupon,
  waiver = 0,
  isBatchFlow = false,
  currency,
  isCartFlow,
  order = {},
  statusId,
  eligibleProductsOrderedPrice = 0,
  couponProducts: { eligibleList, ineligibleList },
}) => {
  const logIdentifier = `Arithmos.getOrderCalculations, isBatchFlow: ${isBatchFlow}, ` +
    `orderId: ${order.id}, statusId: ${statusId}, couponId: ${coupon?.id},`;

  let {
    deliveryChargeValue,
    serviceChargeValue,
    freeDeliveryLimit,
  } = location;

  let {
    serviceChargeType,
    deliveryChargeType,
  } = location;

  /**
   * Use delivery & service charges applicable at the time of order creation
   */
  if (order && order.id) {
    ({
      locationDeliveryCharges: deliveryChargeValue,
      serviceChargeValue,
      locationFreeDeliveryLimit: freeDeliveryLimit,
      serviceChargeType,
      deliveryChargeType,
    } = order);
  }


  let productQuantityList = prodQuantityList;

  if (isBatchFlow) {
    productQuantityList = productQuantityList.map(productQuantityObj => {
      const {
        product: {
          actualUnitPrice,
          volumeBasedPrice,
          volumeBasedPriceTax,
          volumeBasedPriceInfo = {},
        },
      } = productQuantityObj;

      if (!actualUnitPrice) {
        productQuantityObj.product.actualUnitPrice =
          parseFloat(productQuantityObj.product.price) +
          parseFloat(productQuantityObj.product.tax);
      }

      if (_.isEmpty(volumeBasedPriceInfo)) {
        productQuantityObj.product.volumeBasedPriceInfo = {
          volumeBasedPrice:
            volumeBasedPrice > 0
              ? parseFloat(volumeBasedPrice) + parseFloat(volumeBasedPriceTax)
              : productQuantityObj.product.actualUnitPrice,
        };
      }

      return productQuantityObj;
    });
  }

  // convert products price, tax and mrp into base currency unit
  const baseCurrencyMultiplier = currency === PKR ? PKR_100 : SAR_10000;
  productQuantityList = convertProductListIntoBaseCurrency(
    productQuantityList,
    baseCurrencyMultiplier,
  );

  deliveryChargeValue = deliveryChargeValue ? convertIntoBaseCurrency(deliveryChargeValue, baseCurrencyMultiplier) : 0;
  serviceChargeValue = serviceChargeValue ? convertIntoBaseCurrency(serviceChargeValue, baseCurrencyMultiplier) : 0;
  freeDeliveryLimit = freeDeliveryLimit ? convertIntoBaseCurrency(freeDeliveryLimit, baseCurrencyMultiplier) : 0;

  // eslint-disable-next-line no-param-reassign
  waiver = convertIntoBaseCurrency(waiver, baseCurrencyMultiplier);

  // price of eligible items at order placement
  // eslint-disable-next-line no-param-reassign
  eligibleProductsOrderedPrice = convertIntoBaseCurrency(eligibleProductsOrderedPrice, baseCurrencyMultiplier);

  let total = getTotalAdjustedPrice(productQuantityList);
  const volumeBasedDiscount = getTotalVolumeBasedDiscount(
    productQuantityList,
    isBatchFlow,
  ); // converted into base currency

  const serviceCharge = getServiceCharge(
    serviceChargeType,
    serviceChargeValue,
    total,
  );

  let deliveryCharge = getDeliveryCharge(
    deliveryChargeType,
    deliveryChargeValue,
    total,
  );

  let couponDiscount = 0;
  let eligibleProductsTotal = total;
  let eligibleProductsGrandTotal = 0;
  let _eligibleList = [];
  let _ineligibleList = [];
  let _couponValidation = null;
  let couponError = null;

  if (coupon && Object.keys(coupon).length > 0) {
    try {
      _eligibleList = eligibleList;
      _ineligibleList = ineligibleList;
    } catch (error) {
      sails.log.info(
        `${logIdentifier} Error applying WL/BL coupon -> ${JSON.stringify(error.stack || error)}`,
      );

      _couponValidation = error.data?.message || error.message;

      if (error.code === 1113) { // Coupon service didn't respond
        couponError = error;
        _couponValidation = error;
      }

      if (!isBatchFlow && !isCartFlow) {
        // stop the flow if it is not a batchflow
        throw error;
      }
    }

    if (_eligibleList.length !== 0) {
      if (isBatchFlow) {
        _eligibleList = _eligibleList.map(eligibleProductQuantityList => {
          const { product } = eligibleProductQuantityList;

          if (product.volumeBasedPrice > 0) {
            product.taxExclusivePriceBasePrice = product.price;
            product.taxOnBasePrice = product.tax;

            product.price = product.volumeBasedPrice;
            product.tax = product.volumeBasedPriceTax;
          }

          return eligibleProductQuantityList;
        });
      }

      eligibleProductsTotal = getOrderTotal(_eligibleList); // todo use getTotalAdjustedPrice here
      const eligibleProductTax = getOrderTax(_eligibleList); // todo use new getter func here as well.
      eligibleProductsGrandTotal = getGrandTotal(
        eligibleProductsTotal,
        eligibleProductTax,
        0,
        0,
        0,
      );
      let _uncappedDiscount = 0;
      let _discount = 0;
      try {
        const couponDetails = {
          ...coupon,
          discountValue:
            parseInt(coupon.discountType.id ?? coupon.discountType) ===
              FIXED_AMOUNT
              ? coupon.discountValue * baseCurrencyMultiplier
              : coupon.discountValue,
          minCouponLimit: coupon.minCouponLimit * baseCurrencyMultiplier,
          maxDiscountValue: coupon.maxDiscountValue * baseCurrencyMultiplier,
        };

        sails.log(`${logIdentifier} calling calculateDiscount with the params:`,
          `couponDetails: ${JSON.stringify(couponDetails)},`,
          `eligibleProductsGrandTotal: ${JSON.stringify(eligibleProductsGrandTotal)},`,
          `serviceCharge: ${JSON.stringify(serviceCharge)},`,
          `deliveryCharge: ${JSON.stringify(deliveryCharge)},`,
          `isBatchFlow: ${isBatchFlow},`,
          `baseCurrencyMultiplier: ${baseCurrencyMultiplier},`,
        );

        const { discount, uncappedDiscount, couponValidation } =
          calculateDiscount({
            coupon: couponDetails,
            total: eligibleProductsGrandTotal,
            serviceCharges: serviceCharge,
            deliveryCharges: deliveryCharge,
            isBatchFlow,
            baseCurrencyMultiplier,
            eligibleProductsOrderedPrice,
          });

        sails.log(`${logIdentifier} calculateDiscount() responded with:`,
          `discount: ${discount},`,
          `uncappedDiscount: ${uncappedDiscount},`,
          `couponValidation: ${JSON.stringify(couponValidation)},`,
        );

        couponDiscount = discount;
        _uncappedDiscount = uncappedDiscount;
        _discount = discount;
        _couponValidation = couponValidation;
      } catch (error) {
        sails.log.error(
          `${logIdentifier} Error calculating discount -> ${JSON.stringify(error.stack || error)}`,
        );

        couponError = error;
        if (!isBatchFlow && !isCartFlow) {
          // stop the flow if it is not a batchflow
          throw error;
        }
      }

      _eligibleList = readjustProductValues(
        _eligibleList,
        _discount,
        eligibleProductsGrandTotal,
        _uncappedDiscount,
        isBatchFlow,
        baseCurrencyMultiplier,
      );
    }
  }

  let adjustedItems = [
    ..._.cloneDeep(_eligibleList),
    ..._.cloneDeep(_ineligibleList),
  ];

  if (adjustedItems.length === 0) {
    adjustedItems = productQuantityList;
  }

  total = roundAccurately(getTotalAdjustedPrice(adjustedItems), 5); // readjust total after discounts
  // total = keepTwoDecimalPlacesWithoutRounding(getTotalAdjustedPrice(adjustedItems));
  const tax = roundAccurately(
    parseFloat(getTaxFromOrderItems(adjustedItems)),
    5,
  );

  // const tax = keepTwoDecimalPlacesWithoutRounding(getTaxFromOrderItems(adjustedItems));

  // if the order amount is greater than the free delivery limit, set delivery charges to zero

  const freeDeliveryEligibleFee = checkFreeDeliveryElgibleFee(total, tax);

  if (freeDeliveryLimit > 0 && freeDeliveryEligibleFee >= freeDeliveryLimit) {
    deliveryCharge = 0.00;
  }

  const remainingPriceForFreeDelivery = parseFloat(Big(freeDeliveryLimit).minus(Big(freeDeliveryEligibleFee)));

  let grandTotal = getGrandTotal(total, tax, 0, serviceCharge, deliveryCharge);
  let subTotal = getSubTotal(grandTotal, couponDiscount, volumeBasedDiscount);


  // subTotal shouldn't be changed if waiver is applied, hence placed this here.
  grandTotal = subtractWaiver(grandTotal, waiver || 0);

  grandTotal = roundAccurately(
    convertFromBaseCurrency(grandTotal, baseCurrencyMultiplier),
    2,
  );
  subTotal = roundAccurately(
    convertFromBaseCurrency(subTotal, baseCurrencyMultiplier),
    2,
  );
  eligibleProductsGrandTotal = roundAccurately(
    convertFromBaseCurrency(eligibleProductsGrandTotal, baseCurrencyMultiplier),
    2,
  );

  const adjustedCurrencyValues = adjustCurrencyChanges({
    tax,
    total,
    couponDiscount,
    _eligibleList,
    _ineligibleList,
    adjustedItems,
    baseCurrencyMultiplier,
    deliveryCharge,
    remainingPriceForFreeDelivery,
    volumeBasedDiscount,
  });

  const amountPayable = grandTotal;

  const responseObject = {
    tax: adjustedCurrencyValues.tax,
    total: adjustedCurrencyValues.total,
    couponDiscount: adjustedCurrencyValues.couponDiscount,
    grandTotal,
    adjustedItems: adjustedCurrencyValues.adjustedItems, // optional return, will not effect previous functionality
    eligibleProducts: adjustedCurrencyValues._eligibleList,
    subTotal,
    amountPayable,
    deliveryCharge: adjustedCurrencyValues.deliveryCharge,
    remainingPriceForFreeDelivery: adjustedCurrencyValues.remainingPriceForFreeDelivery,
    eligibleProductsGrandTotal,
    volumeBasedDiscount: adjustedCurrencyValues.volumeBasedDiscount,
  };

  if (_couponValidation) {
    // validation message for logistics app
    responseObject.couponValidation = _couponValidation;
  }
  if (couponError) {
    // error object for cart flow
    responseObject.couponError = couponError;
  }

  sails.log(`${logIdentifier} responseObject: ${JSON.stringify(responseObject)}`);
  return responseObject;
};


/**
 * This function takes the Shipment Items and calculates the total for shipmentItems.
 *
 * @param {shipmentItems[]} shipmentItems
 * @returns {Object} responseObject
 */

const getJITOrderCalculations = (shipmentItemsList, charges, isBatchFlow = false, waiver = 0) => {
  let shipmentItems = shipmentItemsList;

  if (isBatchFlow) {
    shipmentItems = shipmentItems.map(shipmentItem => {
      const {
        product: {
          actualUnitPrice,
          volumeBasedPrice,
          volumeBasedPriceTax,
          volumeBasedPriceInfo = {},
        },
      } = shipmentItem;

      if (!actualUnitPrice) {
        shipmentItem.product.actualUnitPrice =
          parseFloat(shipmentItem.product.price) +
          parseFloat(shipmentItem.product.tax);
      }

      if (_.isEmpty(volumeBasedPriceInfo)) {
        shipmentItem.product.volumeBasedPriceInfo = {
          volumeBasedPrice:
            volumeBasedPrice > 0
              ? parseFloat(volumeBasedPrice) + parseFloat(volumeBasedPriceTax)
              : shipmentItem.product.actualUnitPrice,
        };
      }

      return shipmentItem;
    });
  }

  let discount = getTotalAdjustedDiscount(shipmentItems);
  let volumeBasedDiscount = getTotalVolumeBasedDiscount(shipmentItems, isBatchFlow);
  const total = roundAccurately(getTotalAdjustedPrice(shipmentItems), 5); // read just total after discounts
  const tax = roundAccurately(
    parseFloat(getTaxFromOrderItems(shipmentItems)),
    5,
  );

  let grandTotal = getGrandTotal(
    total, tax, 0, charges.serviceChargeValue, charges.deliveryChargeValue,
  );

  let subTotal = getSubTotal(grandTotal, discount, volumeBasedDiscount);

  grandTotal = subtractWaiver(grandTotal, waiver);

  grandTotal = roundAccurately(grandTotal, 2);
  subTotal = roundAccurately(subTotal, 2);
  discount = roundAccurately(discount, 2);
  volumeBasedDiscount = roundAccurately(volumeBasedDiscount, 2);

  const amountPayable = grandTotal;
  const responseObject = {
    tax,
    total,
    grandTotal,
    subTotal,
    amountPayable,
    discount,
    volumeBasedDiscount,
  };

  return responseObject;
};

/**
 * This function takes the orderItems and calculates the total for orderItems.
 *
 * @param {orderItems[]} orderItems
 * @returns {Decimal} total
 */
const getOrderItemTotal = orderItems => {
  let orderItemsArray = orderItems;
  if (!Array.isArray(orderItems)) {
    orderItemsArray = [orderItems]; // convert into an array if an object is passed
  }
  return orderItemsArray
    .reduce((total, item) => {
      let { price, tax } = item;
      const {
        adjustedPrice,
        adjustedTax,
        quantity,
        taxInclusive,
        taxCategory,
        volumeBasedPrice = 0,
        volumeBasedPriceTax = 0,
      } = item;

      // adjustedPrice >> volumeBasedPrice >> price
      if (adjustedPrice) {
        price = adjustedPrice;
        tax = adjustedTax;
      } else if (volumeBasedPrice > 0) {
        price = volumeBasedPrice;
        tax = volumeBasedPriceTax;
      }

      tax = !taxInclusive && taxCategory === TAX_ON_PRICE ? 0 : tax;
      return parseFloat((total + getItemTotal(price, quantity, tax)));
    }, 0);
};

/**
 * Function determines price of product based on it's tax category
 * @param {Object[]} product
 * @return price: number
 */
const getPriceByCategory = product => {
  const { price } = calculateTaxAndPriceByCategory(product);
  return price;
};

/**
 * Function returns the end consumer price of a product
 * @param {Object} product
 * @returns {Number} price
 */
const getConsumerPriceForProduct = product => {
  let consumerPrice = product.price;
  let taxExclusivePrice;
  let tax;

  if (
    product.taxCategory === TAX_ON_MRP ||
    (!product.taxInclusive && product.taxCategory !== NO_TAX) ||
    product.isVolumeBasedPriceEnabled
  ) {
    ({ price: taxExclusivePrice, tax } = calculateTaxAndPriceByCategory(product));
    consumerPrice = calculateConsumerPrice(taxExclusivePrice, tax);
  }

  return {
    consumerPrice,
    taxExclusivePrice,
    tax,
  };
};

/**
 * Function returns the end consumer volume based price of a product
 * @param {Object} product
 * @param {Object} volumeBasedPriceTier
 * @returns {int} price
 */
const getConsumerPriceForVolumeBasedProduct = (product, volumeBasedPriceTier) => {
  const price = volumeBasedPriceTier.price;
  const { consumerPrice, taxExclusivePrice, tax } = getConsumerPriceForProduct({ ...product, price });
  return { consumerPrice, taxExclusivePrice, tax };
};

/**
 * Function calculates grandtotal discount for a product in an order
 * @param {Object} productList
 * @returns {Number} grantTotal
 */
const getTotalAdjustedDiscount = productList => productList.reduce((totalDiscount, { product, quantity }) => {
  const discount = product.adjustedDiscount || 0;
  const totaProductDiscount = Big(discount).times(Big(quantity));
  const totalAdjustedDiscount = parseFloat(Big(totalDiscount).plus(totaProductDiscount));
  return totalAdjustedDiscount;
}, 0);

/**
 * Function calculates grantTotal for an order
 * @param order:object
 * @returns grantTotal: Number
 */
const calculateGrandTotalOnOrder = order => {
  const { totalPrice, couponDiscount, creditBuyFee, volumeBasedDiscount } = order;
  return getPaymentPrice(totalPrice, couponDiscount, creditBuyFee, volumeBasedDiscount);
};

/**
 * Function calculates discount according to trade price and price
 * @param {Number} tradePrice
 * @param {Number} price
 * @returns {Number} discount
 */
const getDiscountAccordingToTradePrice = (tradePrice, price) => calculateDiscountOnTradePrice(tradePrice, price);

/**
 * Function deducts wavier amount from order total
 * @param {Number} grandTotal
 * @param {Number} wavier
 * @returns {Number} grandTotal
 */

const getGrandTotalWithWavierDiscount = (grandTotal, wavier) => subtractWaiver(grandTotal, wavier);

const getAdjustedVolumeBasedProductPrices = product => {
  // if rule is enabled, don't use vbp
  if (!product.isVolumeBasedPriceEnabled || _.isEmpty(product.volumeBasedPrices) || product.dynamicPriceHistoryId) {
    return [];
  }

  const volumeBasedPrices = product.volumeBasedPrices.map(
    volumeBasedPriceTier => {
      const { consumerPrice: tierPrice, taxExclusivePrice, tax } =
        getConsumerPriceForVolumeBasedProduct(product, volumeBasedPriceTier);

      const discount =
        product.tradePrice && product.tradePrice > tierPrice
          ? getDiscountAccordingToTradePrice(product.tradePrice, tierPrice)
          : "";

      return { ...volumeBasedPriceTier, price: tierPrice, discount, taxExclusivePrice, tax };
    },
  );

  return volumeBasedPrices;
};

const getTotalVolumeBasedDiscount = (productList, isBatchFlow = false) => productList
  .reduce((totalVolumeBasedDiscount, { product, quantity }) => {
    const { actualUnitPrice, volumeBasedPriceInfo: { volumeBasedPrice } = {} } = product;
    let volumeBasedDiscount = 0;

    if (!actualUnitPrice || !volumeBasedPrice) {
      return totalVolumeBasedDiscount;
    }

    if (isBatchFlow || (!isBatchFlow && product.isVolumeBasedPriceEnabled)) {
      const totalWithoutVolumeBasedDiscount = calculateTotal({ price: actualUnitPrice }, quantity);
      const totalWithVolumeBasedDiscount = calculateTotal({ price: volumeBasedPrice }, quantity);

      const discount = Big(totalWithoutVolumeBasedDiscount).minus(Big(totalWithVolumeBasedDiscount));
      volumeBasedDiscount = parseFloat(Big(totalVolumeBasedDiscount).plus(Big(discount)));
    }

    return volumeBasedDiscount;
  }, 0);

module.exports = {
  getOrderCalculations,
  getGrandTotal,
  getServiceCharge,
  getDeliveryCharge,
  getCouponDiscount,
  getOrderItemTotal,
  getPriceByCategory,
  calculateTaxAndPriceByCategory,
  getProductTotal,
  getConsumerPriceForProduct,
  getConsumerPriceForVolumeBasedProduct,
  getTaxPercentage,
  calculateGrandTotalOnOrder,
  calculateConsumerPrice,
  getDiscountAccordingToTradePrice,
  roundAccurately,
  eliminateOffByOne,
  getJITOrderCalculations,
  getTotalAdjustedPrice,
  getGrandTotalWithWavierDiscount,
  getAdjustedVolumeBasedProductPrices,
  getVolumeBasedProductPriceByQuantity,
  getTaxFromOrderItems,
};
