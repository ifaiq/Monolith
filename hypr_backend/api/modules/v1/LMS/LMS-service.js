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
const { URLS: { FETCH_LOAN_SUMMARY, CREATE_LOAN_APPLICATION, DELIVER_ORDER_ON_CREDIT,
  UPDATE_ORDER_PAYMENT_TYPE, FETCH_DELIVERY_CODE } } = require("./LMS-constants");

// Auth imports
const { getS2sAuthToken } = require("../Utils/s2sAuthHelper");
const { removeDashesFromCnic } = require("../../../../utils/services");

// Global initializations
const logIdentifier = `API version: V1, Context: LMS_SERVICE`;

/**
 * Function fetches summary changes for getting a loan.
 * @param retailerId
 * @param amount
 * @param cellno
 * @param cnic
 * @param orderId
 * @param loanProductId
 * @param productItems
 */
const fetchLoanSummary = async (retailerId, amount, cellno, cnic = null, orderId = null, loanProductId = null,
  productItems = []) => {
  try {
    sails.log(
      `${logIdentifier}.fetchLoanSummary. retailerId: ${retailerId}, 
      orderAmount: ${amount}, cellno: ${cellno}, cnic: ${cnic}, orderId: ${orderId}, 
      loanProductId: ${loanProductId}, productItems: ${JSON.stringify(productItems)}`,
    );
    const cnicWithoutDashes = cnic ? removeDashesFromCnic(cnic) : null;
    const token = await getS2sAuthToken();
    const result = await axios.post(FETCH_LOAN_SUMMARY, {
      cellno,
      cnic: cnicWithoutDashes,
      retailerId,
      requestedAmount: amount,
      orderId,
      loanProductId,
      productItems,
    },
    {
      headers: {
        Authorization: token,
      },
    });
    sails.log(`${logIdentifier}.fetchLoanSummary() fetch loan summary response -> ${JSON.stringify(result.data.data)}`);
    return result;
  } catch (error) {
    sails.log.error(`${logIdentifier}.fetchLoanSummary() Error fetching loan summary ${JSON.stringify(error)}`);
    throw error; // TODO see how to handle his error on arithmos side
  }
};

/**
 * Function creates loan appliation for a particular order when order is being placed.
 * @param retailerId
 * @param cnic
 * @param cellNo
 * @param amount
 * @param orderId
 * @param loanProductId
 * @param productItems
 */
const createLoanApplication = async (orderId, retailerId, amount, cnic, cellNo, loanProductId, productItems) => {
  try {
    sails.log(`${logIdentifier}.createLoanApplication. Entry, retailerPhone: ${cellNo}, 
    orderAmount: ${amount}, retailerCnic: ${cnic}, orderId: ${orderId}, retailerId: ${retailerId}, 
    loanProductId: ${loanProductId},productItems: ${productItems}`);
    const cnicWithoutDashes = cnic ? removeDashesFromCnic(cnic) : null;
    const token = await getS2sAuthToken();
    const result = await axios.post(
      CREATE_LOAN_APPLICATION,
      {
        orderId,
        retailerId,
        requestedAmount: amount,
        cnic: cnicWithoutDashes,
        cellno: cellNo,
        loanProductId,
        productItems,
      },
      {
        headers: {
          Authorization: token,
        },
      },
    );
    sails.log(`${logIdentifier}.createLoanApplication() create loan application response -> ${result}`);
    return result;
  } catch (error) {
    sails.log.error(`${logIdentifier} Error creating loan application ${error.response}`);
    throw error; // TODO see how to handle his error on arithmos side
  }
};

const getDeliveryCodeByOrderId = async orderId => {
  try {
    sails.log(`${logIdentifier}.getDeliveryCodeByOrderId. Entry, orderId: ${orderId}`);
    const url = `fetchByOrder?orderId=${orderId}`;
    const token = await getS2sAuthToken();
    const result = await axios.get(
      FETCH_DELIVERY_CODE + url,
      {
        headers: {
          Authorization: token,
        },
      },
    );
    sails.log(`${logIdentifier}.getDeliveryCodeByOrderId() get Delivery Code By OrderId response -> ${result}`);
    return result;
  } catch (error) {
    sails.log.error(`${logIdentifier} Error getting Delivery Code ${error.response}`);
    throw error;
  }
};

/**
 * Function to call the deliverOrderOnCredit route to disburse the loan
 * @param {Number} retailerId
 * @param {Number} orderId
 * @param {Number} finalAmount
 * @param {Number} orderStatus
 * @returns
 */
const deliverOrderOnCredit = async (
  retailerId,
  orderId,
  finalAmount,
  orderStatus,
  creditBuyFee,
  waiverAmount = 0,
  muawinOrderDetails,
) => {
  try {
    sails.log(`${logIdentifier}.deliverOrderOnCredit. retailerId: ${retailerId}, 
    finalAmount: ${finalAmount}, orderId: ${orderId}, orderStatus: ${orderStatus},
     muawinOrderDetails: ${JSON.stringify(muawinOrderDetails)}`);
    const token = await getS2sAuthToken();
    const result = await axios.post(DELIVER_ORDER_ON_CREDIT, {
      retailerId,
      finalAmount,
      orderId,
      orderStatus,
      creditBuyFee,
      waiverAmount,
      muawinOrderDetails,
    },
    {
      headers: {
        Authorization: token,
      },
    });
    sails.log(`${logIdentifier}.deliverOrderOnCredit() deliver order on credit response -> 
    ${JSON.stringify(result.data.data)}`);
    return result;
  } catch (error) {
    sails.log.error(`${logIdentifier}.deliverOrderOnCredit() Error in deliver order on credit -> 
    ${JSON.stringify(error.response.data)}`);
    throw error.response.data;
  }
};
/**
 * Function update deployment and transaction statuses for a particular order when order payment type is being changed.
 * @param retailerId
 * @param amount
 * @param orderId
 */
const updateOrderPaymentMethod = async (orderId, retailerId, amount, cnic, cellNo, paymentType,
  loanProductId = null, productItems = []) => {
  try {
    sails.log(`${logIdentifier}.updateOrderPaymentMethod. Entry, retailerPhone: ${cellNo}, 
    orderAmount: ${amount}, retailerCnic: ${cnic}, orderId: ${orderId}, retailerId: ${retailerId},
    paymentType: ${paymentType}, loanProductId: ${loanProductId}, productItems:${productItems}`);
    const cnicWithoutDashes = cnic ? removeDashesFromCnic(cnic) : null;
    const token = await getS2sAuthToken();
    const result = await axios.post(
      UPDATE_ORDER_PAYMENT_TYPE,
      {
        cnic: cnicWithoutDashes,
        cellno: cellNo,
        requestedAmount: amount,
        orderId,
        retailerId,
        paymentType,
        loanProductId,
        productItems,
      },
      {
        headers: {
          Authorization: token,
        },
      },
    );
    sails.log(`${logIdentifier}.updateOrCancelLoanApplication() update order payment type response -> ${result}`);
    return result;
  } catch (error) {
    sails.log.error(`${logIdentifier} Error updating payment type on lms ${JSON.stringify(error)}`);
    throw error; // TODO see how to handle his error on arithmos side
  }
};

module.exports = {
  createLoanApplication,
  fetchLoanSummary,
  deliverOrderOnCredit,
  updateOrderPaymentMethod,
  getDeliveryCodeByOrderId,
};
