const keys = require("../../utils/keys");

module.exports = {
  friendlyName: "Keys",

  description: "Access to keys util",

  inputs: {
    key: {
      type: "string",
      example: "mysql",
      description: "The name of the key to get.",
      required: false,
    },
  },

  exits: {},

  fn: async function (inputs, exits) {
    // All done.
    return exits.success(
      inputs.hasOwnProperty("key") ? keys[inputs.key] || null : keys
    );
  },
};
