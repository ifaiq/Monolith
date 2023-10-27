const { setID } = require("./id.js");
const { CAC_TAGS } = require("../Constants");
const { builder, addNodesToParent } = require("../Utils");

module.exports = schemeType => {
  const parentEle = builder.create(CAC_TAGS.TAX_SCHEME);

  addNodesToParent(parentEle, setID(schemeType));

  return parentEle;
};
