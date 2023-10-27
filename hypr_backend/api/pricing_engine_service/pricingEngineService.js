/* eslint-disable no-param-reassign */
const { post } = require("../clients/AxiosClient");
const { createServiceToken } = require("@development-team20/auth-library/dist");
const { URLS: {
  PRICING_ENGINE_BASE_URL,
  API_PATH,
  CALCULATE_PRODUCT_PRICE,
  CALCULATE_MOV,
} } = require("./constants");

/**
 * This functions maintains the same order of products that it recieves
 * @param {locationId}
 * @param {zoneId}
 * @param {shopTypeId}
 * @param {products}
 * @returns
 */
const getUpdatedProductList = async ({
  locationId,
  zoneId,
  shopTypeId,
  products,
}) => {
  if (locationId
        && zoneId
        // && shopTypeId
        && process.env.DYNAMIC_PRICING_FEATURE_FLAG
        && parseInt(process.env.DYNAMIC_PRICING_FEATURE_FLAG)) {
    const productListWithDynamicPricingEnabled = products
      .filter(product => product.isDynamicPriceEnabled);
    const productListWithDynamicPricingDisabled = products
      .filter(product => !product.isDynamicPriceEnabled);

    const productListOrder = products.map(product => product.id);

    const params = {
      locationId: parseInt(locationId),
      zoneIds: zoneId.split(","),
      shopTypeId: parseInt(shopTypeId),
      productList: productListWithDynamicPricingEnabled,
    };

    try {
      const response = await post({
        url: `${PRICING_ENGINE_BASE_URL}/${API_PATH}/${CALCULATE_PRODUCT_PRICE}`,
        data: params,
        headers: {
          Authorization: await createServiceToken(),
        },
      });
      const productList = response.data;
      if (productList && productList.length) {
        products = [...productListWithDynamicPricingDisabled, ...productList];
      } else {
        products = [...productListWithDynamicPricingDisabled];
      }
      const orderedProductList = [];
      productListOrder.forEach(productId => {
        const item = products.find(product => product.id === productId);
        orderedProductList.push({ ...item, price: parseFloat(item.price) });
      });
      return orderedProductList;
    } catch (error) {
      throw error;
    }
  }
  return products;
};

const getMOVRules = async ({
  locationId,
  zones,
  shopTypeId,
  productIds,
}) => {
  if(locationId
        && zones
        && process.env.MOV_FEATURE_FLAG
        && parseInt(process.env.MOV_FEATURE_FLAG)) {
    const params = {
      locationId: parseInt(locationId),
      zoneIds: zones.split(","),
      shopTypeId: parseInt(shopTypeId),
      productIds,
    };

    try{
      const response = await post({
        url: `${PRICING_ENGINE_BASE_URL}/${API_PATH}/${CALCULATE_MOV}`,
        data: params,
        headers: {
          Authorization: await createServiceToken(),
        },
      });
      return response.data;
    }catch(error) {
      throw error;
    }
  }
  return null;
};


module.exports = {
  getUpdatedProductList,
  getMOVRules,
};
