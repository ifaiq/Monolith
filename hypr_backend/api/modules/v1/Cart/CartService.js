/**
 Copyright © 2021 Retailo, Inc.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

const { update, findById } = require("./CartDaoRedis");
const { MultiLingualAttributes } = require("../../../constants/enums");
const {
  validateCoupon,
} = require("../Coupon/CouponDao");
const {
  productService: {
    findProductById,
    getVolumeBasedPriceInfo,
  },
  productValidator: {
    validateProducts,
    isDuplicateProducts,
  },
  productUtils: {
    mergeDuplicateProducts,
  },
} = require("../Product");
const { arithmos: {
  getOrderCalculations,
  calculateTaxAndPriceByCategory,
  getOrderItemTotal,
  calculateConsumerPrice,
  getDiscountAccordingToTradePrice,
  // eliminateOffByOne,
} } = require("../Arithmos");
const { locationService: {
  findLocation,
} } = require("../Location");
const {
  getOrderItems,
} = require("../../../services/OrderService");
const {
  getLanguage,
} = require("../../../../utils/languageAccessor");

const { findWaiver } = require("../../../services/WaiverService");
const { validateTotalAboveLimit } = require("../Order/OrderValidator");
const { PAYMENT_TYPES: { CREDIT } } = require("../Order/Constants");

const { fetchLoanSummary, orderIsInCreditBuyLimit } = require("../LMS");
const { getRetailerEligibilityAndBalance } = require("../Wallet/WalletService");
const { findCustomerById } = require("../Auth");
const { getProductListByJIT, createJITShipment, getDeliveryDate,
  fetchDeliveryAndServiceCharges } = require("../../v1/JIT/JITUtils");
const { getTotalShipments, getShipmentsOrderItems } = require("../../v1/JIT/JITOrder");

const { businessUnitService: {
  getBusinessUnitById,
} } = require("../BusinessUnit");

const {
  findbyCriteria: findOrderByCriteria,
} = require("../Order/OrderDao");

const { getUpdatedProductStock } = require("../ProductQuantityLimit");
const { formatDescription } = require("../Product/Utils");
const { getTaxFromOrderItems } = require("../Arithmos/Arithmos");
const { TAX_CATEGORIES: { TAX_ON_PRICE } } = require("../../../services/Constants.js");
const { getUpdatedProductList } = require("../../../pricing_engine_service/pricingEngineService");
const { findHierarchyFeaturesByLocationId } = require("../HierarchyFeatures");
const {
  HyprRoles: { DELIVERY },
} = require("../../../services/Constants");
const { findEligibleProducts } = require("../Coupon/CouponService");
/**
 * This function takes the userId and return cart.
 *
 * @param {Number} userId
 * @returns {Cart[]} cart
 */
const findCart = async userId => await makeResponse(await findById(userId));

/**
 * This function takes the user, cartDetails, couponValidationRequired,
 * productsValidationRequired, calculateTotal and returns a cart.
 *
 * @param {Object} user
 * @param {Number} cartDetails
 * @param {String|Boolean} couponValidationRequired
 * @param {String|Boolean} productsValidationRequired
 * @param {String|Boolean} calculateTotal
 * @param {String|Boolean} isBatchCalculation
 * @param {String|Boolean} forcefullyIgnoreValidations
 * @param {String|Boolean} creditValidationRequired
 * @returns {Cart[]} cart
 */
