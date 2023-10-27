var defer = require("node-defer");
const skipperbetters3 = require("skipper-better-s3");
const AWSService = require("./AWSService");
const AWS = AWSService.getAWSConfig();

module.exports = {
  
  deleteFile: function (link) {
    var deferred = new defer();
    let baseUrl = `https://${sails.config.globalConf.AWS_BUCKET}.s3.${sails.config.globalConf.AWS_REGION}.amazonaws.com/`;
    link = link.replace(baseUrl, "");
    var bucketInstance = new AWS.S3();

    var params = {
      Bucket: sails.config.globalConf.AWS_BUCKET,
      Key: link,
    };

    bucketInstance.deleteObject(params, function (err, data) {
      if (data) {
        deferred.resolve(true);
      } else {
        deferred.resolve(false);
      }
    });
    return deferred.promise();
  },
  uploadFile: function (file_name, file, sku) {
    var deferred = new defer();
    const options = {
      adapter: skipperbetters3,
      key: sails.config.globalConf.AWS_KEY,
      secret: sails.config.globalConf.AWS_SECRET,
      bucket: sails.config.globalConf.AWS_BUCKET,
      s3Params: { Key: file_name },
      region: sails.config.globalConf.AWS_REGION,
      saveAs: file_name,
    };
    file.upload(options, (err, files) => {
      if (!err) {
        RedisService.updateProduct(
          { sku: sku },
          {
            image_url: files[0].extra.Location,
          }
        );
        Product.update(
          { sku: sku },
          { image_url: files[0].extra.Location }
        ).exec(function (err, product) {
          if (!err) {
            deferred.resolve(true);
          }
          deferred.resolve(false);
        });
      }
    });
    return deferred.promise();
  },

  uploadImage: function (fileContent, filename) {
    console.log("UPLOADING: " + filename);
    var deferred = new defer();
    var bucketInstance = new AWS.S3();
    var params = {
      Bucket: sails.config.globalConf.AWS_BUCKET,
      Key: filename, // File name you want to save as in S3
      Body: fileContent,
    };

    bucketInstance.upload(params, function (err, data) {
      if (err) {
        console.log("ERROR AT UPLOAD IMAGE", err);
        deferred.reject(err);
      } else {
        console.log(`File uploaded successfully. ${data.Location}`);
        deferred.resolve(data.Location);
      }
    });
    return deferred.promise();
  },

  getFile: function (filename) {
    var deferred = new defer();
    var bucketInstance = new AWS.S3();

    var params = {
      Bucket: sails.config.globalConf.AWS_BUCKET,
      Key: filename, // File name you want to save as in S3
    };

    bucketInstance.getObject(params, function (err, data) {
      if (err) {
        console.log("ERROR AT GET FILE", err);
        deferred.reject(err);
      } else {
        console.log(`File get successfully. ${data.Location}`);
        deferred.resolve(data);
      }
    });

    return deferred.promise();
  },
};
