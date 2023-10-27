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
const { get, post } = require("../../../clients/AxiosClient");
const { URLS: {
  COUPON_SERVICE_BASE_URL,
  SERVICE,
  USAGE,
} } = require("./constants");


const getAll = async (couponId, params) => {
  try {
    const response = await get({
      url: `${COUPON_SERVICE_BASE_URL}/${SERVICE}/${couponId}/${USAGE}`,
      params: params,
      headers: {
        Authorization: await createServiceToken(),
      },
    });
    return response.data.totalCount ?? response.data.length;
  } catch (error) {
    throw error;
  }
};

const create = async (couponId, params) => {
  try {
    const response = await post({
      url: `${COUPON_SERVICE_BASE_URL}/${SERVICE}/${couponId}/${USAGE}`,
      data: camelcaseKeys(params),
      headers: {
        Authorization: await createServiceToken(),
      },
    });
    return response[response.keyName];
  } catch (error) {
    throw error.response?.data || error;
  }
};


/**
 * This function takes couponId and customerId and returns coupon history by customer count.
 * @param {Number} couponId
 * @param {Number} customerId
 * @returns {Number} count of coupons usage by customer
 */
const countByCustomer = async (couponId, customerId) => {
  try {
    return (await getAll(couponId, { customerId }));
  } catch (error) {
    return 0;
  }
};

module.exports = {
  create,
  countByCustomer,
};
