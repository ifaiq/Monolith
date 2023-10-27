/**
 Copyright © 2022 Retailo, Inc.
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

// Third Party Imports
const axios = require("../../../clients/AxiosClient");

// Constants Imports
const {
  URLS: { INVOICE_API, INVOICE_NUMBER_API },
} = require("./Constants");

// Auth imports
const { getS2sAuthToken } = require("../Utils/s2sAuthHelper");

// Global initializations
const logIdentifier = `API version: V1, Context: INVOICE_SERVICE`;

/**
 * Function for creating an invoice using the Invoicing Service
 * @param { Object } invoiceDto
 */
const getOrCreateInvoice = async invoiceDto => {
  try {
    sails.log(
      `${logIdentifier}.getOrCreateInvoice(), called with data: ${JSON.stringify(
        invoiceDto,
      )}`,
    );
    const token = await getS2sAuthToken();
    const result = await axios.post({
      url: `${INVOICE_API}`,
      data: invoiceDto,
      headers: { Authorization: token },
    });
    sails.log(
      `${logIdentifier}.getOrCreateInvoice() -> ${JSON.stringify(
        result,
      )}`,
    );
    return result;
  } catch (err) {
    sails.log.error(
      `${logIdentifier}.getOrCreateInvoice(), Error in creating invoice -> ${JSON.stringify(
        err || err.stack,
      )}`,
    );
    throw err;
  }
};

/**
 * Function for generate an Invoice serial number using the Invoicing Service
 * @param { Object } invoiceDto
 */
const generateInvoiceSerialNumber = async invoiceDto => {
  try {
    sails.log(
      `${logIdentifier}.generateInvoiceSerialNumber(), called with data: ${JSON.stringify(
        invoiceDto,
      )}`,
    );
    const token = await getS2sAuthToken();
    const result = await axios.post({
      url: `${INVOICE_NUMBER_API}`,
      data: invoiceDto,
      headers: { Authorization: token },
    });
    sails.log(
      `${logIdentifier}.generateInvoiceSerialNumber() -> ${JSON.stringify(
        result,
      )}`,
    );
    return result?.data?.invoiceNumber;
  } catch (err) {
    sails.log.error(
      `${logIdentifier}.generateInvoiceSerialNumber(), Error in generating serial number -> ${JSON.stringify(
        err || err.stack,
      )}`,
    );
    throw err;
  }
};

module.exports = {
  getOrCreateInvoice,
  generateInvoiceSerialNumber,
};
