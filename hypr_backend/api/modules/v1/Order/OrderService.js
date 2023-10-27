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

// Third party imports
const snakecaseKeys = require("snakecase-keys");
const redis = require("ioredis");

// Arithmos Imports
const {
  arithmos: {
    calculateTaxAndPriceByCategory,
    getDeliveryCharge,
    getOrderCalculations,
    getServiceCharge,
    calculateGrandTotalOnOrder,
    getGrandTotalWithWavierDiscount,
  },
} = require("../Arithmos");

// Dao Imports
const orderDao = require("./OrderDao");
const orderAmountAdjustmentDao = require("./OrderAmountAdjustmentDao");
const orderItemsDao = require("./OrderItemsDao");
const waiverDao = require("../Waiver/WaiverDao");

// Service imports
const { findAuthStoresByUserIdChecked } = require("../Auth/AuthStoreService");
const { createOrderHistory } = require("./OrderHistoryService");
const { createOrderItem } = require("./OrderItemService");
const { createOrderStatusHistory } = require("./OrderStatusHistoryService");
const { renderOrderPlacementEmail } = require("./Utils");
const {
  findCheckedCustomerAddressByCustomerId,
  findShopByCustomerId,
  findCustomerById,
  customerService: {
    findCustomer,
  },
  companyService: {
    findCompany,
  },
} = require("../Auth");
const { sendCustomerNotification } = require("../../../../api/services/OrderService");
const {
  locationValidator: {
    validateSalesAgentLocation,
  },
} = require("../Location");
const {
  getNotificationType,
  getPagination,
} = require("../../../../utils/services");

const {
  validateCoupon,
} = require("../Coupon/CouponDao");
const {
  couponService: {
    findCouponByUnCheckedId,
    createCouponUsageHistory,
  },
} = require("../Coupon");
const {
  productService: {
    findProductById,
    updateProduct,
    updateProductInventory,
    getVolumeBasedPriceInfo,
    populatePriceAndTaxByCategory,
  },
  productValidator: {
    validateProducts,
    isDuplicateProducts,
  },
  productUtils: {
    mergeDuplicateProducts,
  },
} = require("../Product");
const {
  BATCH_STATES: { ACCEPTED, COMPLETED, CLOSED },
  batchService: {
    findBatchByCriteria,
    findBatchesByIds,
    findBatchOrders,
    updateBatch,
    updateBatchInventory,
  },
  BATCH_HISTORY_TYPES,
} = require("../Batch");

const {
  fetchLoanSummary,
  createLoanApplication,
  deliverOrderOnCredit,
  updateOrderPaymentMethod,
  orderIsInCreditBuyLimit,
} = require("../LMS");

const {
  createPaymentsTransaction,
  completePaymentsTransaction,
  cancelPaymentsTransaction,
  rollbackPaymentsTransaction,
  getPaymentsCashAmount,
} = require("../Payments");

const { cartService: { clearRetailerCart } } = require("../Cart");

// Helper imports
const {
  validateOrderWaiver,
  validateCustomerId,
  validateOrderItems,
  validateOrderStatusLogistic,
  validateOrderStatusPortal,
  validateOrder,
  validateCustomerLocation,
  validateCurrentCustomerLocation,
  validateCreditOrderAndGetCreditFee,
  validateOrderStatusConsumer,
} = require("./OrderValidator");
const {
  toOrderDto,
  toOrderEntity,
  toOrderHistoryEntity,
  toOrderItemsEntity,
  toOrderStatusHistoryEntity,
  toOrderItemsForEmail,
  toOrderInfoForEmail,
  orderInfoToPublish,
  priceMappingForSpotsaleProduct,
} = require("./OrderMapper");
const {
  toCouponUsageHistoryEntity,
} = require("../Coupon/CouponMapper");

const { getSqlDateObject } = require("../../../../utils/services");
const { TAX_CATEGORIES: { TAX_ON_PRICE } } = require("../../../services/Constants.js");
const keys = require("../../../../utils/keys");

const {
  errors: {
    UNABLE_TO_PLACE_ORDER,
    INVALID_USER_ID,
    INVALID_ORDER_STATUS,
    SPOT_PRODUCT_NOT_FOUND,
  },
} = require("./Errors");

const {
  errors: {
    PAYMENTS_SERVICE_ERROR,
  },
} = require("../Payments/Errors");

const {
  errors: {
    MULTIPLE_SHIPMENTS_ON_COD_WALLET,
  },
} = require("../Cart/Errors");

const {
  errors: {
    PRODUCT_STOCK_LOWER,
  },
} = require("../Product/Errors");

const { getProductListByJIT, fetchOrderCalculations, fetchDeliveryAndServiceCharges } = require("../../v1/JIT");

// Constants Imports
const { constants: { WAIVER } } = require("../../../constants/services");
const {
  HyprOrderStates: { SALE_ORDER },
  GENERIC_CONSTANTS: { THIRTY_DAYS_BACK },
  HyprRoles: { CONSUMER, SUPERVISOR, DELIVERY, getKeyFromValue },
  HyprNotificationType: { CUSTOMER_PLACE_ORDER, ORDER_PAYMENT_TYPE_UPDATED },
} = require("../../../services/Constants");
const orderHistoryDao = require("./OrderHistoryDao");
const {
  ORDER_TYPES: {
    SPOT_ORDER,
  },
  ORDER_STATES: {
    PARTIAL_DELIVERED,
    IN_TRANSIT,
    RESERVED,
    PACKED,
    DELIVERED,
    CANCELLED,
    ON_HOLD,
  },
} = require("./Constants");
const {
  PAYMENT_TYPES: { CREDIT, COD, COD_WALLET, SADAD, SADAD_WALLET },
} = require("./Constants");
const { locking, unLocking } = require("../Redis/RedisService");
const { findLatestBatchStatusByOrderId, createBatchHistory, getSpotProductsByBatch } = require("../Batch/BatchService");
const { createJITShipment } = require("../../v1/JIT/JITUtils");
const { getShipmentsOrderItems } = require("../../v1/JIT/JITOrder");
const { publishMessage } = require("../../../../utils/sns-publisher");
const { wavierService: { findWaiverAmount } } = require("../Waiver");
const {
  createCreditNoteInvoice,
  findLatestInvoice,
  markInvoiceDownloadedForOrder,
} = require("../EInvoice/EInvoiceService");
let client;
if (process.env.REDIS_SERVER) {
  client = redis.createClient({ host: process.env.REDIS_SERVER });
} else {
  client = redis.createClient();
}
const lock = require("redis-lock")(client);

const locationExtractionService = require("../../../config_service_extraction/locationsExtraction");
const camelcaseKeys = require("camelcase-keys");
const uuid4 = require("uuid4");
const { getUpdatedProductStock } = require("../ProductQuantityLimit");
const { deliverySlotsService: { getOrderItemsDeliveryTime } } = require("../DeliverySlots");

const { getTaxFromOrderItems } = require("../Arithmos/Arithmos");
const { getUpdatedProductList, getMOVRules } = require("../../../pricing_engine_service/pricingEngineService");
const { findHierarchyFeaturesByLocationId } = require("../HierarchyFeatures");
const { findEligibleProducts } = require("../Coupon/CouponService");

/**
 * This function get latest order by customer Id
 * @param {Number} customer_id
 * @returns {Order} order
 */
const getLatestOrderByCustomerId = async customerId => {
  const criteria = {
    disabled: false,
    customer_id: customerId,
  };
  const response = await orderDao.findLatestByCriteria(criteria);
  return response;
};

/**
 * This function takes order, userId and create the order
 *
 * @param {Object} order
 * @param {Object} order
 * @returns {Number} id
 */
