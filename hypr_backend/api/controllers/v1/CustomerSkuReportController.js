const {
  customerSkuReportService,
} = require("../../modules/v1/CustomerSkuReport");
const AWS = AWSService.getAWSConfig();
const s3 = new AWS.S3();

const createReportUserSku = async (req, res) => {
  const { filename, fileurl } = req.body;
  const { id: updatedBy } = req.user;
  try {
    const response = await customerSkuReportService.createReportUserSku({ filename, fileUrl: fileurl, updatedBy, s3 });
    res.send(response);
  } catch (error) {
    res.serverError(error.message);
  }
};

const getCustomerReportSkus = async (req, res) => {
  const {
    query: { page, perPage },
  } = req;
  try {
    const response = await customerSkuReportService.getCustomerReportSku({ page, perPage, s3 });
    res.send(response);
  } catch (error) {
    res.serverError(error);
  }
};

module.exports = {
  createReportUserSku,
  getCustomerReportSkus,
};
