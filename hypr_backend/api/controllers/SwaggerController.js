const fs = require("fs");
const path = require("path");

module.exports = {
  getDocs: async (req, res) => {
    const docsPath = path.join(__dirname, "..", "..", "swagger/swagger.json");
    try {
      if (fs.existsSync(docsPath)) {
        const swaggerJson = require(docsPath);
        return res.status(200).send(swaggerJson);
      }
      return res.status(400).send({ message: "swagger.json couldn't be generated." });
    } catch (err) {
      sails.log(err);
      res.status(404);
    }
  },
};
