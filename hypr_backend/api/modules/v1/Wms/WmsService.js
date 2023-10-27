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

// ThirdPart Imports
const axios = require("../../../clients/AxiosClient");

// Constants Imports
const { URLS: { VALIDATE_AVS_STOCK, FETCH_AVS_STOCK } } = require("./Constants");
// Auth imports
const { getS2sAuthToken } = require("../Utils/s2sAuthHelper");

// Global initializations
const logIdentifier = `API version: V1, Context: WMS_SERVICE`;

/**
 * Function validates if there is a avs location for that warehouse
 * @param { Object } batch
 */
const validateAvsStock = async batch => {
  try {
    const { warehouseId, products } = batch;
    const payload = {
      warehouseId,
      products: products.map(product =>
        ({ productId: product.id, onBoardedQuantity: product.onboarded_quantity }),
      ),
    };
    sails.log(
      `${logIdentifier}.validateAvsStock(), called with data: ${JSON.stringify(batch)}`,
    );
    const token = await getS2sAuthToken();
    const result = await axios.post({
      url: `${VALIDATE_AVS_STOCK}`,
      data: payload,
      headers: { Authorization: token },
    });
    sails.log(
      `${logIdentifier}.validateAvsStock(), check avs location call response -> ${JSON.stringify(
        result,
      )}`,
    );
    return result;
  } catch (err) {
    sails.log.error(
      `${logIdentifier}.validateAvsStock() Error in verifying avs stock -> ${JSON.stringify(
        err || err.stack,
      )}`,
    );
    throw err;
  }
};

const fetchAvsStock = async batch => {
  try {
    const { location_id, products } = batch;
    const payload = {
      warehouseId: location_id,
      products: products.map(product => product.id),
    };
    sails.log(
      `${logIdentifier}.fetchAvsStock(), called with data: ${JSON.stringify(batch)}`,
    );
    const token = await getS2sAuthToken();
    const result = await axios.post({
      url: `${FETCH_AVS_STOCK}`,
      data: payload,
      headers: { Authorization: token },
    });
    sails.log(
      `${logIdentifier}.fetchAvsStock(), check avs location call response -> ${JSON.stringify(
        result,
      )}`,
    );
    return result;
  } catch (err) {
    sails.log.error(
      `${logIdentifier}.fetchAvsStock() Error in verifying avs stock -> ${JSON.stringify(
        err || err.stack,
      )}`,
    );
    throw err;
  }
};
module.exports = {
  validateAvsStock, fetchAvsStock,
};
