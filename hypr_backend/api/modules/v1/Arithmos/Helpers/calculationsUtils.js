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
const Big = require("big.js");

/**
 * Function rounds off floating points numbers to the nearest decimal place.
 * @param number
 * @param decimalPlaces
 * @return number
 */
const roundAccurately = (number, decimalPlaces) =>
  Number(Math.round(number + "e" + decimalPlaces) + "e-" + decimalPlaces);

/**
 * Function keeps numbers to two decimal places without rounding off.
 * @param number
 * @return number
 */
const keepTwoDecimalPlacesWithoutRounding = num => parseFloat(num.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0]);

const eliminateOffByOne = number => {
  const round = Math.round(number);
  if (Math.abs(round - number).toFixed(2) <= 0.01) {
    return round;
  }
  return number;
};

/**
 * Function converts number to base currency by multiplying the value with the baseCurrencyMultiplier provided
 * @param productList
 * @param baseCurrencyMultiplier
 */
const convertProductListIntoBaseCurrency = (productList, baseCurrencyMultiplier) => productList.map(productObj => {
  const {
    product: {
      actualUnitPrice,
      volumeBasedPriceInfo: { volumeBasedPrice: volumeBasedUnitPrice } = {},
      volumeBasedPrice,
      volumeBasedPriceTax,
    },
  } = productObj;

  if (productObj.product.adjustedPrice) {
    productObj.product.adjustedPrice = parseFloat(
      Big(productObj.product.adjustedPrice).times(Big(baseCurrencyMultiplier)),
    );
  }
  if (productObj.product.adjustedTax) {
    productObj.product.adjustedTax = parseFloat(
      Big(productObj.product.adjustedTax).times(Big(baseCurrencyMultiplier)),
    );
  }
  if (productObj.product.adjustedDiscount) {
    productObj.product.adjustedDiscount = parseFloat(
      Big(productObj.product.adjustedDiscount).times(
        Big(baseCurrencyMultiplier),
      ),
    );
  }

  productObj.product.price = parseFloat(
    Big(productObj.product.price).times(Big(baseCurrencyMultiplier)),
  );

  productObj.product.tax = productObj.product.tax ? parseFloat(
    Big(productObj.product.tax).times(Big(baseCurrencyMultiplier)),
  ) : productObj.product.tax;

  productObj.product.mrp = productObj.product.mrp ? parseFloat(
    Big(productObj.product.mrp).times(Big(baseCurrencyMultiplier)),
  ) : productObj.product.mrp;


  if (actualUnitPrice) {
    productObj.product.actualUnitPrice = parseFloat(
      Big(actualUnitPrice).times(Big(baseCurrencyMultiplier)),
    );
  }

  if (volumeBasedUnitPrice) {
    productObj.product.volumeBasedPriceInfo.volumeBasedPrice = parseFloat(
      Big(volumeBasedUnitPrice).times(Big(baseCurrencyMultiplier)),
    );
  }

  if (volumeBasedPrice) {
    productObj.product.volumeBasedPrice = parseFloat(
      Big(volumeBasedPrice).times(Big(baseCurrencyMultiplier)),
    );
  }

  if (volumeBasedPriceTax) {
    productObj.product.volumeBasedPriceTax = parseFloat(
      Big(productObj.product.volumeBasedPriceTax).times(
        Big(baseCurrencyMultiplier),
      ),
    );
  }

  return productObj;
});

/**
 * Function converts number to base currency by multiplying the value with the baseCurrencyMultiplier provided
 * @param productList
 * @param baseCurrencyMultiplier
 */
const convertProductListFromBaseCurrency = (productList, baseCurrencyMultiplier) => productList.map(productObj => {
  const {
    product: {
      actualUnitPrice,
      volumeBasedPriceInfo: { volumeBasedPrice: volumeBasedUnitPrice } = {},
      volumeBasedPrice,
      volumeBasedPriceTax,
    },
  } = productObj;

  if (productObj.product.adjustedPrice) {
    productObj.product.adjustedPrice = parseFloat(
      Big(productObj.product.adjustedPrice).div(Big(baseCurrencyMultiplier)),
    );
  }
  if (productObj.product.adjustedTax) {
    productObj.product.adjustedTax = parseFloat(Big(productObj.product.adjustedTax).div(Big(baseCurrencyMultiplier)));
  }
  if (productObj.product.adjustedDiscount) {
    productObj.product.adjustedDiscount = parseFloat(
      Big(productObj.product.adjustedDiscount).div(
        Big(baseCurrencyMultiplier),
      ),
    );
  }
  if (productObj.product.discount) {
    productObj.product.discount = parseFloat(Big(productObj.product.discount).div(Big(baseCurrencyMultiplier)));
  }
  productObj.product.price = parseFloat(Big(productObj.product.price).div(Big(baseCurrencyMultiplier)));
  // eslint-disable-next-line max-len
  productObj.product.tax = productObj.product.tax ? parseFloat(Big(productObj.product.tax).div(Big(baseCurrencyMultiplier))) : productObj.product.tax;
  // eslint-disable-next-line max-len
  productObj.product.mrp = productObj.product.mrp ? parseFloat(Big(productObj.product.mrp).div(Big(baseCurrencyMultiplier))) : productObj.product.mrp;

  if (actualUnitPrice) {
    productObj.product.actualUnitPrice = parseFloat(
      Big(actualUnitPrice).div(Big(baseCurrencyMultiplier)),
    );
  }

  if (volumeBasedUnitPrice) {
    productObj.product.volumeBasedPriceInfo.volumeBasedPrice = parseFloat(
      Big(volumeBasedUnitPrice).div(Big(baseCurrencyMultiplier)),
    );
  }

  if (volumeBasedPrice) {
    productObj.product.volumeBasedPrice = parseFloat(
      Big(volumeBasedPrice).div(Big(baseCurrencyMultiplier)),
    );
  }

  if (volumeBasedPriceTax) {
    productObj.product.volumeBasedPriceTax = parseFloat(
      Big(productObj.product.volumeBasedPriceTax).div(
        Big(baseCurrencyMultiplier),
      ),
    );
  }

  return productObj;
});

/**
 * Function converts number into base currency by multiplying the number with the multiplier provided.
 * @param productList
 * @param baseCurrencyMultiplier
 */
const convertIntoBaseCurrency = (number, baseCurrencyMultiplier) =>
  parseFloat(Big(number).times(Big(baseCurrencyMultiplier)));

/**
 * Function converts number from base currency by dividing the number with the divider provided.
 * @param productList
 * @param baseCurrencyDivider
 */
const convertFromBaseCurrency = (number, baseCurrencyDivider) => parseFloat(Big(number).div(Big(baseCurrencyDivider)));

module.exports = {
  roundAccurately,
  keepTwoDecimalPlacesWithoutRounding,
  eliminateOffByOne,
  convertIntoBaseCurrency,
  convertFromBaseCurrency,
  convertProductListFromBaseCurrency,
  convertProductListIntoBaseCurrency,
};
