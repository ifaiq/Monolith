const { setID } = require("./id.js");
const { CAC_TAGS, CBC_TAGS } = require("../Constants");
const { builder, addNodesToParent } = require("../Utils");

// // // // // // // // // // // // // //
// Signature component
// // // // // // // // // // // // // //
function setSignature(id, method) {
  const parentEle = builder.create(CAC_TAGS.SIGNATURE);

  addNodesToParent(parentEle, setID(id));
  parentEle.ele(CBC_TAGS.SIGNATURE_METHOD).text(method);

  return parentEle;
}

module.exports = {
  setSignature,
};
