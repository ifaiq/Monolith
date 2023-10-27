const { validateAvsStock } = require("./WmsService");
const { fetchAvsStock } = require("./WmsService");
const { URLS } = require("./Constants");

module.exports = {
  URLS,
  validateAvsStock, fetchAvsStock,
};
