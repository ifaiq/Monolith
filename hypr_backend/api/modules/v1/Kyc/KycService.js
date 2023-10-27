const { monthDiff } = require("../../../../utils/services");
const { couponService: { getDiscountsOfferedToCustomer } } = require("../Coupon");
const { orderService: { getOrderStats } } = require("../Order");
const { errors: { USER_NOT_FOUND } } = require("../Auth");
const {
  KYCs: {
    SHOP_ADDRESS,
    DISCOUNTS_OFFERED,
    MONTHLY_PURCHASES,
    SHOP_NAME,
    UNIQUE_SKU_BOUGHT,
    FULL_NAME,
    MONTHS_ACTIVE,
    LOCATION_PIN,
    WEEKLY_PURCHASES,
    AVERAGE_BASKET_3_MONTHS,
  },
} = require("./Constants");
const customerExtractionService = require("../../../user_service_extraction/customerService");


const constructKycResponseForCustomerProfile = (
  payload,
  customer,
  discounts,
  orderData,
) => {
  payload.kycs[0].answers.map(kyc => {
    switch (kyc.questionid) {
      case SHOP_ADDRESS:
        kyc.answer = customer.addresses[0].address;
        break;
      case DISCOUNTS_OFFERED:
        kyc.answer = discounts;
        break;
      case MONTHLY_PURCHASES:
        kyc.answer = orderData.monthlyPurchases;
        break;
      case SHOP_NAME:
        kyc.answer = customer.shopDetails[0].shop_name;
        break;
      case UNIQUE_SKU_BOUGHT:
        kyc.answer = orderData.uniqueSkusBought;
        break;
      case FULL_NAME:
        kyc.answer = customer.name;
        break;
      case MONTHS_ACTIVE:
        kyc.answer = monthDiff(new Date(customer.created_at), new Date());
        break;
      case LOCATION_PIN: {
        const latlng = JSON.parse(customer.shopDetails[0].shop_location);
        kyc.answer = `${latlng.longitude},${latlng.latitude}`;
        break;
      }
      case WEEKLY_PURCHASES:
        kyc.answer = orderData.weeklyPurchasingFrequency;
        break;
      case AVERAGE_BASKET_3_MONTHS:
        kyc.answer = orderData.lastThreeMonthsAvgBasket;
        break;
      // No Default
    }
  });

  return payload;
};

const constructResponseForCustomerProfile = (
  customer,
  discounts,
  orderData,
) => {
  const latlng = JSON.parse(customer.shopDetails[0].shop_location);
  return {
    shopData: {
      address: customer.addresses[0].address,
      name: customer.shopDetails[0].shop_name,
    },
    discounts,
    orderData: {
      monthlyPurchases: orderData.monthlyPurchases,
      uniqueSkusBought: orderData.uniqueSkusBought,
      weeklyPurchasingFrequency: orderData.weeklyPurchasingFrequency,
      lastThreeMonthsAvgBasket: orderData.lastThreeMonthsAvgBasket,
      lastMonthPurchases: orderData.lastMonthPurchases,
      lastMonthOrders: orderData.lastMonthOrders,
    },
    fullName: customer.name,
    monthsActive: monthDiff(new Date(customer.created_at), new Date()),
    location: `${latlng.longitude},${latlng.latitude}`,
  };
};


/**
 * This function takes the customerId and return all required data.
 *
 * @param {Number} customerId
 * @param {Object} data
 * @returns {Object} data
 */
const constructCustomerKycProfile = async (customerId, payload) => {
  const customer = await customerExtractionService.findOne({
    id: customerId,
    relations: ["addresses", "shopDetails"],
  });
  if(customer?.shop_details) {
    customer.shopDetails = customer.shop_details;
  }
  // await Customer.findOne({ id: customerId }).populate("addresses").populate("shopDetails");
  if (customer) {
    const promises = [await getDiscountsOfferedToCustomer(customerId), await getOrderStats(customerId)];
    const [discountsOffered, orderData] = await Promise.all(promises);
    return constructKycResponseForCustomerProfile(payload, customer, discountsOffered, orderData);
  }
  return USER_NOT_FOUND();
};

/**
 * This function takes the customerId and return all required data for profile population.
 *
 * @param {Number} customerId
 * @param {Object} data
 * @returns {Object} data
 */
const constructCustomerProfile = async customerId => {
  const customer = await customerExtractionService.findOne({
    id: customerId,
    relations: ["addresses", "shopDetails"],
  });
  if(customer?.shop_details) {
    customer.shopDetails = customer.shop_details;
  }
  // await Customer.findOne({ id: customerId }).populate("addresses").populate("shopDetails");
  if (customer) {
    const promises = [await getDiscountsOfferedToCustomer(customerId), await getOrderStats(customerId)];
    const [discountsOffered, orderData] = await Promise.all(promises);
    return constructResponseForCustomerProfile(customer, discountsOffered, orderData);
  }
  return USER_NOT_FOUND();
};

/**
 * This function takes the customer object and returns KYC object
 * @returns {Object} data
 * @param customer
 * @param payload
 */
const getCustomerKycProfile = async (customer, payload = null) => {
  try {
    const promises = [await getDiscountsOfferedToCustomer(customer.id), await getOrderStats(customer.id)];
    const [discountsOffered, orderData] = await Promise.all(promises);
    if (payload) {
      return constructKycResponseForCustomerProfile(payload, customer, discountsOffered, orderData);
    }
    return constructResponseForCustomerProfile(customer, discountsOffered, orderData);
  } catch (e) {
    throw e;
  }
};

module.exports = {
  constructCustomerKycProfile,
  constructCustomerProfile,
  getCustomerKycProfile,
};
