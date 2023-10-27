const TEST_TIMEOUT = 120000;

const {
  constants: {
    request: {
      VERSIONING: { prefix, v1 },
    },
  },
} = require("../../../api/constants/http");

const locationId = 194;

module.exports = {
  TEST_TIMEOUT,
  prefix,
  v1,
  locationId,
};
