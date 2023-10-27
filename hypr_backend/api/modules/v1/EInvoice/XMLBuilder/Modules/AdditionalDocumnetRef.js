const {
  CAC_TAGS,
  CBC_TAGS,
  ATT_KEY_LIST,
  ATT_VAL_LIST,
} = require("../Constants");
const { builder } = require("../Utils");

// // // // // // // // // // // // // //
// Components of AdditionalDcoumnetReference
// // // // // // // // // // // // // //
// // // // // // // // // // // // // //
// ADR setter
// // // // // // // // // // // // // //
function setADR(idValue, { docType = "", docValue }) {
  // Create parent element
  const parentEle = builder.create(CAC_TAGS.ADDITIONAL_DOCUMENT_REFERENCE);

  // Set AdditionalDcoumnetReference ID text
  parentEle.ele(CBC_TAGS.ID).text(idValue);

  // Add appropriate child node to parent node
  if (docType === "UUID") parentEle.ele(CBC_TAGS.UUID).text(docValue);

  if (docType === "Attachment") {
    parentEle
      .ele(CAC_TAGS.ATTACHMENT)
      .ele(CBC_TAGS.EDB_OBJECT)
      .att(ATT_KEY_LIST.MIME_CODE, ATT_VAL_LIST.TXT_PLAIN)
      .text(docValue);
  }

  return parentEle;
}

module.exports = {
  setADR,
};