const placeOrder = async (order, user, deviceId, appVersion, userId, validateDeliveryTime, shopTypeId, zones) => {
  let retailerOrderLock;
  try {
    const timerStartPlaceOrderTotal = Date.now();
    const timerStartInitialization = Date.now();

    const logIdentifier = `API version: V1, Context: orderService.placeOrder(), userId: ${userId}`;

    const { coupon, locationId, customerId, deliveryAddressId, paymentType, loanProductId } = order;
    let { products } = order;
    let { id } = user;
    const { role, phone: retailerPhone, cnic: retailerCnic, clientTimeOffset } = user;
    let validationPassed = true;
    let salesAgentLocations = [];
    let orderInfo = {};

    // Check duplicate products and merge the products
    if (isDuplicateProducts(products)) {
      products = mergeDuplicateProducts(products);
    }

    /**
     *
     * This check is for the agent flow while placing an order.
     *
     * If role is SUPERVISOR. customerid should exists in the order.
     * Update the sales agent id with the user id and update the user id to customer id.
     */
    if (+role === +SUPERVISOR) {
      validateCustomerId(order);
      order.salesAgentId = id;
      id = customerId;
      const authStores = await findAuthStoresByUserIdChecked(order.salesAgentId);
      salesAgentLocations = authStores.map(authStore => authStore.location);
    } else if (+role === +DELIVERY) {
      validateCustomerId(order);
      order.delivery_boy_id = id;
      id = customerId;
      const authStores = await findAuthStoresByUserIdChecked(order.delivery_boy_id);
      salesAgentLocations = authStores.map(authStore => authStore.location);
    }
    /**
     * This check is for the consumer flow while placing an order.
     *
     * If role is CONSUMER.
     * Check Customer Current location.
     */
    if (+role === +CONSUMER) {
      const customerShop = await findShopByCustomerId(id);

      if (customerShop) {
        const coords = JSON.parse(customerShop.shop_location);
        const { store: storeLocation } = await locationExtractionService.getStore(coords.latitude, coords.longitude);

        validateCustomerLocation(storeLocation);
        validateCurrentCustomerLocation(storeLocation.location_id, locationId);
      }
    }

    const timerEndInitialization = Date.now();
    const timerStartFindAddress = Date.now();

    /**
     * Find the address by user id
     */
    if (!deliveryAddressId) {
      const { id: customerAddressId } =
        await findCheckedCustomerAddressByCustomerId(id);
      order.deliveryAddressId = customerAddressId;
    }

    const timerEndFindAddress = Date.now();
    const timerStartFindLocation = Date.now();

    const location = camelcaseKeys(await locationExtractionService.findOne({
      id: locationId,
      relations: ["businessUnit"],
    }), { deep: true });

    const currency = location.businessUnit.currency;
    const countryCode = location.businessUnit.countryCode;

    /**
     * Validating the sales agent location.
     */
    if (!_.isEmpty(salesAgentLocations)) {
      validateSalesAgentLocation(salesAgentLocations, location.id);
    }

    const timerEndFindLocation = Date.now();
    const timerStartFindProducts = Date.now();


    // Finding the products
    let productList = await Promise.all(
      products.map(product => findProductById(product.id)),
    );


    const features = await findHierarchyFeaturesByLocationId(locationId);
    const deliverySlotsEnabled = !!(features.filter(x => x?.feature?.name === "DELIVERY_SLOTS").length);

    productList = await getUpdatedProductStock(id, productList, clientTimeOffset);
    if (+role === +DELIVERY) {
      location.deliveryChargeValue = 0;
      productList = priceMappingForSpotsaleProduct(products, productList);
    }
    sails.log.info(`OrderService: placeOrder, Product list: ${JSON.stringify(productList)}`);

    let productsDeliveryTime = [];

    if (validateDeliveryTime === "true") {
      const orderItemsDeliveryTime = productList.map(productInfo => {
        const { deliveryTime: orderItemDeliveryTime } = products.find(p => p.id === productInfo.id);
        return { productId: productInfo.id, jitDeliveryTime: productInfo.deliveryTime, orderItemDeliveryTime };
      });

      productsDeliveryTime = await getOrderItemsDeliveryTime(
        orderItemsDeliveryTime,
        location, userId,
        deliverySlotsEnabled,
        false,
      );
    }
    const productItems = [];

    // Funnel Injection | Pricing Engine | Dynamic Pricing
    productList = await getUpdatedProductList({
      locationId: location.id,
      shopTypeId: order.shopTypeId,
      zoneId: order.zones,
      products: productList,
    });

    let productQuantityList = productList.map(product => {
      const productDeliverySlot = productsDeliveryTime.find(item => item.productId === product.id);
      const { quantity } = products.find(p => p.id === product.id);
      productItems.push({ id: product.id, price: product.price * quantity });
      const { price, tax, volumeBasedPriceDetails = {} } = calculateTaxAndPriceByCategory(product, quantity);
      product.price = price;
      product.tax = tax;
      product.deliveryTime = productDeliverySlot?.deliveryTime ?? product.deliveryTime;

      // VBP changes --- start
      product.volumeBasedPrices = volumeBasedPriceDetails.volumeBasedPrices;
      product.isVolumeBasedPriceCalculated =
        product.isVolumeBasedPriceEnabled && volumeBasedPriceDetails.volumeBasedPrice > 0;
      product.volumeBasedPriceInfo = getVolumeBasedPriceInfo(product, volumeBasedPriceDetails);

      // actualUnitPrice -> price without volume based discount
      product.actualUnitPrice = product.volumeBasedPriceInfo?.actualUnitPrice;
      // VBP changes --- end

      return { quantity, product };
    });


    const timerEndFindProducts = Date.now();
    const timerStartValidateProducts = Date.now();

    const validationResponses = {
      couponValidation: null,
      productValidation: null,
    };


    // Sending country code to calculate delivery date by JIT
    let productObjListwithJIT = getProductListByJIT(
      productQuantityList,
      countryCode,
      deliverySlotsEnabled,
      false,
    );
    const shipmentsLength = Object.keys(productObjListwithJIT).length;


    if (shipmentsLength > 1 && paymentType === COD_WALLET) {
      sails.log.error(`${logIdentifier} Error: Cannot have multiple shipments with Payment Type = COD_WALLET`);
      // TODO throw proper errors
      throw {
        data: MULTIPLE_SHIPMENTS_ON_COD_WALLET(),
        message: "Error: Cannot have multiple shipments with Payment Type = COD_WALLET",
      };
    }

    // Acquire lock on retailerId
    const lockResource = `locks:retailerOrderLock:${id}`;
    retailerOrderLock = await locking(lockResource, 10000);
    if (+role !== +DELIVERY) {
      const productValidations = validateProducts(
        productQuantityList,
        location.id,
        true,
      );

      if (productValidations.length) {
        validationPassed = false;
        validationResponses.productValidation = productValidations;
      }
    }
    const timerEndValidateProducts = Date.now();
    const timerStartValidateCoupon = Date.now();

    let verifiedCoupon = null;
    let couponId = null;

    if (coupon && Object.keys(coupon).length > 0) {
      const couponProducts = products.map(product => ({ id: product.id }));
      const { success, data: couponData } = await validateCoupon(
        coupon,
        couponProducts,
        locationId,
        id,
        role,
        user.language,
        user.clientTimeOffset,
      );
      if (!success) {
        validationPassed = false;
        validationResponses.couponValidation = couponData;
      } else {
        verifiedCoupon = couponData;
        couponId = verifiedCoupon.id;
      }
    }
    const timerEndValidateCoupon = Date.now();
    const timerStartValidateOrder = Date.now();

    if (!validationPassed) {
      throw { data: validationResponses };
    }

    let couponProducts = {
      eligibleList: [],
      ineligibleList: [],
    };

    const prodQuantityList = productQuantityList.filter(prod => prod.quantity > 0);

    if (verifiedCoupon && Object.keys(verifiedCoupon).length > 0) {
      couponProducts = await findEligibleProducts(verifiedCoupon, prodQuantityList);
    }

    const orderCalculations = await getOrderCalculations({
      productQuantityList: prodQuantityList,
      location,
      coupon: verifiedCoupon,
      currency,
      couponProducts,
    });

    const { total, couponDiscount, adjustedItems, tax, eligibleProductsGrandTotal, subTotal } = orderCalculations;
    let { grandTotal } = orderCalculations;

    productQuantityList = adjustedItems;

    // TODO Check if validation should be performed on subTotal instead of grantTotal

    const timerStartBNPLOverhead = Date.now();
    // Validate if order is eligible for payment on credit
    if (paymentType === CREDIT) {
      await validateCreditOrderAndGetCreditFee(
        id,
        grandTotal,
        retailerPhone,
        retailerCnic,
        currency,
        loanProductId,
        productItems,
      );
    }

    const timerEndBNPLOverhead = Date.now();
    let movRuleId;
    if (+role !== +DELIVERY) {
      let minOrderLimit;
      const productIds = products.map(product => product.id);
      if(sails.config.globalConf.MOV_FEATURE_FLAG) {
        const movResponse = await getMOVRules({
          locationId: location.id,
          zones: order.zones,
          shopTypeId: order.shopTypeId,
          productIds,
        });
        if(movResponse && movResponse.isMOVapplicable) {
          minOrderLimit = movResponse.mov;
          movRuleId = movResponse.ruleHistoryId;
        }else{
          minOrderLimit = location.minOrderLimit;
        }
      }else{
        minOrderLimit = location.minOrderLimit;
      }

      validateOrder(
        grandTotal,
        minOrderLimit,
        location.maxOrderLimit,
      );
    }
    const timerEndValidateOrder = Date.now();

    const timerStartUpdateStock = Date.now();
    // Updating the stock.
    let updatedProducts;
    let timerEndUpdateStock;

    let timerStartRollbackMechanism;
    if (+role !== +DELIVERY) {
      updatedProducts = await Promise.allSettled(
        productQuantityList.map(productQuantity => {
          const {
            product: { id: productId },
            quantity,
          } = productQuantity;
          return updateProduct(productId, quantity);
        }),
      );
      timerEndUpdateStock = Date.now();

      timerStartRollbackMechanism = Date.now();
      // Roll Back mechanism
      const rejectedProduct = updatedProducts.find(s => s.status === "rejected");

      if (rejectedProduct) {
        const updatedProductsArray = updatedProducts
          .map(
            updatedProduct =>
              updatedProduct.status === "fulfilled" && updatedProduct.value,
          )
          .filter(p => p);
        try {
          await Promise.all(
            updatedProductsArray.map(productQuantity => {
              const {
                product: { id: productId },
                quantity,
              } = productQuantity;
              return updateProduct(productId, quantity, true);
            }),
          );
        } catch (error) {
          sails.log.error(`${logIdentifier} Error: ${JSON.stringify(error)}`);
          // TODO Need to integrate an email alert
        }
      }

      if (rejectedProduct) {
        throw { message: UNABLE_TO_PLACE_ORDER().message };
      }
    }
    const timerEndRollbackMechanism = Date.now();
    const timerStartCreateOrder = Date.now();

    // TODO REMOVE, currently the total_price for an order expects to have price without discount applied.
    // once the frontend is refactored we can remove this
    // keeping this variable to sent out in sms/notification
    const grandTotalWithoutDiscount = grandTotal;
    grandTotal = grandTotal + couponDiscount; // override parent scope grandTotal variable with total_price

    const shipments = [];
    // fetch delivery and service charges based on shipments length
    const deliveryAndServiceCharges = fetchDeliveryAndServiceCharges(location, total, shipmentsLength, tax);
    productObjListwithJIT = getProductListByJIT(
      productQuantityList,
      countryCode,
      deliverySlotsEnabled,
      false,
    );

    for (const productJIT in productObjListwithJIT) {
      if (Object.prototype.hasOwnProperty.call(productObjListwithJIT, productJIT)) {
        const JITproductList = productObjListwithJIT[productJIT];
        const newJITShipment = fetchOrderCalculations({
          order,
          currency,
          productList: JITproductList,
          couponId,
          customerId: id,
          deliveryAndServiceCharges,
        });
        sails.log(`Debug CB-953, Initial order calculations -> ${JSON.stringify(newJITShipment)}`);
        if (paymentType === CREDIT) {
          const jitProductItems = JITproductList.map(item => ({
            id: item.product.id,
            price: item.product.price * item.quantity,
          }));
          try {
            const {
              data: { data: loanSummary },
            } = await fetchLoanSummary(
              id,
              newJITShipment.totalCalculations.grandTotal,
              retailerPhone,
              retailerCnic,
              null,
              loanProductId,
              jitProductItems,
            );

            newJITShipment.totalCalculations.creditBuyFee = loanSummary.specs["Markup Amount"];
            // eslint-disable-next-line max-len
            sails.log(`Debug CB-953, Order calculations after fetching loan summary -> ${JSON.stringify(newJITShipment)}`);
          } catch (err) {
            await revertUpdatedOrderProducts(updatedProducts, logIdentifier);
            throw err;
          }
        }
        shipments.push({ [productJIT]: newJITShipment });
        sails.log(`Debug CB-953, State of shipments array after push -> ${JSON.stringify(newJITShipment)}`);
      }
    }
    sails.log(`Debug CB-953, State of shipments array after all the pushes -> ${JSON.stringify(shipments)}`);

    const shipmentId = shipments.length > 1 ? uuid4() : null;
    const orders = [];

    for (const shipment of shipments) {
      sails.log(`Debug CB-953, State of a shipment starting order creation block -> ${JSON.stringify(shipment)}`);

      const orderProductIds = Object.values(shipment)[0].order.products;
      // filter product and quantity for the current shipment from all the products
      let orderproductQuantityList = productQuantityList.filter(item => orderProductIds.includes(item.product.id));
      const orderProductItems = orderproductQuantityList.map(item => ({
        id: item.product.id,
        price: item.product.price * item.quantity,
      }));
      if (+role === +DELIVERY) {
        Object.values(shipment)[0].order.order_type = SPOT_ORDER;
      }
      const createdOrder = await createOrder(
        toOrderEntity(
          Object.values(shipment)[0].order,
          id,
          Object.values(shipment)[0].totalCalculations,
          deliveryAndServiceCharges,
          deviceId,
          appVersion,
          shipmentId,
          location,
          eligibleProductsGrandTotal,
          movRuleId,
        ),
      );
      // sails.log(`Debug CB-953, State of a shipment after order creation in DB -> ${JSON.stringify(shipment)}`);

      const timerEndCreateOrder = Date.now();
      const timerStartUpdateCouponUsageHistory = Date.now();

      // Setting up order data to send to aws sns service
      orderInfo = orderInfoToPublish(createdOrder);
      sails.log(`Debug CB-953, State of a shipment after order creation in DB -> ${JSON.stringify(shipment)}`);

      // Sending loan application and deployment call if payment method is credit
      if (paymentType === CREDIT) {
        try {
          // eslint-disable-next-line no-unused-vars
          const loanApplicationRes = await createLoanApplication(
            createdOrder.id,
            createdOrder.customerId,
            Object.values(shipment)[0].totalCalculations.grandTotal,
            retailerCnic,
            retailerPhone,
            loanProductId,
            orderProductItems,
          );
        } catch (err) {
          // if loan application fails, replenish the stock and delete the order
          await revertOrderPlacement(createdOrder, updatedProducts, logIdentifier);
          throw err;
        }
        sails.log(`Debug CB-953, State of a shipment after createLoanApplication call -> ${JSON.stringify(shipment)}`);
      }

      // Sending request to Payments service to create transactions if payment method is COD_WALLET
      if (paymentType === COD_WALLET) {
        try {
          await createPaymentsTransaction({
            retailerId: createdOrder.customerId,
            orderId: createdOrder.id,
            total: {
              amount: grandTotalWithoutDiscount,
              currency: currency,
            },
            orderPaymentMethod: COD_WALLET,
          });
        } catch (err) {
          // if payment method record generation fails, replenish the stock and delete the order
          await deliverOrderOnCredit(createdOrder.customerId, createdOrder.id,
            Object.values(shipment)[0].totalCalculations.grandTotal, CANCELLED, createdOrder.creditBuyFee,
          );
          await revertOrderPlacement(createdOrder, updatedProducts, logIdentifier);
          throw err;
        }
      }

      let timerEndUpdateCouponUsageHistory = Date.now();
      let timerStartCreateOrderItems = Date.now();
      let timerEndCreateOrderItems = Date.now();
      let timerStartSendEmail = Date.now();

      try {
        if (verifiedCoupon) {
          const couponUsageHistory = toCouponUsageHistoryEntity(
            couponId,
            id,
            createdOrder.id,
            couponDiscount,
            verifiedCoupon.discountType.id ?? verifiedCoupon.discountType,
          );

          await createCouponUsageHistory(couponUsageHistory);
        }

        timerEndUpdateCouponUsageHistory = Date.now();
        timerStartCreateOrderItems = Date.now();

        // re-setting price and tax to actual non-VBP values - don't change/remove without permission
        orderproductQuantityList = resetPriceForVolumeBasedProducts(orderproductQuantityList);

        // same order items based on the tax-compliance format,
        // calculcateTaxAndPrice will extract the price, tax for the order items.
        const parsedOrderItems = toOrderItemsEntity(
          createdOrder.id,
          orderproductQuantityList,
        );

        sails.log.info(`OrderService: placeOrder, Order items: ${JSON.stringify(parsedOrderItems)}`);
        const createdOrderItems = await Promise.all(
          parsedOrderItems.map(parsedOrderItem => createOrderItem(parsedOrderItem)),
        );

        timerEndCreateOrderItems = Date.now();
        timerStartSendEmail = Date.now();

        sendOrderPlacementEmail(
          createdOrder,
          orderproductQuantityList,
          createdOrderItems,
          location,
        );
        const customer = await findCustomer(createdOrder.customerId);

        // sending sms and notification on place order
        if (customer && Object.keys(customer).length > 0) {
          if (paymentType !== CREDIT) {
            sendCustomerNotification(
              customer.id,
              CUSTOMER_PLACE_ORDER,
              snakecaseKeys(createdOrder),
              Object.values(shipment)[0].totalCalculations.grandTotal,
            );
          }
        }

        // Creating order history for the order
        createOrderHistory(
          toOrderHistoryEntity(
            createdOrder.id,
            createdOrder.statusId,
            Object.values(shipment)[0].totalCalculations.subTotal,
            snakecaseKeys({ ...createdOrder, eligibleProductsGrandTotal }),
            snakecaseKeys({ ...createdOrder, eligibleProductsGrandTotal }),
          ),
        );

        // Creating order status history for the order
        createOrderStatusHistory(
          toOrderStatusHistoryEntity(createdOrder.id, createdOrder.statusId, userId, getKeyFromValue(+role), deviceId),
        );
      } catch (err) {
        await deliverOrderOnCredit(createdOrder.customerId, createdOrder.id,
          Object.values(shipment)[0].totalCalculations.grandTotal, CANCELLED, createdOrder.creditBuyFee,
        );
        await revertOrderPlacement(createdOrder, updatedProducts, logIdentifier);
        sails.log.error(
          `${logIdentifier} An error occurred while placing order -> ${JSON.stringify(err.stack || err)}`,
        );

        throw err;
      }

      clearRetailerCart(createdOrder.customerId);

      const timerEndSendEmail = Date.now();
      const timerEndPlaceOrderTotal = Date.now();

      const timersDict = {
        Initialization: timerEndInitialization - timerStartInitialization,
        FindAddress: timerEndFindAddress - timerStartFindAddress,
        FindLocation: timerEndFindLocation - timerStartFindLocation,
        FindProducts: timerEndFindProducts - timerStartFindProducts,
        ValidateProducts: timerEndValidateProducts - timerStartValidateProducts,
        ValildateCoupon: timerEndValidateCoupon - timerStartValidateCoupon,
        ValidateOrder: timerEndValidateOrder - timerStartValidateOrder,
        BNPLOverhead: timerEndBNPLOverhead - timerStartBNPLOverhead,
        UpdateStock: timerEndUpdateStock - timerStartUpdateStock,
        RollbackMechanism: timerEndRollbackMechanism - timerStartRollbackMechanism,
        CreateOrder: timerEndCreateOrder - timerStartCreateOrder,
        UpdateCouponUsageHistory:
          timerEndUpdateCouponUsageHistory - timerStartUpdateCouponUsageHistory,
        CreateOrderItems: timerEndCreateOrderItems - timerStartCreateOrderItems,
        SendEmail: timerEndSendEmail - timerStartSendEmail,
        PlaceOrderTotal: timerEndPlaceOrderTotal - timerStartPlaceOrderTotal,
      };

      await publishMessage(keys.topic_arn, JSON.stringify(orderInfo));

      orders.push({
        subTotal: subTotal,
        orderId: createdOrder.id,
        timersDict,
      });
    }

    return {
      message: "Order(s) created successfully",
      order: orders,
    };
  } finally {
    if (retailerOrderLock) {
      unLocking(retailerOrderLock).catch(error => sails.log(error));
    }
  }
};

