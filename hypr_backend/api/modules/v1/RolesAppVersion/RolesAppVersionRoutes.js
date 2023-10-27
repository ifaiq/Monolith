const {
  constants: {
    request: {
      VERSIONING: { v1 },
    },
  },
} = require("../../../constants/http");

const controller = `${v1}/RolesAppVersionController`;

module.exports = {
  "POST /": {
    controller,
    action: "createAppVersion",
    validate: "createRolesAppVersionValidation",
  },
  "PUT /": {
    controller,
    action: "updateAppVersion",
    validate: "updateRolesAppVersionValidation",
  },
};