const generateCart = async (
  user,
  cartDetails,
  couponValidationRequired = false,
  productsValidationRequired = false,
  calculateTotal = false,
  isBatchCalculation = false,
  forcefullyIgnoreValidations = false,
  creditValidationRequired = false,
) => {
  const { coupon, locationId, orderId, retailerId, loanProductId } = cartDetails;
  const {
    id: userId,
    role: userRole,
    clientTimeOffset,
  } = user;
  let waiver = 0;
  let eligibleProductsGrandTotal = 0;
  let { products } = cartDetails;
  let validationsPassed = true;
  const validationResponses = {
    couponValidation: null,
    productValidation: null,
  };
  let retailerLoanBalance = 0;
  let cart = cartDetails;

  // Check duplicate products and merge the products
  if (isDuplicateProducts(products)) {
    products = mergeDuplicateProducts(products);
  }

  if (products.length && couponValidationRequired === "true" && coupon) {
    const couponProducts = products.map(product => ({ id: product.id }));
    // user role validation is ignored if batch calculation is applied.
    const { success, data: couponData } = await validateCoupon(
      coupon,
      couponProducts,
      locationId,
      userId,
      userRole,
      user.language,
      user.clientTimeOffset,
    );
    if (!success && !forcefullyIgnoreValidations) {
      validationsPassed = false;
      validationResponses.couponValidation = couponData;
      cart.coupon = null; // need to add here, because of the validationPassed if block moved to the end,
      // so coupon validations dont get overridden by eligibility validations
    } else {
      cart.coupon = couponData;
    }
  }
  // todo for getting products integrate cart with product info
  let productList = await Promise.all(
    products.map(async product => findProductById(product.id)),
  );

  if (isBatchCalculation) {
    if (!orderId) {
      // TODO throw proper errors
      throw { message: "OrderId is missing" };
    }

    const orderItems = await getOrderItems({ order_id: orderId });
    productList = productList.map(product => {
      const { price, basePrice } = orderItems.find(
        item => product.id === item.product_id,
      );

      product.price = price;
      product.basePrice = basePrice; // non-VBP price
      product.taxInclusive = true;
      return product;
    });
  }

  const location = await findLocation(locationId);
  const { currency, countryCode } = await getBusinessUnitById(location.businessUnitId);

  productList = await getUpdatedProductStock(retailerId, productList, clientTimeOffset);

  // Funnel Injection | Pricing Engine | Dynamic Pricing
  productList = await getUpdatedProductList({
    locationId: location.id,
    shopTypeId: cartDetails.shopTypeId,
    zoneId: cartDetails.zones,
    products: productList,
  });

  if (+userRole === +DELIVERY) {
    location.deliveryChargeValue = 0;
    for (const item in productList) {
      if(productList[item].isVolumeBasedPriceEnabled) {productList[item].isVolumeBasedPriceEnabled = false;}
    }
  }
  const features = await findHierarchyFeaturesByLocationId(locationId);
  const deliverySlotsEnabled = !!(features.filter(x => x?.feature?.name === "DELIVERY_SLOTS").length);

  const productQuantityList = productList.map(product => {
    const { quantity } = products.find(
      p => +p.id === +product.product_id || +p.id === +product.id,
    );

    const {
      price,
      tax,
      volumeBasedPriceDetails = {},
    } = calculateTaxAndPriceByCategory(product, quantity, isBatchCalculation);

    // product.tax = eliminateOffByOne(tax);
    // product.price = eliminateOffByOne(price);

    product.tax = tax;
    product.price = price;

    product.expectedDeliveryDate = getDeliveryDate(
      product.deliveryTime,
      countryCode,
      deliverySlotsEnabled,
    ).deliveryDate;
    product.description = formatDescription(product.description);

    // VBP changes --- start
    product.volumeBasedPrices = volumeBasedPriceDetails.volumeBasedPrices;
    product.isVolumeBasedPriceCalculated =
      product.isVolumeBasedPriceEnabled && volumeBasedPriceDetails.volumeBasedPrice > 0;
    product.volumeBasedPriceInfo = getVolumeBasedPriceInfo(product, volumeBasedPriceDetails, isBatchCalculation);

    // actualUnitPrice -> price without volume based discount
    product.actualUnitPrice = isBatchCalculation ? product.basePrice : product.volumeBasedPriceInfo?.actualUnitPrice;
    // VBP changes --- end

    return { quantity, product };
  });


  if (products.length && productsValidationRequired === "true") {
    // perform product validations here
    const productValidation = validateProducts(
      productQuantityList,
      locationId,
      true,
    );

    if (productValidation.length && !forcefullyIgnoreValidations) {
      // to ignore validations if ignoreValidation flag is true
      validationsPassed = false;
      validationResponses.productValidation = productValidation; // if product validation fails
    }

    cart.products = _.cloneDeep(productQuantityList).map(productQuantity => {
      const { product, quantity } = productQuantity;
      product.quantity = quantity;
      product.total = getOrderItemTotal(product);
      product.price = product.taxInclusive
        ? calculateConsumerPrice(product.price, product.tax)
        : +product.price;
      product.tradePrice = (product.tradePrice && product.tradePrice > product.price) ? product.tradePrice : "";
      product.discount =
        product.tradePrice && product.tradePrice > product.price
          ? getDiscountAccordingToTradePrice(product.tradePrice, product.price)
          : "";
      return product;
    });
  }


  let _couponError = null;

  let order;
  if (orderId) {
    order = await findOrderByCriteria({ id: orderId });
  }

  if (isBatchCalculation && orderId) {
    waiver = await findWaiver(orderId);

    eligibleProductsGrandTotal = order.couponProductsTotal || 0;
  }

  if (products.length) {
    // isBatchFlow was true in both of the cases for update cart and calc api, which was wrong

    const prodQuantityList = productQuantityList.filter(prod => prod.quantity > 0);

    let _couponProducts = {
      eligibleList: [],
      ineligibleList: [],
    };

    if (cart.coupon && Object.keys(cart.coupon).length > 0) {
      _couponProducts = await findEligibleProducts(cart.coupon, prodQuantityList);
    }

    const OrderCalculations = await getOrderCalculations({
      productQuantityList: prodQuantityList,
      location,
      coupon: cart.coupon,
      waiver,
      isBatchFlow: isBatchCalculation,
      currency,
      isCartFlow: true,
      order,
      eligibleProductsOrderedPrice: eligibleProductsGrandTotal,
      couponProducts: _couponProducts,
    });

    let {
      total,
      grandTotal,
      subTotal,
      amountPayable,
      tax,
      couponDiscount,
      couponValidation,
      adjustedItems,
      couponError,
    } = OrderCalculations;

    const { eligibleProducts, deliveryCharge, volumeBasedDiscount, remainingPriceForFreeDelivery } =
      OrderCalculations;

    // Sending country code to calculate delivery date by JIT
    let productObjListwithJIT = getProductListByJIT(productQuantityList, countryCode, deliverySlotsEnabled);

    let deliveryAndServiceCharges = {
      deliveryChargeValue: deliveryCharge,
    };

    // JIT Flow for logistic app
    if (orderId) {
      const { totalShipments, currentOrder } = await getTotalShipments(orderId);
      if (totalShipments > 1) {
        const { JITOrderItems } = await getShipmentsOrderItems(currentOrder.shipmentId, currentOrder.id);
        JITOrdersQuantityList = JITOrderItems.map(item => ({
          product: item,
          quantity: item.quantity,
        }));
        const JITproductQuantityList = [
          ...JITOrdersQuantityList,
          ...productQuantityList,
        ].filter(prod => prod.quantity > 0);
        const JITcoupon = cart.coupon;

        let couponProducts = {
          eligibleList: [],
          ineligibleList: [],
        };

        if (JITcoupon && Object.keys(JITcoupon).length > 0) {
          couponProducts = await findEligibleProducts(JITcoupon, JITproductQuantityList);
        }

        const JITOrderCalculation = await getOrderCalculations({
          productQuantityList: JITproductQuantityList,
          location,
          coupon: JITcoupon,
          waiver: 0,
          isBatchFlow: true,
          currency,
          order,
          eligibleProductsOrderedPrice: eligibleProductsGrandTotal,
          couponProducts,
        });

        const JITOrdersTotal = JITOrderCalculation.total;
        deliveryAndServiceCharges = fetchDeliveryAndServiceCharges(
          location,
          JITOrdersTotal,
          totalShipments,
          JITOrderCalculation.tax,
          order);
        couponValidation = JITOrderCalculation.couponValidation;
        couponError = JITOrderCalculation.couponError;
        const adjustedItemsAll = JITOrderCalculation.adjustedItems;
        const currentAdjustedItems = adjustedItemsAll.filter(adjustedItem =>
          productQuantityList.find(product => product.product.productId === adjustedItem.product.productId));
        const customerId = currentOrder.customerId;
        const paymentType = currentOrder.paymentType;
        const JITShipment = createJITShipment(
          { location, paymentType, customerId, deliveryAndServiceCharges, waiver },
          currency,
          currentAdjustedItems);
        couponDiscount = JITShipment.discount;
        tax = JITShipment.tax;
        amountPayable = JITShipment.amountPayable;
        subTotal = JITShipment.subTotal;
        grandTotal = JITShipment.grandTotal;
        total = JITShipment.total;
        adjustedItems = currentAdjustedItems;
      }
    }

    // JIT Flow for consumer app
    if (!isBatchCalculation) {
      const shipments = [];
      newJITShipment = {};
      productObjListwithJIT = getProductListByJIT(adjustedItems, countryCode, deliverySlotsEnabled);
      for (const productJIT in productObjListwithJIT) {
        if (productObjListwithJIT[productJIT]) {
          const JITproductList = productObjListwithJIT[productJIT];
          newJITShipment = createJITShipment(cart, currency, JITproductList);
          shipments.push({ [productJIT]: _.cloneDeep(newJITShipment) });
        }
      }
      cart.shipments = shipments;
    }

    _couponError = couponError;
    if (couponError) {
      validationsPassed = false;
    }

    if (!forcefullyIgnoreValidations) {
      try {
        if (couponError) {
          validationResponses.couponValidation = couponError;
        }

        validateTotalAboveLimit(
          grandTotal,
          location.maxOrderLimit,
        );
      } catch (error) {
        if (!isBatchCalculation) {
          updateCartRedis(userId, cart);
        }
        if (calculateTotal === "true") {
          cart = cartCalculations({
            cart,
            tax,
            grandTotal,
            subTotal,
            total,
            couponDiscount,
            eligibleProducts,
            couponValidation,
            waiver,
            amountPayable,
            deliveryAndServiceCharges,
            volumeBasedDiscount,
            remainingPriceForFreeDelivery,
          });
          error.data.cart = cart;
        }

        throw error;
      }
    }
    /**
     * there are two use cases, one is the normal successfull case in which catch doesnt work
     * and the other one is the case where we send updated cart in error response as well for frontend requirement
     */
    if (calculateTotal === "true") {
      cart = cartCalculations({
        cart,
        tax,
        grandTotal,
        subTotal,
        total,
        couponDiscount,
        eligibleProducts,
        couponValidation,
        waiver,
        amountPayable,
        deliveryAndServiceCharges,
        volumeBasedDiscount,
        remainingPriceForFreeDelivery,
      });
    }
  }
  if (creditValidationRequired === "true") {
    const { eligibility, balance } = await getRetailerEligibilityAndBalance(
      retailerId,
    );
    retailerLoanBalance = balance;
    if (!eligibility) {
      validationsPassed = false;
      validationResponses.creditValidation = {
        code: 2000,
        message: "You are not eligible for credit buy yet",
      };
    }
    if (balance < cart.grandTotal) {
      validationsPassed = false;
      validationResponses.creditValidation = {
        code: 2001,
        message: `Cart total: ${cart.grandTotal} exceeds your available loan credit: ${balance}`,
      };
    }
  }
  if (!validationsPassed) {
    const error = { data: { cart, ...validationResponses } };
    if (_couponError) {
      error.data = { ...error.data, ..._couponError.data };
    }

    throw error;
  }
  if (cart.paymentType === CREDIT) {
    // TODO: Place this validation after the loan summary call
    if (orderIsInCreditBuyLimit(cart.grandTotal, currency)) {
      const { phone: retailerPhone, cnic: retailerCnic } = await findCustomerById(retailerId);
      const LMS_RES = await fetchLoanSummary(
        retailerId,
        cart.grandTotal,
        retailerPhone,
        retailerCnic,
        orderId,
        loanProductId,
        cart.products.map(product => ({
          id: product.id,
          price: product.price * product.quantity,
        })),
      );

      const loanSummary = LMS_RES.data.data;
      cart.grandTotal = loanSummary.specs["Total Payable Before Due Date"];
      cart.amountPayable = cart.grandTotal;
      cart.creditBuyFee = loanSummary.specs["Markup Amount"];
      cart.loanDuration = parseInt(loanSummary.specs["Loan Duration"]);

      if (creditValidationRequired === "true") {
        if (retailerLoanBalance < cart.grandTotal) {
          validationResponses.creditValidation = {
            code: 2001,
            message: `Cart total with service fee: ${cart.grandTotal},
             exceeds available loan credit: ${retailerLoanBalance}`,
          };
          const error = { data: { cart, ...validationResponses } };

          throw error;
        }
      }
      if (!orderIsInCreditBuyLimit(cart.grandTotal, currency)) {
        validationResponses.creditValidation = {
          code: 2002,
          message: `Cart total: ${cart.grandTotal}, not in Creditbuy limit`,
        };
        const error = { data: { cart, ...validationResponses } };
        throw error;
      }
    } else {
      validationResponses.creditValidation = {
        code: 2002,
        message: `Cart total: ${cart.grandTotal}, not in Creditbuy limit`,
      };
      const error = { data: { cart, ...validationResponses } };
      throw error;
    }
  }
  cart.currency = currency;
  cart.taxAmount = getTaxFromOrderItems(
    cart.products
      .filter(
        details =>
          !details.taxInclusive && details.taxCategory === TAX_ON_PRICE,
      )
      .map(details => ({ product: details, quantity: details.quantity })),
  );
  cart.subTotal -= cart.taxAmount;
  return cart;
};

