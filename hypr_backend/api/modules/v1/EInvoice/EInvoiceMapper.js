const { TAX_INVOICE, EINVOICE_VERSIONING } = require("./Constants");
const { detectLanguage } = require("../Utils/Utils");

/**
 * This method takes the user, shop and return the invoiceBuyer.
 * @param {Number} user
 * @param {Number} shop
 * @returns {Object} InvoiceBuyer
 */
const toInvoiceBuyer = (user, shop) => ({
  name: user.name,
  nameLanguage: detectLanguage(user.name),
  businessName: shop.shop_name || "",
  businessNameLanguage: detectLanguage(shop.shop_name),
  phone: user.phone,
  address: user.address,
  addressLanguage: detectLanguage(user.address),
  vat: user.taxId,
});

/**
 * This method takes the invoice, user and returns the invoiceDBObj
 * @param {object} invoice
 * @param {object} user
 * @returns {Object} InvoiceDBObj
 */
const toInvoiceDBObj = (invoice, user) => ({
  title: TAX_INVOICE,
  invoiceNumber: invoice.invoiceNumber,
  customerId: user.id,
  orderId: invoice.orderId,
  businessUnitId: user.business_unit_id,
  invoiceIssueDate: new Date(),
  totalAmount: invoice.vatExclusiveTotalAmount,
  discount: invoice.totalDiscount,
  totalTaxAmount: invoice.totalTax,
  totalAmountDue: invoice.totalAmount,
  pdfPath: invoice.pdfPath,
  xmlPath: invoice.xmlPath,
  thermalPdf: invoice.thermalPdf || "",
  // append 's' when generating simplified invoice
  version: EINVOICE_VERSIONING.latest + `${user?.customerType === "Individual" ? "s" : ""}`,
  netDiscount: invoice.netDiscount,
  ajilHandlingFee: invoice.ajilHandlingFee,

});

const createInvoiceObj = (invoiceType, invoice, isCreditNote) => ({
  invoiceType,
  countryCode: invoice.countryCode,
  orderId: invoice.orderId,
  isCreditNote,
  payload: invoice,
});

const createInvoiceNumberObj = (orderId, isCreditNote, countryCode) => ({
  orderId,
  isCreditNote,
  countryCode,
});

module.exports = {
  toInvoiceBuyer,
  toInvoiceDBObj,
  createInvoiceObj,
  createInvoiceNumberObj,
};