/**
 * This function takes createdOrder, updatedProducts, logIdentifier and deletes order and restocks products
 *
 * @param {Object} createdOrder
 * @param {Object} updatedProducts
 * @param {String} logIdentifier
 */
const revertOrderPlacement = async (createdOrder, updatedProducts, logIdentifier = "") => {
  sails.log(
    `${logIdentifier} Reverting these updated products -> ${JSON.stringify(updatedProducts)}`,
  );
  await Promise.all(
    updatedProducts.map(productUpdate => {
      const {
        value: {
          product: { id: productId },
          quantity,
        },
      } = productUpdate;
      return updateProduct(productId, quantity, true, false);
    }),
  );
  sails.log(`${logIdentifier} Destroying created order -> ${JSON.stringify(createdOrder)}`);
  const deletedOrder = await orderDao.hardDeleteOne({
    id: createdOrder.id,
  });
  sails.log(`${logIdentifier} Destroyed order -> ${JSON.stringify(deletedOrder)}`);
};

/**
 * This function takes updatedProducts and logIdentifier, Restocks products
 *
 * @param {Object} updatedProducts
 * @param {String} logIdentifier
 */
const revertUpdatedOrderProducts = async (updatedProducts, logIdentifier = "") => {
  sails.log(
    `${logIdentifier} Reverting these updated products -> ${JSON.stringify(updatedProducts)}`,
  );
  return await Promise.all(
    updatedProducts.map(productUpdate => {
      const {
        value: {
          product: { id: productId },
          quantity,
        },
      } = productUpdate;
      return updateProduct(productId, quantity, true, false);
    }),
  );
};