const cartCalculations = ({
  cart,
  tax,
  grandTotal,
  subTotal,
  total,
  couponDiscount,
  eligibleProducts,
  couponValidation,
  waiver,
  amountPayable,
  deliveryAndServiceCharges,
  volumeBasedDiscount,
  remainingPriceForFreeDelivery,
}) => {
  cart.tax = tax;
  cart.grandTotal = grandTotal;
  cart.subTotal = subTotal;
  cart.total = total;
  cart.couponDiscount = +couponDiscount;
  cart.eligibleProducts = eligibleProducts;
  cart.remainingPriceForFreeDelivery = remainingPriceForFreeDelivery < 0 ? 0 : remainingPriceForFreeDelivery;
  cart.deliveryCharges = deliveryAndServiceCharges?.deliveryChargeValue;
  if (couponValidation) {
    cart.couponValidation = couponValidation;
  }
  cart.waiver = waiver;
  cart.amountPayable = amountPayable;
  cart.volumeBasedDiscount = +volumeBasedDiscount;
  return cart;
};

/**
 * Function updates cart key value part in redis
 * @param userId: int,
 * @param cart: Object
 * @returns null
 */
const updateCartRedis = (userId, cart) => {
  const logIdentifier = `API version: V1, Context: cartService.updateCartRedis(),`;
  sails.log(`${logIdentifier} Entry`);
  update(userId, cart).catch(error =>
    sails.log(
      `${logIdentifier} Getting an error while updating the cart in redis, Error: ${JSON.stringify(error)}`,
    ),
  );
};

