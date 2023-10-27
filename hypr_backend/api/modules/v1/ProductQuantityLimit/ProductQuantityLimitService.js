const moment = require("moment");
const orderDao = require("../Order/OrderDao");
const { findByOrderIdAndPopulateProduct } = require("../Order/OrderItemsDao");
const {
  constants: {
    request: {
      VERSIONING: { v1 },
    },
  },
} = require("../../../constants/http");
const { calculateProductsStock } = require("../Arithmos/Helpers");

const fetchOrderCriteria = (customerId, clientTimeOffset) => {
  const start = moment()
    .utc()
    .startOf("day")
    .subtract(clientTimeOffset, "minutes")
    .format("YYYY-MM-DD H:mm:ss");
  const end = moment()
    .utc()
    .endOf("day")
    .subtract(clientTimeOffset, "minutes")
    .format("YYYY-MM-DD H:mm:ss");
  return {
    customer_id: customerId,
    start,
    end,
  };
};

/**
 * This function gets customerId, Product List and ClientTimeOffset and calculate the stock quantity of product
 *  based on product's per day order quantity limit
 * @param {Number} customerId
 * @param {Array} productsData
 * @param {Number} clientTimeOffset
 * @returns {Array} products
 */

const getUpdatedProductStock = async (
  customerId,
  productsData = [],
  clientTimeOffset,
) => {
  const logIdentifier = `API version: ${v1}, Context: ProductQuantityLimitService.getUpdatedProductStock(),`;
  if (_.isEmpty(productsData)) {
    return productsData;
  }
  const orderDetailFetchCriteria = fetchOrderCriteria(
    customerId,
    clientTimeOffset,
  );
  const last24HourOrderIds = await orderDao.findLast24HrOrderIds({
    ...orderDetailFetchCriteria,
  });
  if (_.isEmpty(last24HourOrderIds)) {
    return productsData.map(product => ({
      ...product,
      ...(typeof product.quantityLimit === "number" && product.quantityLimit > 0 && {
        stockQuantity:
          product.quantityLimit > product.stockQuantity
            ? product.stockQuantity
            : product.quantityLimit,
      }),
    }));
  }
  sails.log(
    `${logIdentifier} order ids placed in current day ---> ${JSON.stringify(
      last24HourOrderIds,
    )}`,
  );

  const last24HourOrderIdsList = last24HourOrderIds.map(item => item.id);
  // Fetching order details
  const last24HourOrdersDetails = await findByOrderIdAndPopulateProduct(last24HourOrderIdsList);

  sails.log(
    `${logIdentifier} product details of order ---> ${JSON.stringify(
      last24HourOrdersDetails,
    )}`,
  );

  const productOrderData = {};
  const productMaxLimit = {};


  last24HourOrdersDetails.forEach(productData => {
    productOrderData[productData.productId.id]
      ? (productOrderData[productData.productId.id] += productData.quantity)
      : (productOrderData[productData.productId.id] = productData.quantity);
    productMaxLimit[productData.productId.id] =
      productData.productId.quantityLimit;
  });

  sails.log(
    `${logIdentifier} max quantity available for a product ---> ${JSON.stringify(
      productMaxLimit,
    )}`,
  );
  sails.log(
    `${logIdentifier} ordered quantity for a product ---> ${JSON.stringify(
      productOrderData,
    )}`,
  );

  const updatedProductsStock = calculateProductsStock(productsData, productMaxLimit, productOrderData);
  return updatedProductsStock;
};

// Might be removed in the future
const validateProductQuantityOrderPlacement = async (
  customerId,
  productList = [],
  ordersProducts = [],
) => {
  const productOrderData = {};
  ordersProducts.forEach(data => {
    productOrderData[data?.id] = data?.quantity;
  });
  const products = await getUpdatedProductStock(customerId, productList);

  return products.map(product => ({
    ...product,
    stockQuantity:
      parseInt(product?.stockQuantity) -
        parseInt(productOrderData[product.id] || 0) >=
      0
        ? product?.stockQuantity
        : product?.quantityLimit ?? 0,
  }));
};

module.exports = {
  getUpdatedProductStock,
  validateProductQuantityOrderPlacement,
};
