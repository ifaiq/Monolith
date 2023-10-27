const { builder } = require("../Utils");
const { CBC_TAGS } = require("../Constants");

const setID = id => builder.create(CBC_TAGS.ID).text(id);

module.exports = {
  setID,
};
