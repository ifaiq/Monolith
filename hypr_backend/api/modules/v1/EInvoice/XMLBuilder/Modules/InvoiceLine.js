const { setID } = require("./id.js");
const {
  builder,
  addNodesToParent,
} = require("../Utils");
const {
  CAC_TAGS,
  CBC_TAGS,
  ATT_KEY_LIST,
} = require("../Constants");

function setInvoiceLine(
  id,
  invoicedQuantity = {
    unitCode,
    value,
  },
) {
  const parentEle = builder.create(CAC_TAGS.INVOICE_LINE);

  addNodesToParent(parentEle, setID(id));

  parentEle
    .ele(CBC_TAGS.INVOICED_QUANTITY)
    .att(ATT_KEY_LIST.UNIT_CODE, invoicedQuantity.unitCode)
    .text(invoicedQuantity.value);

  return parentEle;
}

function setRoundingAmount(currencyCode, amount) {
  return builder
    .create(CBC_TAGS.ROUNDING_AMOUNT)
    .att(ATT_KEY_LIST.CURRENCY_ID, currencyCode)
    .text(amount);
}

function setItem(itemName) {
  const parentEle = builder.create(CAC_TAGS.ITEM);
  parentEle.ele(CBC_TAGS.NAME).text(itemName);

  return parentEle;
}

function setPrice(currencyCode, amount) {
  return builder
    .create(CAC_TAGS.PRICE)
    .ele(CBC_TAGS.PRICE_AMOUNT)
    .att(ATT_KEY_LIST.CURRENCY_ID, currencyCode)
    .text(amount);
}

module.exports = {
  setInvoiceLine,
  setRoundingAmount,
  setItem,
  setPrice,
};