/**
 * This function takes createdOrder, productQuantityList, location and sends an email on order placement
 *
 * @param {Object} createdOrder
 * @param {Object} productQuantityList
 * @param {Object} location
 */
const sendOrderPlacementEmail = async (createdOrder, productQuantityList, createdOrderItems, location) => {
  const customerInfo = await findCustomer(createdOrder.customerId);

  if (!(customerInfo && Object.keys(customerInfo).length)) {
    return;
  }

  const companyResponse = await findCompany({ id: location.companyId });
  const recipients =
    companyResponse.emails && !_.isEmpty(companyResponse.emails)
      ? JSON.parse(companyResponse.emails)
      : [];
  if (!(_.isEmpty(customerInfo.email))) {
    recipients.push(customerInfo.email);
  }
  const orderItemsForEmail = toOrderItemsForEmail(productQuantityList, createdOrderItems);
  const orderInfoForEmail = toOrderInfoForEmail(createdOrder, location, customerInfo, orderItemsForEmail);
  emailBodyHtml = await renderOrderPlacementEmail(orderInfoForEmail);
  // MailerService.sendEmailThroughAwsSes(recipients, "Order Placed Notification - " + new Date(), emailBodyHtml);
};

/**
 * This function takes the id and return order.
 *
 * @param {Number} id
 * @returns {Object} order
 */
const findOrder = async id => await orderDao.find(id);

/**
 * This function takes the skip, limit and return orders.
 *
 * @param {Number} skip
 * @param {Number} limit
 * @returns {Order[]} orders
 */
const findOrders = async (criteria, skip, limit) => await orderDao.findAll(criteria, skip, limit);

/**
 * This function takes the order and return new order.
 *
 * @param {Object} order
 * @returns {Object} order
 */
const createOrder = async order => await orderDao.create(order);

/**
 * This function takes the criteria and return order count.
 *
 * @param {Object} criteria
 * @returns {Number} total orders
 */
const countOrders = async criteria => await orderDao.count(criteria);

/**
 * This function takes the id, order and return updated order.
 *
 * @param {Number} id
 * @param {Object} order
 * @returns {Object} order
 */
const updateOrder = async (id, order) => await orderDao.update(id, order);

/**
 * This function takes the id and return order with populated tables.
 *
 * @param {Number} id
 * @returns {Object} order
 */
const getOrderAndItsAcceptedBatch = async orderId => {
  let batch = null;
  // eslint-disable-next-line prefer-const
  let [batchOrders, order] = await Promise.all([
    findBatchOrders({ orderId, deletedAt: null }),
    orderDao.findByIdAndPopulateItems(orderId),
  ]);
  // Removing orders from batchOrders of closed batches
  const batchIds = batchOrders.map(batchOrder => batchOrder.batchId);
  const batches = await findBatchesByIds(batchIds);
  // eslint-disable-next-line consistent-return
  batchOrders = batchOrders.filter(batchOrder => {
    const batchFound = batches.find(batchItem => batchItem.id === batchOrder.batchId);
    if (batchFound.statusId !== CLOSED) {
      return batchOrder;
    }
  }).map(f => f);
  if (!_.isEmpty(batchOrders)) {
    batch = await findBatchByCriteria({ id: { in: batchIds }, statusId: { in: [ACCEPTED, COMPLETED] } });
  }
  return { order, batch };
};

/**
 * This function is responsible for validating order status and then call update order status
 * @param {Number} statusId
 * @param {Number} orderId
 * @param {Number} statusReason
 * @param {orderitems[]} orderItems
 * @param {Number} waiver
 * @param {Number} cashReceived
 * @returns {Object} updatedOrder
 */
const updateOrderStatusLogistics = async (
  statusId,
  orderId,
  statusReasonId,
  orderItems,
  cashReceived,
  waiver,
  appVersion,
  userId,
  role,
) => new Promise(async (resolve, reject) => {
  lock(`${sails.config.globalConf.redisEnv} :updateOrderStatusLogistics-${orderId}`, 30000,
    async done => {
      try {
        const currentWaiver = await findOrderAmountAdjusmentByCriteria({
          orderId,
          contextName: WAIVER,
          deleted_at: null,
        });

        validateOrderWaiver(currentWaiver, waiver);

        const { order, batch } = await getOrderAndItsAcceptedBatch(orderId);

        validateOrderStatusLogistic(
          true,
          batch ? batch.statusId : null,
          statusId,
          order.statusId,
        );

        await updateOrderStatus(
          batch,
          order,
          statusId,
          orderItems,
          statusReasonId,
          cashReceived,
          currentWaiver ? currentWaiver.contextId : null,
          userId,
          role,
        );
        done(() => {
          resolve();
        });
      } catch (error) {
        done(() => {
          reject(error);
        });
      }
    },
  );
});

/**
 * This function is responsible for validating order status and then call update order status
 * @param {Number} statusId
 * @param {Number} orderId
 * @param {Number} statusReason
 * @returns {Object} updatedOrder
 */
const updateOrderStatusPortal = async (statusId, orderId, statusReasonId, orderItems, userId, roleId,
  orderType = null) => {
  const { order, batch } = await getOrderAndItsAcceptedBatch(orderId);
  validateOrderStatusPortal(
    batch ? true : false,
    batch ? batch.statusId : null,
    statusId,
    order.statusId,
    order.deliveryBoyId,
    order,
  );
  // Check current status of order
  if (order.statusId === PARTIAL_DELIVERED || order.statusId === DELIVERED) {
    try {
      const invoice = await findLatestInvoice(orderId);
      await createCreditNoteInvoice(invoice.id, invoice);
      // Marking isInvoiceDownloaded false to disable generate invoice button
      await markInvoiceDownloadedForOrder(orderId, false);
      order.isInvoiceDownloaded = false;
    } catch (error) {
      sails.log.info(`OrderService: updateOrderStatusPortal,
            Creating Credit Note Invoice On order status updation. ERR:${error}`);
    }
  }
  await updateOrderStatus(batch, order, statusId, orderItems, statusReasonId, null, null, userId, roleId);
};

/**
 * This function is responsible for validating order status and then call update order status - consumer end
 * @param {Number} statusId
 * @param {Number} orderId
 * @param {Number} statusReason
 * @returns {Object} updatedOrder
 */
const updateOrderStatusConsumer = async (
  statusId,
  orderId,
  statusReasonId,
  orderItems,
  userId,
  role,
  deviceId = null,
) => {
  const { order, batch } = await getOrderAndItsAcceptedBatch(orderId);

  if (role === SUPERVISOR && userId !== order.salesAgentId) {
    sails.log.error(`CANCEL NOT ALLOWED - userId: ${userId} : order sales agent: ${order.salesAgentId}`);
    throw INVALID_USER_ID();
  }
  validateOrderStatusConsumer(
    batch ? true : false,
    batch ? batch.statusId : null,
    statusId,
    order.statusId,
  );
  /* NOTE: why this is added here? ( because this flow wasn't incorporated before reserved -> on-hold -> cancel )
  - order placed and put on hold from reserved tab
  - order has been cancelled by consumer
  - inventory doesn't add back
  - if we do this in 'updateOrderStatus' function then batch closing will add the inventory again
  */
  const producPromises = [];
  if (!batch && order.statusId === ON_HOLD && statusId === CANCELLED) {
    for (const orderItem of orderItems) {
      producPromises.push(updateProductInventory(orderItem.productId, orderItem.quantity, stockIn = true));
    }
    await Promise.all(producPromises);
  }
  await updateOrderStatus(batch, order, statusId, orderItems, statusReasonId, null, null, userId, role, deviceId);
};

/**
 * This function is responsible for updating order status
 * @param {Object} batch
 * @param {Object} order
 * @param statusId
 * @param orderItems
 * @param statusReasonId
 * @param cashReceived
 * @param waiverId
 * @param userId
 * @param roleId
 * @param deviceId
 * @returns {Object} updatedOrder
 */
