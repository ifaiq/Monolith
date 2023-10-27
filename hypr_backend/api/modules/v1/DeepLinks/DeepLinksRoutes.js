const {
  constants: {
    request: {
      VERSIONING: { v1 },
    },
  },
} = require("../../../constants/http");

const controller = `${v1}/DeepLinksController`;

module.exports = {
  "GET /:screen?/:categoryId?/:subcategoryId?": {
    controller,
    action: "redirectingToDeepLinks",
  },
};
