const AWSService = require("../../../services/AWSService");
const AWS = AWSService.getAWSConfig();
const s3 = new AWS.S3();

/**
 * Create readable stream from S3
 * @param {String} fileName
 * @returns {Object} s3Options
 */
const createReadStream = fileName => {
  const s3Options = { Bucket: sails.config.globalConf.AWS_BUCKET, Key: fileName };
  return s3.getObject(s3Options).createReadStream();
};

module.exports = {
  createReadStream,
};
