const { setID } = require("./id.js");
const { CBC_TAGS } = require("../Constants");
const { builder, addNodesToParent } = require("../Utils");

module.exports = function (categoryType, id, percent) {
  const parentEle = builder.create(categoryType);

  addNodesToParent(parentEle, setID(id));

  parentEle.ele(CBC_TAGS.PERCENT).text(percent);

  return parentEle;
};
