const builder = require("xmlbuilder");

const addNodesToParent = (parentNode, childNode) => {
  parentNode.importDocument(childNode);
};

const addSubChildToChild = (childNode, subChildNode) => childNode.importDocument(subChildNode);

module.exports = {
  builder,
  addNodesToParent,
  addSubChildToChild,
};
