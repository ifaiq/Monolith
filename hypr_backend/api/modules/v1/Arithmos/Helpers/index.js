const { calculateTax, getTax, getTotalTax, getTaxPercentage } = require("./TaxCalulation");
const {
  calculateTotal,
  calculateGrandTotal,
  calculateDeliveryCharge,
  calculateServiceCharge,
  calculateItemTotal,
  calculateExclusiveTaxPrice,
  subtractTaxFromConsumerPrice,
  calculateBasePriceFromMRP,
  calculateMRPTaxExclusivePrice,
  calculateConsumerPrice,
  getPaymentPrice,
  getSubTotal,
  subtractWaiver,
  getVolumeBasedProductPriceByQuantity,
} = require("./PriceCalculation");
const { calculateDiscount, calculateDiscountOnTradePrice, calculateProductDiscount } = require("./DiscountCalculation");
const { getInvoiceCalculations, subtractVatFromTotalPrice } = require("./InvoiceCalculation");
const { calculateProductsStock } = require("./stockCalculation");

module.exports = {
  calculateServiceCharge,
  calculateDeliveryCharge,
  calculateGrandTotal,
  calculateTotal,
  calculateTax,
  calculateDiscount,
  calculateItemTotal,
  getTax,
  getTotalTax,
  calculateExclusiveTaxPrice,
  subtractTaxFromConsumerPrice,
  calculateBasePriceFromMRP,
  calculateMRPTaxExclusivePrice,
  calculateConsumerPrice,
  getTaxPercentage,
  getPaymentPrice,
  getSubTotal,
  calculateDiscountOnTradePrice,
  calculateProductDiscount,
  subtractWaiver,
  getInvoiceCalculations,
  subtractVatFromTotalPrice,
  getVolumeBasedProductPriceByQuantity,
  calculateProductsStock,
};