const updateOrderStatus = async (
  batch,
  order,
  statusId,
  orderItems,
  statusReasonId,
  cashReceived,
  waiverId,
  userId,
  roleId,
  deviceId = null,
) => {
  const logIdentifier = `API version: V1, Context: OrderService.updateOrderStatus(), orderId: ${order.id}, ` +
    `statusId: ${statusId},`;

  const {
    id,
    orderItems: currentOrderItems,
    couponId,
    statusId: currentStatus,
    customerId,
    locationId,
    shipmentId,
    paymentType } = order;

  // "currentOrderItems" -> order items in the DB
  // "orderItems" ->  order items received in the payload

  // if (!_.isEmpty(currentOrderItems) && _.isEmpty(orderItems) && statusId !== CANCELLED) {
  //   throw {
  //     message: "Invalid order items!",
  //   };
  // }

  sails.log(`${logIdentifier} order items in the DB: ${JSON.stringify(currentOrderItems)}`);

  const orderPayload = { statusId, statusReasonId };
  const coupon = await findCouponByUnCheckedId(couponId, id);

  let eligibleProductsGrandTotal = 0;

  eligibleProductsGrandTotal = order.couponProductsTotal || 0;

  let total;
  let grandTotal;
  let couponDiscount;
  let adjustedItems;
  let subTotal;
  let shipmentsLength;
  let volumeBasedDiscount = 0;
  let calculatedDeliveryCharge;
  let tax;
  const adjustedOrderItemsPayloads = [];
  const updateOrderPayloads = [];
  const createOrderHistoryPayloads = [];

  // Fetching currency from BU -> location for order calculations
  const location = camelcaseKeys(await locationExtractionService.findOne({
    id: locationId,
    relations: ["businessUnit"],
  }), { deep: true });

  const currency = location.businessUnit.currency;

  // Util functions for switch statements above
  const rollbackPayments = async (paymentsRollBackNeeded, updateOrderParams) => {
    if ((paymentType === COD || paymentType === COD_WALLET || paymentType === SADAD || paymentType === SADAD_WALLET)
      && paymentsRollBackNeeded) {
      const rollbackPaymentsTransactionResponse = await rollbackPaymentsTransaction({
        retailerId: customerId,
        orderId: id,
        orderPaymentMethod: paymentType,
      });

      sails.log.info(`${logIdentifier} rollbackPaymentsTransactionResponse -> ${rollbackPaymentsTransactionResponse}`);
    }
    if (paymentType === SADAD || paymentType === SADAD_WALLET) {
      orderPayload.paymentType = COD_WALLET;
    }
    if (updateOrderParams) {
      orderPayload.cashReceived = 0;
      orderPayload.deliveredTime = null;
    }
  };

  const updateOrderItemsForPartialDelivery = async () => {
    const orderItemPromises = [];
    for (const currentOrderItem of currentOrderItems) {
      orderItemPromises.push(orderItemsDao.update(currentOrderItem.id, currentOrderItem));
    }
    for (const item of adjustedItems) {
      orderItemPromises.push(
        orderItemsDao.update(item.product.id, {
          discount: item.product.discount,
          adjustedDiscount: item.product.adjustedDiscount,
          adjustedPrice: item.product.adjustedPrice,
          adjustedTax: item.product.adjustedTax,
        }),
      );
    }
    await Promise.all(orderItemPromises);
  };

  const reservedToPackedOrderItemsUpdate = async () => {
    const orderItemPromises = [];
    for (const currentOrderItem of currentOrderItems) {
      const orderItem = orderItems.find(item => item.id === currentOrderItem.id);

      currentOrderItem.packedQuantity = orderItem.quantity;
      currentOrderItem.quantity = orderItem.quantity;

      if (orderItem && orderItem.removed) {
        currentOrderItem.deletedAt = new Date();
        currentOrderItem.quantity = 0;
        currentOrderItem.packedQuantity = 0;
        currentOrderItem.removed = orderItem.removed;
      }
      orderItemPromises.push(orderItemsDao.update(currentOrderItem.id, currentOrderItem));
    }
    await Promise.all(orderItemPromises);
  };

  const partialDeliveredToInTransitOrderItemsUpdate = async () => {
    const orderItemPromises = [];
    for (const currentOrderItem of currentOrderItems) {
      orderItemPromises.push(orderItemsDao.update(currentOrderItem.id, currentOrderItem));
    }
    await Promise.all(orderItemPromises);
  };

  const cancelPayment = async () => {
    if (paymentType === COD || paymentType === COD_WALLET || paymentType === SADAD || paymentType === SADAD_WALLET) {
      const cancelPaymentsTransactionResponse = await cancelPaymentsTransaction({
        orderId: id,
        orderPaymentMethod: paymentType,
      });
      if (cancelPaymentsTransactionResponse !== true) {
        throw PAYMENTS_SERVICE_ERROR();
      }
      if (paymentType === SADAD || paymentType === SADAD_WALLET) {
        orderPayload.paymentType = COD_WALLET;
      }
    }
  };

  const reservedToCancelledProductUpdate = async () => {
    const productPromises = [];
    for (const currentOrderItem of currentOrderItems) {
      productPromises.push(
        updateProductInventory(
          currentOrderItem.productId,
          currentOrderItem.quantity,
          true,
          0,
        ),
      );
    }
    await Promise.all(productPromises);
  };

  const checkCreditBuyLimit = async () => {
    const productItems = currentOrderItems.map(item => ({
      id: item.productId, price: item.price * item.quantity,
    }));
    if (order.paymentType === CREDIT) {
      if (orderIsInCreditBuyLimit(grandTotal, currency)) {
        try {
          const { phone: retailerPhone, cnic: retailerCnic } = await findCustomerById(customerId);
          amountPayable = grandTotal - waiverAmount;
          const {
            data: { data: loanSummary },
          } = await fetchLoanSummary(
            customerId,
            amountPayable,
            retailerPhone,
            retailerCnic,
            id,
            null,
            productItems,
          );
          amountPayable = loanSummary.specs["Total Payable Before Due Date"];
          orderPayload.creditBuyFee = loanSummary.specs["Markup Amount"];
        } catch (err) {
          throw err;
        }
      } else {
        throw new Error({
          code: 2002,
          message: `Order total: ${grandTotal} not in Creditbuy limits`,
        });
      }
    }
  };

  const deliverOrder = async (inTransit = false) => {
    if (order.paymentType === CREDIT && inTransit) {
      orderPayload.cashReceived = 0;
      const loanAmount = grandTotal;
      const OrderDetailsForLMS = createOrderDetailsObjectForLMS(
        id,
        currentOrderItems,
        couponDiscount + volumeBasedDiscount,
        grandTotal,
        waiverAmount,
      );
      await deliverOrderOnCredit(
        customerId,
        id,
        loanAmount,
        statusId,
        orderPayload.creditBuyFee,
        waiverAmount,
        OrderDetailsForLMS,
      );
    } else {
      orderPayload.cashReceived = cashReceived;
    }
    orderPayload.deliveredTime = new Date();
  };

  const completePayment = async () => {
    amountPayable = grandTotal - waiverAmount;
    if (order.paymentType === COD || order.paymentType === COD_WALLET) {
      const completeTransaction = await completePaymentsTransaction({
        retailerId: customerId,
        orderId: id,
        total: {
          amount: amountPayable, // use waiver applied amount for the payments service.
          currency: currency,
        },
        orderPaymentMethod: paymentType,
      });
      const cashToBeCollected = await getPaymentsCashAmount({ orderId: order.id, amountPayable, currency });
      orderPayload.cashReceived = cashToBeCollected.cashAmount;
      orderPayload.paymentType = completeTransaction?.order?.paymentMethod;
    }
  };

  const cancelLoan = async () => {
    if (order.paymentType === CREDIT) {
      const loanAmount = 0;
      const creditBuyFee = 0;
      await deliverOrderOnCredit(customerId, id, loanAmount, statusId, creditBuyFee, waiverAmount);
    }
    orderPayload.cashReceived = 0;
    orderPayload.deliveredTime = null;
    // if (batch) {
    //   sails.log.info(`${logIdentifier} updating Batch Inventory with params: batch_id: ${batch.id},
    //     currentOrderItems: ${currentOrderItems}, stockIn: ${true}, ACCEPTED: ${ACCEPTED}`);
    //   await updateBatchInventory(batch.id, currentOrderItems, stockIn = true, ACCEPTED);
    // }
  };

  const sadatValidation = () => {
    if (paymentType === SADAD || paymentType === SADAD_WALLET) {
      sails.log.error(
        `${logIdentifier} for PD orders: status of type SADAD and SADAD_WALLET cannot be changed to in-transit again`);
      throw INVALID_ORDER_STATUS();
    }
  };

  // BLOCK: this is in place to avoid any calculation discrepencies
  if (statusId === PARTIAL_DELIVERED) {
    for (const currentOrderItem of currentOrderItems) {
      const orderItem = orderItems.find(
        item =>
          item.id === currentOrderItem.id ||
          item.id === currentOrderItem.productId,
      );
      if (orderItem && orderItem.removed) {
        currentOrderItem.deletedAt = new Date();
        currentOrderItem.quantity = 0;
      }
      if (orderItem && orderItem.quantity < currentOrderItem.quantity && !orderItem.removed) {
        currentOrderItem.quantity = orderItem.quantity;
      }
    }
  }

  if (currentStatus === PARTIAL_DELIVERED && statusId === IN_TRANSIT) {
    for (const currentOrderItem of currentOrderItems) {
      currentOrderItem.deletedAt = null;
      currentOrderItem.adjustedPrice = null;
      currentOrderItem.adjustedTax = null;
      currentOrderItem.adjustedDiscount = null;
      currentOrderItem.quantity = currentOrderItem.packedQuantity;
      currentOrderItem.removed = false;
    }
  }

  const productQuantityList = productListToProductQuantityList(currentOrderItems);

  if (shipmentId) {
    let fetchShipmentData = await getShipmentsOrderItems(shipmentId, id);
    let { JITOrderItems } = fetchShipmentData;
    let { aggregateOrder } = fetchShipmentData; // All other shipments(orders) except current shipment(order)
    JITOrderItems = [...JITOrderItems, ...currentOrderItems];
    const JITProductQuantityList = productListToProductQuantityList(JITOrderItems);

    let couponProducts = {
      eligibleList: [],
      ineligibleList: [],
    };

    const prodQuantityList = JITProductQuantityList.filter(prod => prod.quantity > 0);

    if (coupon && Object.keys(coupon).length > 0) {
      couponProducts = await findEligibleProducts(coupon, prodQuantityList);
    }

    const JITOrderCalculation = await getOrderCalculations({
      productQuantityList: prodQuantityList,
      location,
      coupon,
      waiver: 0,
      isBatchFlow: true,
      currency,
      order,
      statusId,
      eligibleProductsOrderedPrice: eligibleProductsGrandTotal,
      couponProducts,
    });

    adjustedItems = JITOrderCalculation.adjustedItems;
    total = JITOrderCalculation.total;
    volumeBasedDiscount = JITOrderCalculation.volumeBasedDiscount;
    calculatedDeliveryCharge = JITOrderCalculation.deliveryCharge;
    tax = JITOrderCalculation.tax;
    shipmentsLength = aggregateOrder.length + 1;// Total shipments i.e. Other Orders Shipments + Current Order Shipment
    fetchShipmentData = await getShipmentsOrderItems(shipmentId, id, false);
    let inTransitJitOrderItems = fetchShipmentData.JITOrderItems;
    inTransitJitOrderItems = [...inTransitJitOrderItems, ...currentOrderItems];
    // Removes the order items of other shipments that are delivered, partial delivered, cancelled etc
    adjustedItems = adjustedItems.filter(adjustedItem =>
      inTransitJitOrderItems.find(product => product.productId === adjustedItem.product.productId));
    // Handling Orders coming back from delivered, partial delivered, cancelled etc to In Transit State
    for (const item of adjustedItems) {
      adjustedOrderItemsPayloads.push({
        id: item.product.id,
        update: {
          discount: item.product.discount,
          adjustedDiscount: item.product.adjustedDiscount,
          adjustedPrice: item.product.adjustedPrice,
          adjustedTax: item.product.adjustedTax,
        },
      });
    }

    const deliveryAndServiceCharges = fetchDeliveryAndServiceCharges(
      location,
      total,
      shipmentsLength,
      tax,
      order,
    );
    calculatedDeliveryCharge = deliveryAndServiceCharges.deliveryChargeValue;

    // Removes the order items of other shipments
    const currentAdjustedItems = adjustedItems.filter(adjustedItem =>
      productQuantityList.find(
        product =>
          product.product.productId === adjustedItem.product.productId,
      ),
    );

    const JITShipment = createJITShipment(
      { location, paymentType, customerId, deliveryAndServiceCharges },
      currency,
      currentAdjustedItems,
      true,
    );

    grandTotal = JITShipment.grandTotal;
    subTotal = JITShipment.subTotal;
    couponDiscount = JITShipment.discount;
    volumeBasedDiscount = JITShipment.volumeBasedDiscount;
    // Adjusting total of other shipments
    aggregateOrder = (await getShipmentsOrderItems(shipmentId, id, false)).aggregateOrder;
    for (const JITOrder of aggregateOrder) {
      const shipmentQuantityList = productListToProductQuantityList(JITOrder.orderItems);
      const currentJITShipment = createJITShipment(
        { location, paymentType, customerId, deliveryAndServiceCharges },
        currency,
        shipmentQuantityList,
        true,
      );

      const aggregateOrderSubTotal = currentJITShipment.subTotal;
      const aggregateOrderGrandTotal = currentJITShipment.grandTotal;
      const aggregateOrderDiscount = currentJITShipment.discount;
      const aggregateOrderTax = currentJITShipment.tax;

      const aggregateOrderPayload = {
        totalPrice: aggregateOrderSubTotal,
        coupon_discount: aggregateOrderDiscount,
        tax: aggregateOrderTax,
        deliveryChargeValue: deliveryAndServiceCharges.deliveryChargeValue,
      };

      const updateOrderPayload = {
        id: JITOrder.id,
        update: aggregateOrderPayload,
      };

      const createOrderHistoryPayload = [
        JITOrder.id,
        JITOrder.statusId,
        aggregateOrderGrandTotal,
        snakecaseKeys(JITOrder),
      ];

      updateOrderPayloads.push(updateOrderPayload);
      createOrderHistoryPayloads.push(createOrderHistoryPayload);
    }
  } else {
    sails.log(`${logIdentifier} non-JIT, getOrderCalculations called with the following params:`,
      `productQuantityList: ${JSON.stringify(productQuantityList)},`,
      `coupon: ${JSON.stringify(coupon)},`,
      `isBatchFlow: true`,
      `currency: ${currency},`,
    );


    let couponProducts = {
      eligibleList: [],
      ineligibleList: [],
    };

    const prodQuantityList = productQuantityList.filter(prod => prod.quantity > 0);

    if (coupon && Object.keys(coupon).length > 0) {
      couponProducts = await findEligibleProducts(coupon, prodQuantityList);
    }

    const orderCalculation =
      await getOrderCalculations({
        productQuantityList: prodQuantityList,
        location,
        coupon,
        waiver: 0,
        isBatchFlow: true,
        currency,
        order,
        statusId,
        eligibleProductsOrderedPrice: eligibleProductsGrandTotal,
        couponProducts,
      });

    sails.log(`${logIdentifier} orderCalculation: ${JSON.stringify(orderCalculation)}`);
    total = orderCalculation.total;
    grandTotal = orderCalculation.grandTotal;
    couponDiscount = orderCalculation.couponDiscount;
    subTotal = orderCalculation.subTotal;
    adjustedItems = orderCalculation.adjustedItems;
    volumeBasedDiscount = orderCalculation.volumeBasedDiscount;
    calculatedDeliveryCharge = orderCalculation.deliveryCharge;
  }

  orderPayload.couponDiscount = couponDiscount;
  orderPayload.volumeBasedDiscount = volumeBasedDiscount;
  orderPayload.deliveryChargeValue = calculatedDeliveryCharge;
  orderPayload.totalPrice = subTotal;

  let amountPayable = grandTotal;
  let waiverAmount = 0;

  if (waiverId) {
    const fetchWaiverResponse = await waiverDao.findbyCriteria({ id: waiverId });
    waiverAmount = fetchWaiverResponse.amount;
  }

  switch (statusId) {
    case DELIVERED: {
      await checkCreditBuyLimit();
      if (currentStatus === IN_TRANSIT) {
        await deliverOrder(true);
        await completePayment();
      } else {
        await deliverOrder();
      }
      break;
    }

    case PARTIAL_DELIVERED: {
      await checkCreditBuyLimit();
      validateOrderItems(orderItems);
      if (currentStatus === IN_TRANSIT) {
        await deliverOrder(true);
        await completePayment();
      } else {
        await deliverOrder();
      }
      break;
    }

    case IN_TRANSIT: {
      await checkCreditBuyLimit();
      switch (currentStatus) {
        case CANCELLED: {
          await rollbackPayments(true, true);
          break;
        }

        case PARTIAL_DELIVERED: {
          sadatValidation();
          await rollbackPayments(true, true);
          break;
        }

        case DELIVERED: {
          await rollbackPayments(true, true);
          break;
        }

        default:
          break;
      }
      break;
    }

    case PACKED: {
      await checkCreditBuyLimit();
      if (currentStatus === RESERVED) {
        validateOrderItems(orderItems);
      }
      break;
    }

    case CANCELLED: {
      if (currentStatus === IN_TRANSIT) {
        orderPayload.cashReceived = 0;
        await cancelLoan();
        await cancelPayment();
      } else if (currentStatus === RESERVED) {
        await cancelLoan();
        await cancelPayment();
      } else if (currentStatus === ON_HOLD) {
        await cancelLoan();
        await cancelPayment();
      }
      break;
    }

    default:
      sails.log(`${logIdentifier} No case registered for statusId: ${statusId}`);
  }

  let updatedOrder = null;

  // Initializing Transaction
  switch (statusId) {
    case PARTIAL_DELIVERED: {
      await updateOrderItemsForPartialDelivery();
      break;
    }

    case IN_TRANSIT: {
      let updatedBatch = {};
      switch (currentStatus) {
        case ON_HOLD: {
          updatedBatch = await updateBatch(batch.id, { statusId: ACCEPTED });
          break;
        }

        case CANCELLED: {
          updatedBatch = await updateBatch(batch.id, { statusId: ACCEPTED });
          break;
        }

        case PARTIAL_DELIVERED: {
          const dbOrderItems = await orderItemsDao.findAll({ orderId: order.id });
          await partialDeliveredToInTransitOrderItemsUpdate();
          sails.log(`putting back in transit from partial delivered - ${JSON.stringify(dbOrderItems)}`);
          updatedBatch = await updateBatchInventory(batch.id, dbOrderItems, true, ACCEPTED);
          break;
        }

        case DELIVERED: {
          const dbOrderItems = await orderItemsDao.findAll({ orderId: order.id });
          sails.log(`putting back in transit from delivered - ${JSON.stringify(dbOrderItems)}`);
          updatedBatch = await updateBatchInventory(batch.id, dbOrderItems, true, ACCEPTED);
          break;
        }

        default:
          break;
      }
      createBatchHistory({
        batchId: batch.id,
        type: BATCH_HISTORY_TYPES.ACCEPTED,
        oldJSON: batch,
        newJSON: updatedBatch,
      });
      break;
    }

    case PACKED: {
      if (currentStatus === RESERVED) {
        await reservedToPackedOrderItemsUpdate();
      }
      break;
    }

    case CANCELLED: {
      if (currentStatus === RESERVED) {
        await reservedToCancelledProductUpdate();
      }
      break;
    }

    default:
      sails.log(`${logIdentifier} No case registered for statusId: ${statusId}`);
  }

  await Promise.all(adjustedOrderItemsPayloads.map(payload => orderItemsDao.update(payload.id, payload.update)));
  const updateOrderPromises = [];
  for (let i = 0; i < updateOrderPayloads.length; i++) {
    const updatePayload = updateOrderPayloads[i];
    const createOrderHistoryPayload = createOrderHistoryPayloads[i];
    const updateOrderPromise = new Promise(async (resolve, reject) => {
      const updatedJitOrder = await orderDao.update(updatePayload.id, updatePayload.update);
      // Converting order in snake-case to achieve backward compatability.
      await createOrderHistory(toOrderHistoryEntity(...createOrderHistoryPayload, updatedJitOrder));
      resolve();
    });
    updateOrderPromises.push(updateOrderPromise);
  }
  await Promise.all(updateOrderPromises);


  sails.log(`${logIdentifier} updating order with the payload -> ${JSON.stringify(orderPayload)}`);
  updatedOrder = await orderDao.update(id, orderPayload);
  await BatchService.updateBatchQueue(order.id, updatedOrder.order_type);


  const notificationType = getNotificationType(statusId);
  createOrderHistory(toOrderHistoryEntity(id, statusId, grandTotal, snakecaseKeys(order), updatedOrder));
  createOrderStatusHistory(toOrderStatusHistoryEntity(
    id,
    statusId,
    userId,
    getKeyFromValue(roleId),
    deviceId,
    batch?.id,
  ));

  if ((statusId === DELIVERED || statusId === PARTIAL_DELIVERED || statusId === CANCELLED) && paymentType !== CREDIT) {
    sendCustomerNotification(customerId, notificationType, snakecaseKeys(order), amountPayable);
  }

  if (currentStatus === ON_HOLD && statusId === CANCELLED && (paymentType === COD || paymentType === COD_WALLET)) {
    const cancelPaymentsTransactionResponse = await cancelPaymentsTransaction({
      orderId: id,
      orderPaymentMethod: paymentType,
    });

    sails.log.info(`${logIdentifier} cancelPaymentsTransactionResponse -> ${cancelPaymentsTransactionResponse}`);
  }

  const orderInfoUpdate = orderInfoToPublish({ ...updatedOrder, waiverAmount });

  // Adding a list of orderItems to the message for publishing
  // Required by taxation-service to calculate tax breakup
  if (sails.config.globalConf.IS_TAXATION_ENABLED &&
    (statusId === DELIVERED || statusId === PARTIAL_DELIVERED)) {
    orderInfoUpdate.locationId = locationId;
    orderInfoUpdate.orderItems = adjustedItems.map(orderItem =>
      _.pick(orderItem.product, [
        "id",
        "productId",
        "mrp",
        "price",
        "tax",
        "volumeBasedDiscount",
        "discount",
        "adjustedDiscount",
        "quantity",
      ]),
    );
  }

  await publishMessage(keys.topic_arn, JSON.stringify(orderInfoUpdate));
  return updatedOrder;
};

