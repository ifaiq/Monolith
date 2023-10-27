const {
  errors: {
    PRODUCT_DISABLED,
    PRODUCT_OUT_OF_STOCK,
    PRODUCT_STOCK_LOWER,
    INVALID_PRODUCT_LOCATION,
  },
} = require("./Errors");
const { getLocalizedName } = require("./Utils");

/**
 * Function validates products it takes the productQuantityList, locationId and return the
 * @param {productQuantityList[]} productQuantityList
 * @param {Number} locationId
 * @param dontThrowError: boolean, stops function throwing an error when there's a validation failure
 * @returns validationResponses
 */

const validateProducts = (
  productQuantityList,
  locationId,
  dontThrowError = false,
) => {
  // todo discuss why we are throwing an error for validation failure
  sails.log.info("context:validateProducts", "Start validating Products");
  const validationResponses = [];
  const {
    disabledProducts,
    emptyStockProducts,
    lowStockProducts,
    invalidLocationProducts,
  } = productValidation(productQuantityList, locationId);
  if (!_.isEmpty(disabledProducts)) {
    sails.log.info(
      "context:disabledProducts[]",
      "Disabled Products",
      disabledProducts,
    );
    validationResponses.push({
      ...PRODUCT_DISABLED(
        getLocalizedName(
          disabledProducts[0].name,
          disabledProducts[0].multilingual,
        ),
      ), // sending zero'th back, discussed with hashaam
      products: disabledProducts,
    });
  }
  if (!_.isEmpty(emptyStockProducts)) {
    sails.log.info(
      "context:emptyStockProducts[]",
      "Empty Stock Products",
      emptyStockProducts,
    );
    // PRODUCT_OUT_OF_STOCK.message = constructOutOfStockMessage(emptyStockProducts);
    validationResponses.push({
      ...PRODUCT_OUT_OF_STOCK(
        getLocalizedName(
          emptyStockProducts[0].name,
          emptyStockProducts[0].multilingual,
        ),
      ),
      products: emptyStockProducts,
    });
  }
  if (!_.isEmpty(lowStockProducts)) {
    sails.log.info(
      "context:lowStockProducts[]",
      "Low Stock Products",
      lowStockProducts,
    );
    validationResponses.push({
      ...PRODUCT_STOCK_LOWER(
        getLocalizedName(
          lowStockProducts[0].name,
          lowStockProducts[0].multilingual,
        ),
      ),
      products: lowStockProducts,
    });
  }
  if (!_.isEmpty(invalidLocationProducts)) {
    sails.log.info(
      "context:invalidLocationProducts[]",
      "Invalid locations Products",
      invalidLocationProducts,
    );

    validationResponses.push({
      ...INVALID_PRODUCT_LOCATION(
        getLocalizedName(
          invalidLocationProducts[0].name,
          invalidLocationProducts[0].multilingual,
        ),
      ),
      products: invalidLocationProducts,
    });
  }
  if (!_.isEmpty(validationResponses) && !dontThrowError) {
    // todo discuss why we're throwing an error here
    throw validationResponses;
  }
  return validationResponses;
};
/**
 * Function validates orderItems
 * @param {Object} orderItems
 * @returns {Array} orderItemsValidations
 */
const productValidation = (productQuantityList, locationId) => {
  const logIdentifier = `ProductValidator.productValidation(), locationId: ${locationId}`;
  const disabledProducts = [];
  const emptyStockProducts = [];
  const lowStockProducts = [];
  const invalidLocationProducts = [];
  for (const productQuantity of productQuantityList) {
    const { product, product: { id, stockQuantity, name, multilingual }, quantity } = productQuantity;

    if (isProductDisabled(product)) {
      sails.log.info(`${logIdentifier} Disabled product, ProductId: ${product.id}`);
      disabledProducts.push({ id, name, stockQuantity, multilingual });
    }

    if (isProductStockEmpty(product)) {
      sails.log.info(`${logIdentifier} Empty stock product, ProductId: ${product.id}`);
      emptyStockProducts.push({ id, name, stockQuantity, multilingual });
    }

    if (isProductStockLow(stockQuantity, quantity)) {
      sails.log.info(`${logIdentifier} Low stock product, ProductId: ${product.id},`,
        `stockQuantity: ${stockQuantity}, quantity: ${quantity}`);

      lowStockProducts.push({ id, name, stockQuantity, multilingual });
    }

    if (isProductLocationValid(product.locationId, locationId)) {
      sails.log.info(`${logIdentifier} Invalid product location, ProductId: ${product.id},`,
        `Product Location: ${product.locationId}`);

      invalidLocationProducts.push({ id, name, locationId: product.locationId, multilingual });
    }
  }
  return { disabledProducts, emptyStockProducts, lowStockProducts, invalidLocationProducts };
};

