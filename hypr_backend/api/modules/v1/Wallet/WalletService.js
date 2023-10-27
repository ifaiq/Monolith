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

// ThirdPart Imports
const axios = require("axios");

// Constants Imports
const { URLS: { ELIGIBILITY_AND_BALANCE } } = require("./WalletConstants");

// Auth imports
const { getS2sAuthToken } = require("../Utils/s2sAuthHelper");

// Global initializations
const logIdentifier = `API version: V1, Context: WALLET_SERVICE`;

/**
 * Function takes retailerId and calls wallet service eligibility and balance route
 * @param { Number } retailerId
 */
const getRetailerEligibilityAndBalance = async retailerId => {
  try {
    sails.log(
      `${logIdentifier}.getRetailerEligibilityAndBalance(), Entry, called with params -> retailerId: ${retailerId}`,
    );
    const token = await getS2sAuthToken();
    const {
      data: { data: result },
    } = await axios.get(ELIGIBILITY_AND_BALANCE, {
      headers: { Authorization: token },
      params: { retailerId },
    });
    sails.log(
      `${logIdentifier}.getRetailerEligibilityAndBalance(), Retailer eligibility call response -> ${JSON.stringify(
        result,
      )}`,
    );
    return result;
  } catch (err) {
    sails.log.error(
      `${logIdentifier}.getRetailerEligibilityAndBalance() Error in fetching retialer eligibilty -> ${JSON.stringify(
        err || err.stack,
      )}`,
    );
    throw err;
  }
};


module.exports = {
  getRetailerEligibilityAndBalance,
};
