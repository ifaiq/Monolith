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

// Please set this in your container env
const lmsBaseUrl = process.env.LMS_BASE_URL;

module.exports = {
  URLS: {
    FETCH_LOAN_SUMMARY: `${lmsBaseUrl}/lms/serviceFeeCalculations`,
    CREATE_LOAN_APPLICATION: `${lmsBaseUrl}/lms/createLoanApplication`,
    DELIVER_ORDER_ON_CREDIT: `${lmsBaseUrl}/lms/deliverOrderOnCredit`,
    UPDATE_ORDER_PAYMENT_TYPE: `${lmsBaseUrl}/lms/updateOrderPaymentType`,
    FETCH_DELIVERY_CODE: `${lmsBaseUrl}/deliveryVerification/`,
  },
  CREDIT_BUY_LIMITS: {
    MUAWIN_CREDIT_BUY_MIN_LIMIT: parseInt(process.env.MUAWIN_CREDIT_BUY_MIN_LIMIT, 10) || 1200,
    MUAWIN_CREDIT_BUY_MAX_LIMIT: parseInt(process.env.MUAWIN_CREDIT_BUY_MAX_LIMIT, 10) || 10000,
    RETAILO_CREDIT_BUY_MIN_LIMIT: parseInt(process.env.RETAILO_CREDIT_BUY_MIN_LIMIT, 10) || 400,
    RETAILO_CREDIT_BUY_MAX_LIMIT: parseInt(process.env.RETAILO_CREDIT_BUY_MAX_LIMIT, 10) || 50000,
  },
};