const validateProductStock = (product, quantity) => {
  if (isProductStockEmpty(product)) {
    throw PRODUCT_OUT_OF_STOCK(product.name);
  }
  if (isProductStockLow(product.stockQuantity, quantity)) {
    throw PRODUCT_STOCK_LOWER(product.name);
  }
};

/**
 * Function returns if the product is disabled
 * @param {Object} product
 * @returns {Boolean} result of validation
 */
const isProductDisabled = product => product.disabled;


/**
 * Function returns if product stock is zero
 * @param {Object} product
 * @returns {Boolean} if product stock is zero
 */
const isProductStockEmpty = product => product.stockQuantity === 0;


/**
 * Function retruns if product stock is below ordered quantity
 * @param {Object} orderItem
 * @param {Object} product
 * @returns {Boolean} if product stock is below ordered quantity
 */
const isProductStockLow = (productStockQuantity, quantity) => productStockQuantity < quantity;


/**
 * Function if productLocation is the same as orderLocation
 * @param {Number} productLocation
 * @param {Number} orderLocation
 * @returns {Boolean} if productLocation is the same as orderLocation
 */
const isProductLocationValid = (productLocationId, locationId) => productLocationId !== locationId;

/**
 * Function takes the products and check duplication
 * @param {Products[]} products
 * @returns {Boolean} isDuplicate
 */
const isDuplicateProducts = products => {
  const productsArr = products.map(product => product.id);
  const isDuplicate = productsArr.some((item, idx) => productsArr.indexOf(item) !== idx);
  return isDuplicate;
};

// const constructOutOfStockMessage = outOfStockProducts => {
//   let outOfStockNames = "";
//   // eslint-disable-next-line guard-for-in
//   for (const index in outOfStockProducts) {
//     outOfStockNames += ` ${outOfStockProducts[index].name}`;
//     if (index !== outOfStockProducts.length - 1) {
//       outOfStockNames += ",";
//     }
//   }
//   return `Product [${outOfStockNames} ] ` + PRODUCT_OUT_OF_STOCK.message;
// };

const removedOutofStockProducts = products => {
  const updatedProducts = products.filter(product => (product.stockQuantity > 0) && products);

  return updatedProducts;
};

/**
 * Function checks if volumeBasedProductPrices is a valid non-empty array
 */
const validateVolumeBasedProducts = volumeBasedProductPrices => {
  const invalidFields = [];
  if (
    !volumeBasedProductPrices ||
    !Array.isArray(volumeBasedProductPrices) ||
    !volumeBasedProductPrices.length
  ) {
    throw Error(
      "ProductValidator.validateVolumeBasedProducts(): volumeBasedProductPrices must be a valid non-empty array",
    );
  }

  let isValid = true;
  for (const pItem of volumeBasedProductPrices) {
    for (const item of ["quantityFrom", "price"]) {
      if (pItem[item] < 1) {
        isValid = false;
        invalidFields.push(`${item} must be greater than 1`);
      }
    }
  }

  if (!isValid) {
    throw { code: "E_UNIQUE", message: invalidFields };
  }
};

module.exports = {
  validateProducts,
  validateProductStock,
  isDuplicateProducts,
  removedOutofStockProducts,
  validateVolumeBasedProducts,
};
