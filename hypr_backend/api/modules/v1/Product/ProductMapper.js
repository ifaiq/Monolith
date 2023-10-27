const { arithmos: { getDiscountAccordingToTradePrice } } = require("../Arithmos");
const { getDeliveryDate } = require("../JIT/JITUtils");
const { formatDescription } = require("./Utils");
/**
 * Mapper to extract essential attributes from the database object
 *
 * @param {Object} product
 * @returns {Object} response product
 */
const toGetProductsResponse = product => ({
  id: product.id,
  name: product.name,
  sku: product.sku,
  imageUrl: product.imageUrl,
  description: formatDescription(product.description),
  price: product.price,
  mrp: product.mrp,
  stockQuantity: product.stockQuantity,
  size: product.size,
  unit: product.unit,
  brand: product.brand,
  productPriority: product.productPriority,
  tradePrice:
    product.tradePrice && product.tradePrice > product.price
      ? product.tradePrice
      : "",
  discount:
    product.tradePrice && product.tradePrice > product.price
      ? getDiscountAccordingToTradePrice(product.tradePrice, product.price)
      : "",
  expectedDeliveryDate: product.expectedDeliveryDate,
  isVolumeBasedPriceEnabled: product.isVolumeBasedPriceEnabled ?? false,
  volumeBasedPrices: product.volumeBasedPrices ?? [],
  quantityLimit: product.quantityLimit ?? null,
  tax: product.tax,
  isDynamicPriceEnabled: product.isDynamicPriceEnabled,
});

const toESProductFields = (ESProduct, countryCode) => ({
  id: parseInt(ESProduct.id.raw),
  name: ESProduct.name.raw,
  sku: ESProduct.sku.raw,
  imageUrl: ESProduct.imageUrl.raw,
  description: formatDescription(ESProduct.description.raw),
  price: +ESProduct.price.raw,
  mrp: ESProduct.mrp ? +ESProduct.mrp.raw : null,
  stockQuantity: +ESProduct.stockQuantity.raw,
  size: ESProduct.size.raw,
  unit: ESProduct.unit.raw,
  brand: ESProduct.brand.raw,
  tradePrice: ESProduct.tradePrice ? +ESProduct.tradePrice.raw : "",
  discount: ESProduct.tradePrice ? getDiscountAccordingToTradePrice(ESProduct.tradePrice.raw, ESProduct.price.raw) : "",
  taxCategory: ESProduct.taxCategory ? +ESProduct.taxCategory.raw : 0,
  taxPercent: +ESProduct.taxPercent.raw,
  taxInclusive: ESProduct.taxInclusive.raw === "true" ? true : false,
  expectedDeliveryDate: countryCode
    ? getDeliveryDate(ESProduct.taxPercent.deliveryDate, countryCode).deliveryDate
    : null,
  isVolumeBasedPriceEnabled: ESProduct.isVolumeBasedPriceEnabled?.raw === "true" ? true : false,
  isDynamicPriceEnabled: ESProduct.isDynamicPriceEnabled?.raw === "true" ? true : false,
  volumeBasedPrices: ESProduct.volumeBasedPrices?.raw
    ? ESProduct.volumeBasedPrices.raw.map(volumeBasedPrice => JSON.parse(volumeBasedPrice)) : [],
  quantityLimit: ESProduct.quantityLimit ? +ESProduct.quantityLimit.raw : null,
});

/**
 * Mapper to extract essential attributes from the database object
 *
 * @param {Object} product
 * @returns {Object} response product id
 */
const toProductIdDto = product => ({ id: product.id });

module.exports = {
  toGetProductsResponse,
  toESProductFields,
  toProductIdDto,
};