const productListToProductQuantityList = productList => productList.map(item => ({
  product: item,
  quantity: item.quantity,
  orderedQuantity: item.originalQuantity,
  unitPrice: item.price,
}));


/**
 * This function takes the id and return Order Amount Adjustment.
 *
 * @param {Object} [criteria]
 * @returns {Object} OrderAmountAdjustment
 */
const findOrderAmountAdjusmentByCriteria = async criteria => orderAmountAdjustmentDao.findbyCriteria(criteria);


/**
 *
 * @param {*} id id from token
 * @param {*} role user role
 * @param {*} searchId order to be searched by id
 * @param {*} page
 * @param {*} perPage
 * @param {*} customerId for getting customer orders on sales agent login
 * @returns orders
 */
const getOrders = async (id, role, searchId, page, perPage, customerId = null) => {
  let orders = [];
  if (role === CONSUMER || (role === SUPERVISOR && customerId)) {
    const customer = customerId ? customerId : id; // customer here means the id of the customer
    orders = await getOrdersByCustomerId(customer, searchId, page, perPage);
  } else {
    orders = await getOrdersByAgentId(id, searchId, page, perPage);
  }

  return orders;
};
/**
 * This function takes the id and return agent orders.
 *
 * @param {Number} id
 * @param {Number} searchId
 * @returns {Array[]} Orders
 */
