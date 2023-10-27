const {
  CBC_TAGS,
  ATT_KEY_LIST,
  ATT_VAL_LIST,
} = require("../Constants");
const { builder } = require("../Utils");

// // // // // // // // // // // // // //
// Document components
// // // // // // // // // // // // // //
// // // // // // // // // // // // // //
// Helper Functions
// // // // // // // // // // // // // //
const setProfileID = (value = "reporting:1.0") =>
  builder.create(CBC_TAGS.PROFILE_ID).text(value);

const setID = (iD = "100") => builder.create(CBC_TAGS.ID).text(iD);

const setUUID = (uuID = "3cf5ee18-ee25-44ea-a444-2c37ba7f28be") =>
  builder.create(CBC_TAGS.UUID).text(uuID);

const setIssueDate = (issueDate = "2021-04-25") =>
  builder.create(CBC_TAGS.ISSUE_DATE).text(issueDate);

const setIssueTime = (issueTime = "15:30:00") =>
  builder.create(CBC_TAGS.ISSUE_TIME).text(issueTime);

function setInvoiceTypeCode(
  invoiceTypeCode = {
    attributeValue: "0100000",
    nodeText: "388",
  },
) {
  return builder
    .create(CBC_TAGS.INVOICE_TYPE_CODE)
    .att(ATT_KEY_LIST.NAME, invoiceTypeCode.attributeValue)
    .text(invoiceTypeCode.nodeText);
}

const setDocumentCurrencyCode = (currencyCode = ATT_VAL_LIST.SAR) =>
  builder.create(CBC_TAGS.DOC_CURRENCY_CODE).text(currencyCode);

const setTaxCurrencyCode = (currencyCode = ATT_VAL_LIST.SAR) =>
  builder.create(CBC_TAGS.TAX_CURRENCY_CODE).text(currencyCode);

const setLineCountNumeric = (count = 2) =>
  builder.create(CBC_TAGS.LINE_COUNT_NUMERIC).text(count);

// // // // // // // // // // // // // //
// // // // // // // // // // // // // //
// // // // // // // // // // // // // //
module.exports = {
  setProfileID,
  setID,
  setUUID,
  setIssueDate,
  setIssueTime,
  setInvoiceTypeCode,
  setDocumentCurrencyCode,
  setTaxCurrencyCode,
  setLineCountNumeric,
};
