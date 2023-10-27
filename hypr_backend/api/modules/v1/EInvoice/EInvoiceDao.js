const camelcaseKeys = require("camelcase-keys");
const snakecaseKeys = require("snakecase-keys");

/**
 * This function takes the invoice and return new invoice.
 *
 * @param {Object} invoice
 * @returns {Object} batch
 */
const create = async invoice => await Invoice.create(snakecaseKeys(invoice));

/**
 * This function takes the id and return invoice.
 *
 * @param {Number} id
 * @returns {Object} invoice
 */
const findByCheckedId = async id => {
  const invoice = await Invoice.findOne({ id });
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
  const invoice = await Invoice.findOne(snakecaseKeys({ orderId }));
  return camelcaseKeys(invoice);
};

/**
 * This function takes the id and return invoices.
 *
 * @param {Number} orderId
 * @returns {Object} invoice
 */
const findManyByOrderId = async orderId => {
  const invoices = await Invoice.find(snakecaseKeys({ orderId }));
  return invoices?.map(invoice => camelcaseKeys(invoice));
};

/**
 * This function takes the id and return invoices.
 *
 * @param {Number} orderId
 * @returns {Object} invoice
 */
const findByCustomerId = async customerId => {
  const invoices = await Invoice.find(snakecaseKeys({ customerId }));
  return invoices?.map(invoice => camelcaseKeys(invoice));
};

/**
* This function takes the id and return invoice.
*
* @param {Number} orderId
* @returns {Object} invoice
*/
const findLatestInvoiceByOrderId = async orderId => {
  const invoices = await Invoice.find(snakecaseKeys({ orderId })).sort("id desc").limit(1);
  return (invoices && invoices[0]) ? camelcaseKeys(invoices[0]) : undefined;
};


/**
 * This function returns last invoice number.
 *
 * @returns {Object} invoice
 */
const getLastInvoiceNumber = async code => {
  let invoice = await sails.sendNativeQuery(
    `select * from invoices WHERE (invoice_number LIKE '${code}%') ORDER BY id DESC limit 1`, []);
  invoice = (invoice.rows && invoice.rows[0]) ? invoice.rows[0].invoice_number : undefined;
  return invoice;
};

/**
 * This function takes the id and return invoices.
 *
 * @param {Number} orderId
 * @returns {Object} invoice
 */
const findByCriteria = async criteria => {
  const invoices = await Invoice.find(snakecaseKeys(criteria));
  return invoices?.map(invoice => camelcaseKeys(invoice));
};


module.exports = {
  create,
  findByOrderId,
  findByCheckedId,
  findManyByOrderId,
  getLastInvoiceNumber,
  findByCustomerId,
  findLatestInvoiceByOrderId,
  findByCriteria,
};
