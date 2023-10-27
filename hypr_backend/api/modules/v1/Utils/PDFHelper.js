const pdf = require("html-pdf");

const generateFileBuffer = (data, options) => new Promise((res, rej) => {
  pdf.create(data, options).toBuffer((error, buffer) => {
    if (error) {
      rej(error);
    } else {
      res(buffer);
    }
  });
});

module.exports = {
  generateFileBuffer,
};
