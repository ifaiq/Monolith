const crypto = require("crypto");
const AWSService = require("../../../services/AWSService");
const AWS = AWSService.getAWSConfig();

const getS3Url = key => {
  const { bucket } = AWSService.options;
  // TODO hot fix, stage is unable to read the region key from aws config
  // let { region } = AWSService.options;
  const region = "me-south-1";
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
};

const getUniqueKey = () => crypto.randomBytes(12).toString("hex") + new Date().getTime().toString(16);

/**
 *
 * @param {String} filePath
 * @param {String} _uniqueKey
 * @param {Boolean} isPublic
 * @param {String} folder
 */
const uploadFile = (
  filePath,
  _uniqueKey = undefined,
  extention,
  folder = "files",
) =>
  new Promise((resolve, reject) => {
    const s3 = new AWS.S3({
      region: "me-south-1",
    });
    const { bucket } = AWSService.options;
    const uniqueKey = _uniqueKey ? _uniqueKey : getUniqueKey();
    const params = {
      Bucket: bucket,
      ACL: "public-read",
    };

    params.Key = `${folder}/${uniqueKey}.${extention}`;
    params.Body = filePath;

    s3.putObject(params, err => {
      if (err) {
        sails.log.error(
          "uploadToS3: Error while uploading to S3: " + err.stack,
          uniqueKey,
        ); // an error occurred
        return reject(err);
      }

      return resolve({
        key: params.Key,
        path: getS3Url(params.Key),
      });
    });
  });

/**
 *
 * @param {String} key
 */
const getSignedUrl = async key => new Promise((resolve, reject) => {
  const params = {
    Expires: convertDayToSec(6), // 6 days
    Bucket: AWSService.options.bucket,
    Key: key,
  };
  const s3 = new AWS.S3();
  s3.getSignedUrlPromise("getObject", params)
    .then(url => {
      resolve(url);
    }, err => {
      reject(err);
    });
});

module.exports = {
  uploadFile,
  getSignedUrl,
  getS3Url,
  getUniqueKey,
};
