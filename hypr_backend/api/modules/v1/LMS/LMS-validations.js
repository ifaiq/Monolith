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


const { CURRENCY_TYPES: { PKR, SAR, AED } } = require("../../../services/Constants");
const { CREDIT_BUY_LIMITS:
  {
    MUAWIN_CREDIT_BUY_MIN_LIMIT,
    MUAWIN_CREDIT_BUY_MAX_LIMIT,
    RETAILO_CREDIT_BUY_MIN_LIMIT,
    RETAILO_CREDIT_BUY_MAX_LIMIT,
  } } = require("./LMS-constants");

const orderIsInCreditBuyLimit = (orderAmount, currency) => {
  try {
    sails.log(`orderIsInCreditBuyLimit() called with params: orderAmount: ${orderAmount}, currency: ${currency}`);
    if (currency === PKR) {
      if (orderAmount >= MUAWIN_CREDIT_BUY_MIN_LIMIT && orderAmount <= MUAWIN_CREDIT_BUY_MAX_LIMIT) {
        return true;
      }
      return false;
    } else if (currency === SAR) {
      if (orderAmount >= RETAILO_CREDIT_BUY_MIN_LIMIT && orderAmount <= RETAILO_CREDIT_BUY_MAX_LIMIT) {
        return true;
      }
      return false;
    } else if (currency === AED) {
      if (orderAmount >= RETAILO_CREDIT_BUY_MIN_LIMIT && orderAmount <= RETAILO_CREDIT_BUY_MAX_LIMIT) {
        return true;
      }
      return false;
    }
    sails.log.error(`orderIsInCreditBuyLimit(), supplied currency did not match any validation possibilities`);
    throw {
      data: {
        creditLimitValidation: {
          code: 2012,
          message: `credit limit validations failed because the currency could not be resolved`,
        },
      },
    };
  } catch (error) {
    sails.log.error(`orderIsInCreditBuyLimit(), Error ${JSON.stringify(error)}`);
    throw error;
  }
};

module.exports = {
  orderIsInCreditBuyLimit,
};