const getOrdersByAgentId = async (id, searchId, page = 1, perPage = 20) => {
  /**
    * building criteria to fetch orders against salesAgentId and status > SALE ORDER
    * last 48 hours criteria will be used too
    */
  const current = new Date();
  const thirtyDaysBeforeToday = new Date(current.setTime(current.getTime() - THIRTY_DAYS_BACK));
  const criteria = { salesAgentId: id, statusId: { ">": SALE_ORDER }, placedAt: { ">": thirtyDaysBeforeToday } };
  if (searchId) {
    criteria.or = [
      { id: searchId },
      { customer_id: searchId }, // TODO: need to figure out a way to dynamically build this or criteria
    ];
  }
  const { skip, limit } = getPagination(+page, +perPage);
  return orderDao.findbyCriteriaAndPopulateStatuses(criteria, skip, limit);
};

/**
* This function takes the id and return customer orders.
*
* @param {Number} id
* @param {Number} searchId
* @returns {Array[]} Orders
*/
const getOrdersByCustomerId = async (id, searchId, page = 1, perPage = 20) => {
  /**
    * building criteria to fetch orders against salesAgentId and status > SALE ORDER
    */
  const criteria = { customerId: id, statusId: { ">": SALE_ORDER } };
  if (searchId) {
    criteria.or = [
      { id: searchId },
    ];
  }
  const { skip, limit } = getPagination(+page, +perPage);
  return orderDao.findbyCriteriaAndPopulateStatuses(criteria, skip, limit);
};

/**
* This function takes the id and return order.
*
* @param {Number} id
* @returns {Object} Order
*/
const getOrderById = async id => {
  const findCriteria = { id };
  const order = await orderDao.findbyCriteriaAndPopulateFeedback(findCriteria);

  [order.customerInfo, order.waiverAmount] = await Promise.all([
    findCustomerById(order.customerId),
    findWaiverAmount(id),
  ]);

  order.customerShopInfo = await findShopByCustomerId(order.customerInfo?.id);
  order.feedback = camelcaseKeys(order.feedback.find(x => x)); // Converting array of object to single object
  order.showFeedbackForm = [
    PARTIAL_DELIVERED,
    DELIVERED,
    CANCELLED,
  ].includes(order.statusId) && !order.feedback;

  // calculating service and delivery charges on order
  order.serviceCharges =
    getServiceCharge(
      order.serviceChargeType,
      order.serviceChargeValue,
      order.totalPrice,
    ) +
    getDeliveryCharge(
      order.deliveryChargeType,
      order.deliveryChargeValue,
      order.totalPrice,
    );

  // fetch order items with populated product details
  const orderItems = await orderItemsDao.findByOrderIdAndPopulateProduct(order.id);

  for (const item of orderItems) {
    item.productId = populatePriceAndTaxByCategory(item.productId, item.quantity);
  }

  // fetch order history
  let orderHistory = await orderHistoryDao.findAll(order.id);
  /**
     * removing adjacent duplicates only, approved by @muiz
     */
  orderHistory = orderHistory.filter((history, index) =>
    index ? orderHistory[index - 1].statusId !== history.statusId : history,
  );
  /**
     * convert object to the minimal information required by FE through data transfer object
     */
  const grantTotal = calculateGrandTotalOnOrder(order);
  order.grandTotal = getGrandTotalWithWavierDiscount(grantTotal, order.waiverAmount);
  order.tax = getTaxFromOrderItems(
    orderItems
      .filter(
        ({ productId }) =>
          !productId.taxInclusive && productId.taxCategory === TAX_ON_PRICE,
      )
      .map(details => ({ product: details, quantity: details.quantity })),
  );

  // Find current batch of the order
  const batchStatusId = await findLatestBatchStatusByOrderId(order.id);
  const orderDto = toOrderDto(order, orderItems, orderHistory, batchStatusId);

  return orderDto;
};


// const fixOrderTotal = async orderId => {
//   const logIdentifier = `API version: ${v1}, Context: OrderService.fixOrderTotal(),`;
//   sails.log(`${logIdentifier} Entry`);
//   const { order } = await getOrderAndItsAcceptedBatch(orderId);
//   const { id, orderItems: currentOrderItems, couponId, deliveryChargeType, deliveryChargeValue,
//     serviceChargeType, serviceChargeValue, locationId } = order;
//   const orderItemTotal = getOrderItemTotal(currentOrderItems);
//   const coupon = await findCouponByUnCheckedId(couponId);
//   const serviceCharge = getServiceCharge(serviceChargeType, serviceChargeValue, orderItemTotal);
//   const deliveryCharge = getDeliveryCharge(deliveryChargeType, deliveryChargeValue, orderItemTotal);
//   const productQuantityList = currentOrderItems.map(item => ({
//     product: item,
//     quantity: item.quantity,
//   }));
//   // needed currency for calculation logic to work properly
//   const location = await findLocation(locationId);
//   const { currency } = await BusinessUnit.findOne({ id: location.businessUnitId });
//   const { total, grandTotal, couponDiscount, subTotal } =
//     await getOrderCalculations({
//       productQuantityList,
//       location: {
//         deliveryChargeType,
//         deliveryChargeValue,
//         serviceChargeType,
//         serviceChargeValue,
//       },
//       coupon,
//       waiver: 0,
//       isBatchFlow: true,
//       currency,
//     });
//   const orderPayload = {};
//   orderPayload.couponDiscount = couponDiscount;
//   sails.log.info("total", total, "serviceCharge",
//     serviceCharge, "deliveryCharge", deliveryCharge, "couponDiscount", couponDiscount);
//   sails.log.info(`Service: updateOrderStatus, Grand total is`, grandTotal);

//   orderPayload.totalPrice = subTotal;

//   sails.log.info(`Service: updateOrderStatus, Updating an Order:`, JSON.stringify(orderPayload), "orderId", id);
//   const updatedOrder = await orderDao.update(id, orderPayload);
//   return updatedOrder;
// };

/**
 * Function is responsible for building data for KYC service
 * @param {Number} customerId
 * @param {Object} data
 * @returns {Object} customer order related data
 */