/**
 * handler Function for updateCart API endpoint
 * updates cart object in redis
 * @param {Object} user
 * @param {Number} cart
 * @param {String|Boolean} couponValidationRequired
 * @param {String|Boolean} productsValidationRequired
 * @param {String|Boolean} calculateTotal
 * @returns {Cart}: Object
 */
const updateCart = async (
  user,
  cart,
  couponValidationRequired = false,
  productsValidationRequired = false,
  calculateTotal = false,
  creditValidationRequired = false,
) => {
  const { id: userId } = user;
  cart.retailerId = userId;
  const _cart = await generateCart(
    user,
    cart,
    couponValidationRequired,
    productsValidationRequired,
    calculateTotal,
    false,
    false,
    creditValidationRequired,
  );
  updateCartRedis(userId, _cart);
  return await makeResponse(_cart);
};

const makeResponse = async cart => {
  for (const product of cart.products) {
    if (product.multilingual) {
      const localName = product.multilingual.find(
        obj =>
          obj.language === getLanguage() &&
          obj.attributeName === MultiLingualAttributes.NAME,
      );
      product.name = localName ? localName.value : product.name;
      delete product.multilingual;
    }
  }
  return cart;
};

const clearRetailerCart = async retailerId => {
  updateCartRedis(retailerId, { products: [] });
};

module.exports = {
  findCart,
  updateCart,
  generateCart,
  clearRetailerCart,
};
