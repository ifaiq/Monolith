const { constants: { request: { VERSIONING: { v1 } } } } = require("../../../constants/http");

const controller = `${v1}/BusinessUnitController`;

module.exports = {
  "GET /:id": {
    controller,
    action: "getBusinessUnitById",
    validate: "getBusinessUnitByIdValidation",
  },
  "GET /": {
    controller,
    action: "getBusinessUnits",
  },
  "GET /portal/:id": {
    controller,
    action: "getBusinessUnitByIdForPortal",
    validate: "getBusinessUnitByIdValidation",
  },
};