const getOrderStats = async customerId => {
  const data = {
    monthlyPurchases: 0,
    lastThreeMonthsAvgBasket: 0,
    uniqueSkusBought: 0,
    weeklyPurchasingFrequency: 0,
  };
  const threeMonthsBack = new Date();
  threeMonthsBack.setMonth(threeMonthsBack.getMonth() - 3);
  const monthWiseOrdersQuery = `select count(o.id) as totalOrders, sum(o.total_price) as totalOrderValue,
  MONTHNAME(o.placed_at) as month
    from orders o where  customer_id = $1 group by month`;
  const lastThreeMonthsQuery = `select count(ot.id) as totalItems, o.id as orderId
  from orders o join order_items ot on o.id = ot.order_id
    where o.customer_id = $1 and o.placed_at > ${getSqlDateObject(
    threeMonthsBack,
  )} group by o.id`;
  const uniqueSkuQuery = `select distinct(ot.product_id) as uniqueSkus
  from orders o join order_items ot on o.id = ot.order_id
    where o.customer_id = $1`;
  const weekWiseOrdersQuery = `select count(o.id) as totalOrders, sum(o.total_price) as totalOrderValue,
  week(o.placed_at) as week_number
    from orders o where  customer_id = $1 group by week_number`;
  const promises = [
    await sails.sendNativeQuery(monthWiseOrdersQuery, [customerId]),
    await sails.sendNativeQuery(lastThreeMonthsQuery, [customerId]),
    await sails.sendNativeQuery(uniqueSkuQuery, [customerId]),
    await sails.sendNativeQuery(weekWiseOrdersQuery, [customerId]),
  ];
  const result = await Promise.all(promises);
  data.monthlyPurchases =
    result[0].rows.reduce((a, b) => a + b.totalOrderValue, 0) /
    result[0].rows.length;
  data.lastMonthPurchases = result[0]?.rows[0]?.totalOrderValue || 0;
  data.lastMonthOrders = result[0]?.rows[0]?.totalOrders || 0;
  data.lastThreeMonthsAvgBasket = parseInt(
    result[1].rows.reduce((a, b) => a + b.totalItems, 0) / result[1].rows.length,
  );
  data.uniqueSkusBought = result[2].rows.length;
  data.weeklyPurchasingFrequency =
    result[3].rows.reduce((a, b) => a + b.totalOrderValue, 0) /
    result[3].rows.length;
  return data;
};

/**
 * This function is responsible for updating order payment type
 * @param {Number} orderId
 * @param {Number} orderAmount
 * @param {String} paymentType
 * @returns {Object} updatedOrder
 */
const updateOrderPaymentType = async (
  orderId,
  orderAmount,
  paymentType,
  loanProductId,
) => {
  // Step-1: fetch order details from database by order Id.
  const order = await orderDao.findByIdAndPopulateItems(orderId);

  const { id, paymentType: currentPaymentType, customerId, locationId, orderItems } = order;
  let { creditBuyFee } = order;

  // if payment type in payload and in db is same, no flow will be executed
  if (currentPaymentType === paymentType) {
    return "Payment Type is already updated";
  } else if (currentPaymentType === COD_WALLET) {
    throw {
      message: "Order placed on COD_WALLET cannot be switched to any other payment type",
    };
  }

  // Step-2: Validate if order is eligible for payment on credit and get the creditBuyFee
  const location = camelcaseKeys(await locationExtractionService.findOne({
    id: locationId,
    relations: ["businessUnit"],
  }), { deep: true });
  const currency = location.businessUnit.currency;
  const { phone: retailerPhone, cnic: retailerCnic } = await findCustomerById(customerId);
  if (paymentType === CREDIT) {
    creditBuyFee = await validateCreditOrderAndGetCreditFee(
      customerId,
      orderAmount,
      retailerPhone,
      retailerCnic,
      currency,
      loanProductId,
      orderItems.map(item => ({
        id: item.productId,
        price: item.price * item.quantity,
      })),
    );
  }
  if (paymentType === COD) {
    creditBuyFee = 0;
  }

  // Step-3: update status of deployments and transactions according to payment type
  await updateOrderPaymentMethod(
    id,
    customerId,
    orderAmount,
    retailerCnic,
    retailerPhone,
    paymentType,
    loanProductId,
    orderItems.map(item => ({
      id: item.productId,
      price: item.price * item.quantity,
    })),
  );

  // Step-4: update order
  const orderPayload = {};
  orderPayload.paymentType = paymentType;
  orderPayload.creditBuyFee = creditBuyFee;

  const updatedOrder = await orderDao.update(id, orderPayload);
  sendCustomerNotification(customerId, ORDER_PAYMENT_TYPE_UPDATED, snakecaseKeys(order), orderAmount);

  return updatedOrder;
};

/**
 * This function takes orderId and return current payment type.
 * @param {Number} id
 * @returns {String} paymentType
 */
const findPaymentTypeByOrderId = async id => {
  const order = await findOrder(id);
  if (_.isEmpty(order)) {
    throw ORDER_NOT_FOUND();
  }
  return order.paymentType;
};

const createOrderDetailsObjectForLMS = (orderId, orderItems, discount, grandTotal, waiverAmount) => {
  const orderItemsLMS = orderItems.map(orderItem => ({
    name: orderItem.name,
    quantity: orderItem.quantity,
    unitPrice: orderItem.price,
    totalPrice: (orderItem.price * orderItem.quantity),
  }));
  const OrderDetailsForLMS = {
    orderId,
    orderItems: orderItemsLMS,
    discount: discount,
    waiver: waiverAmount,
    totalPrincipleAmount: grandTotal - waiverAmount,
  };
  return OrderDetailsForLMS;
};

const getGrowthMetrics = async (
  customerIdRaw, startTime, endTime,
  selectedMetricsRaw = "gmv,dgmv,ogmv, oDGMV,totalCount,totalOrganicOrders,spo,spr",
  deliveryBatches,
) => {
  const customerIds = customerIdRaw.split(",").map(id => parseInt(id, 10));
  const selectedMetrics = selectedMetricsRaw.split(",").map(metric => metric.toLowerCase());
  const keyMetrics = await orderDao.getGrowthMetrics(customerIds, startTime, endTime, selectedMetrics);
  if (selectedMetrics.includes("totaldeliveryorders") && deliveryBatches) {
    const deliveryBatchIds = deliveryBatches.split(",");
    const batchOrders = await findBatchOrders({ batchId: { in: deliveryBatchIds } });
    keyMetrics[0].totaldeliveryorders = batchOrders?.length;
  }
  return keyMetrics;
};
const getCategoriesDgmvByCustomerIds = async (customerIdRaw, categoryIdRaw, startTime, endTime,
) => {
  const customerIds = customerIdRaw.split(",").map(id => parseInt(id, 10));
  const categoryIds = categoryIdRaw.split(",").map(id => parseInt(id, 10));
  const DGMV = await orderDao.getCategoriesDgmvByCustomerId(customerIds, categoryIds, startTime, endTime);
  return DGMV;
};

const resetPriceForVolumeBasedProducts = orderproductQuantityList =>
  orderproductQuantityList.map(productQuantityList => {
    const { product } = productQuantityList;
    if (product.isVolumeBasedPriceEnabled && !product.dynamicPriceHistoryId) {
      const {
        volumeBasedPriceInfo: {
          taxExclusiveBasePrice,
          taxOnBasePrice,
          taxExclusiveVolumeBasedPrice,
          taxOnVolumeBasedPrice,
          volumeBasedDiscount: volumeBasedProductDiscount,
        },
      } = product;

      productQuantityList.product.price = taxExclusiveBasePrice;
      productQuantityList.product.tax = taxOnBasePrice;
      productQuantityList.product.volumeBasedPrice =
        taxExclusiveVolumeBasedPrice;
      productQuantityList.product.volumeBasedPriceTax = taxOnVolumeBasedPrice;
      productQuantityList.product.volumeBasedDiscount =
        volumeBasedProductDiscount;
    }

    return productQuantityList;
  });

const findOrderByIdAndPopulateItems = async orderId => (await orderDao.findByIdAndPopulateItems(orderId));

const validateSpotProducts = async (orderedProducts, batchId) => {
  // Validating Batch id for Spot sale order
  await findBatchByCriteria({ where: { id: batchId, status_id: { in: [ACCEPTED, COMPLETED] } } });
  const spotProducts = await getSpotProductsByBatch(batchId);
  if (_.isEmpty(spotProducts)) {
    throw SPOT_PRODUCT_NOT_FOUND();
  }
  orderedProducts.map(product => {
    const selectedSpotProduct = spotProducts.find(spotProduct => spotProduct.id === product.id);
    if(!selectedSpotProduct) {
      throw SPOT_PRODUCT_NOT_FOUND();
    }
    if (selectedSpotProduct && product.quantity > selectedSpotProduct.spot_current_quantity) {
      throw PRODUCT_STOCK_LOWER(selectedSpotProduct.name);
    }
  });
};

/**
 * This function takes the id and return products in order.
 *
 * @param {Number} id
 * @returns {Object[]} order items
 */
const getOrderItems = async id => {
  const orderItems = await orderItemsDao.findByOrderIdAndPopulateProduct(id);
  const orderData = orderItems.map(order => ({
    product: {
      name: order.productId.name,
      id: order.productId.id,
    },
    orderedQuantity: order.originalQuantity,
    deliveredQuantity: order.quantity,
  }));
  return orderData;
};

module.exports = {
  updateOrder,
  countOrders,
  createOrder,
  findOrders,
  placeOrder,
  findOrder,
  updateOrderStatusLogistics,
  updateOrderStatusPortal,
  findOrderAmountAdjusmentByCriteria,
  getOrdersByAgentId,
  getOrdersByCustomerId,
  getOrderById,
  getOrders,
  // fixOrderTotal,
  getOrderStats,
  updateOrderPaymentType,
  findPaymentTypeByOrderId,
  getLatestOrderByCustomerId,
  updateOrderStatusConsumer,
  getGrowthMetrics,
  getCategoriesDgmvByCustomerIds,
  findOrderByIdAndPopulateItems,
  validateSpotProducts,
  getOrderItems,
};
