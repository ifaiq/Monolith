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

const camelcaseKeys = require("camelcase-keys");
const { createServiceToken } = require("@development-team20/auth-library/dist");
const { get, post, put } = require("../../../clients/AxiosClient");
const { URLS: {
  COUPON_SERVICE_BASE_URL,
  SERVICE,
  PRODUCTS,
  VALIDATE,
} } = require("./constants");
const { errors: { COUPON_SERVICE_ERROR } } = require("./Errors");

const DEFAULT_SELECTED_ATTRIBUTES = [
  "id",
  "name",
  "startDate",
  "endDate",
  "discountValue",
  "locationId",
  "disabled",
  "minCouponLimit",
  "maxDiscountValue",
  "maxUsagePerCustomer",
  "productsListType",
  "userType",
  "discountType",
  "couponCustomerOption",
];

const makeParamsForCouponService = params => {
  Object.keys(params).forEach(key => {
    if (typeof params[key] === typeof []) {
      params[key] = params[key].join(",");
    }
  });
  return params;
};

const getAll = async params => {
  try {
    const response = await get({
      url: `${COUPON_SERVICE_BASE_URL}/${SERVICE}`,
      params: { select: DEFAULT_SELECTED_ATTRIBUTES.join(","), ...makeParamsForCouponService(params) },
      headers: {
        Authorization: await createServiceToken(),
      },
    });
    return response.data.coupons ?? response.data;
  } catch (error) {
    throw error;
  }
};

const getOne = async couponId => {
  const logIdentifier = `CouponDao.getOne() couponId: ${couponId},`;
  try {
    if (!(couponId > 0)) {
      sails.log(`${logIdentifier} exited -> invalid couponId`);
      return undefined;
    }

    const URL = `${COUPON_SERVICE_BASE_URL}/${SERVICE}/${couponId}`;
    const PARAMS = { select: [...DEFAULT_SELECTED_ATTRIBUTES].join(",") };

    sails.log(`${logIdentifier} sending call to coupon service with`,
      `URL: ${URL}, PARAMS: ${JSON.stringify(PARAMS)}`);

    const response = await get({
      url: URL,
      params: PARAMS,
      headers: {
        Authorization: await createServiceToken(),
      },
    });

    sails.log(`${logIdentifier} response -> ${JSON.stringify(response.data)}`);
    return response.data;
  } catch (error) {
    sails.log.error(`${logIdentifier} catch block -> ${JSON.stringify(error.response?.data || error.stack || error)}`);
    throw COUPON_SERVICE_ERROR();
  }
};

const create = async coupon => {
  try {
    const response = await post({
      url: `${COUPON_SERVICE_BASE_URL}/${SERVICE}`,
      data: camelcaseKeys(coupon),
      headers: {
        Authorization: await createServiceToken(),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

const validateCoupon = async (
  coupon, couponProducts, locationId, customerId, role, language = "EN", clientTimeOffset = 0) => {
  const logIdentifier = `CouponDao.validateCoupon() couponId: ${coupon.id}, customerId: ${customerId},`;
  try {
    const response = await post({
      url: `${COUPON_SERVICE_BASE_URL}/${SERVICE}/${VALIDATE}`,
      data: {
        coupon,
        couponProducts,
        locationId,
        customerId,
        role,
        clientTimeOffset,
      },
      headers: {
        Authorization: await createServiceToken(),
        Language: language,
      },
    });
    return response;
  } catch (error) {
    if (error.response?.data) {
      return { ...error.response.data, data: { message: error.response.data.message } };
    }
    sails.log.error(`${logIdentifier} catch block -> ${JSON.stringify(error.response?.data || error.stack || error)}`);
    throw error;
  }
};

const validateCouponProducts = async (coupon, products) => {
  const logIdentifier = `CouponDao.validateCouponProducts() couponId: ${coupon.id},`;
  try {
    const response = await put({
      url: `${COUPON_SERVICE_BASE_URL}/${SERVICE}/${PRODUCTS}/${VALIDATE}`,
      data: {
        coupon,
        products,
      },
      headers: {
        Authorization: await createServiceToken(),
      },
    });
    return response.data;
  } catch (error) {
    sails.log.error(`${logIdentifier} catch block -> ${JSON.stringify(error.response?.data || error.stack || error)}`);
    throw error;
  }
};

/**
 * Function finds all coupons by criteria
 * @param {Number} skip
 * @param {Number} limit
 * @returns {coupon[]}
 */
const find = async criteria => await getAll(camelcaseKeys(criteria));


/**
 * Function finds Coupons by customer Id
 * @param {Number} id
 * @returns {Object} coupon[]
 */
const findByCustomerId = async customerId => await getAll({
  customerId,
  disabled: false,
});

/**
 * Function finds Coupon by  Id
 * @param {Number} id
 * @returns {Object} coupon
 */
const findById = async id => {
  const coupon = await getOne(id);
  return coupon;
};

/**
 * Function finds Coupon by  name
 * @param {Number} name
 * @returns {Object} coupon
 */
const findByName = async name => {
  const coupons = await getAll({ name });
  return coupons;
};
module.exports = {
  find,
  create,
  findByCustomerId,
  findById,
  findByName,
  validateCoupon,
  validateCouponProducts,
};
