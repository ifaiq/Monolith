const camelcaseKeys = require("camelcase-keys");
const snakecaseKeys = require("snakecase-keys");

/**
 * This function takes the invoice and return new invoice.
 *
 * @param {Object} invoice
 * @returns {Object} batch
 */
const create = async invoice => await CreditNoteInvoice.create(snakecaseKeys(invoice));

/**
 * This function takes the id and return invoice.
 *
 * @param {Number} id
 * @returns {Object} invoice
 */
const findByCheckedId = async id => {
  const invoice = await CreditNoteInvoice.findOne({ id });
  if (_.isEmpty(invoice)) {
    // throw
  }
  return camelcaseKeys(invoice);
};

/**
 * This function takes the id and return invoice.
 *
 * @param {Number} orderId
 * @returns {Object} invoice
 */
const findByOrderId = async orderId => {
  const invoice = await CreditNoteInvoice.findOne(snakecaseKeys({ orderId }));
  return camelcaseKeys(invoice);
};

/**
 * This function takes the id and return invoice.
 *
 * @param {Number} invoiceId
 * @returns {Object} invoice
 */
const findByInvoiceId = async invoiceId => {
  const invoice = await CreditNoteInvoice.findOne(snakecaseKeys({ invoiceId }));
  return camelcaseKeys(invoice);
};

/**
 * This function takes the id and return invoices.
 *
 * @param {Number} invoiceId
 * @returns {Array} invoices
 */
const findManyByInvoiceIds = async invoiceIds => {
  const invoices = await CreditNoteInvoice.find(snakecaseKeys({ invoiceId: { in: invoiceIds } }));
  return invoices?.map(invoice => camelcaseKeys(invoice));
};

/**
 * This function returns last invoice number.
 *
 * @returns {Object} invoice
 */
const getLastInvoiceNumber = async code => {
  let invoice = await sails.sendNativeQuery(
    `select * from credit_note_invoices WHERE (invoice_number LIKE '${code}%') ORDER BY id DESC limit 1`, []);
  invoice = (invoice.rows && invoice.rows[0]) ? invoice.rows[0].invoice_number : undefined;
  return invoice;
};

module.exports = {
  create,
  findByOrderId,
  findByInvoiceId,
  findByCheckedId,
  findManyByInvoiceIds,
  getLastInvoiceNumber,
};
