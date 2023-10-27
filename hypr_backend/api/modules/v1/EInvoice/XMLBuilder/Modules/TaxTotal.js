const { builder } = require("../Utils");
const { CAC_TAGS, CBC_TAGS, ATT_KEY_LIST } = require("../Constants");

function setTaxTotal(currencyID, taxAmount) {
  const parentEle = builder.create(CAC_TAGS.TAX_TOTAL);

  parentEle
    .ele(CBC_TAGS.TAX_AMOUNT)
    .att(ATT_KEY_LIST.CURRENCY_ID, currencyID)
    .text(taxAmount);

  return parentEle;
}

function setSubTotal(
  taxableAmount = {
    currencyCode,
    amount,
  },
  taxAmount = {
    currencyCode,
    amount,
  },
) {
  const parentEle = builder.create(CAC_TAGS.TAX_SUBTOTAL);

  parentEle
    .ele(CBC_TAGS.TAXABLE_AMOUNT)
    .att(ATT_KEY_LIST.CURRENCY_ID, taxableAmount.currencyCode)
    .text(taxableAmount.amount);
  parentEle
    .ele(CBC_TAGS.TAX_AMOUNT)
    .att(ATT_KEY_LIST.CURRENCY_ID, taxAmount.currencyCode)
    .text(taxAmount.amount);

  return parentEle;
}

module.exports = {
  setTaxTotal,
  setSubTotal,
};
