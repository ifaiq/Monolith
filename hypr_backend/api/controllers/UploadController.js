var fs = require("fs");
const skipperbetters3 = require("skipper-better-s3");

module.exports = {
  uploadFileToS3: function (req, res, next) {
    const file = req.file("file");
    if (file && file._files[0]) {
      const contentType = file._files[0].stream.headers["content-type"];
      if (!Constants.ALLOWED_S3_UPLOAD_MIMETYPES.includes(contentType)) {
        return res.badRequest({ message: `Unsupported file format: ${contentType}` });
      }
      var file_name = file._files[0].stream.filename;
      const fileNameParts = file_name.split('.');
      if (fileNameParts.length) {
        file_name = `${fileNameParts[0]} - ${Date.now()}.${fileNameParts[fileNameParts.length - 1]}`;
      }

      const options = {
        adapter: skipperbetters3,
        key: sails.config.globalConf.AWS_KEY,
        secret: sails.config.globalConf.AWS_SECRET,
        bucket: sails.config.globalConf.AWS_BUCKET,
        s3Params: { Key: file_name },
        region: sails.config.globalConf.AWS_REGION,
        saveAs: file_name,
      };
      req.file("file").upload(options, function (err, uploadedFiles) {
        if (err) return res.serverError(err);
        return res.ok({ file: uploadedFiles, name: file_name });
      });
    } else {
      file.upload({ noop: true });
      file.noMoreFiles(); // clears all default errorTimeouts on the file streams in case file is malformed.
      res.badRequest({ message: "please attach file to upload!" });
    }
  },
  uploadProductImageToS3: function (req, res, next) {
    var location_id = req.param("location_id");
    const contentType = req.file("file")._files[0].stream.headers["content-type"];
    if (!Constants.ALLOWED_S3_UPLOAD_MIMETYPES.includes(contentType)) {
      return res.badRequest({ message: `Unsupported file format: ${contentType}` });
    }
    var file_name = req.file("file")._files[0].stream.filename;
    console.log("file_name");
    console.log(file_name);
    console.log("*** Upload started");
    // calling function to get file contents
    UploadService.getFileContents3(req)
      .then((data) => {
        if (data.success) {
          UploadService.processUploadedZipFileForImages(data.filePath, location_id, file_name);
          res.ok();
        }
        else {
          res.serverError("something went wrong!");
        }
      })
      .catch(function (err) {
        console.log(err);
        res.serverError(err);
      });
  },

  uploadUserImageToS3: function (req, res, next) {
    try {
      const file = req.file("picture");
      if (!file || !file._files[0] || !file._files[0].stream) {
        file.upload({ noop: true });
        file.noMoreFiles(); // clears all default errorTimeouts on the file streams in case file is malformed.
        sails.log.error({ message: "UploadController-uploadImageToS3: Missing file or file is not attached." })
        return res.badRequest({ message: "ERROR MISSING FILE" });
      }
      const contentType = file._files[0].stream.headers["content-type"];
      if (!Constants.ALLOWED_S3_UPLOAD_MIMETYPES.includes(contentType)) {
        return res.badRequest({ message: `Unsupported file format: ${contentType}` });
      }
      const fileName = file._files[0].stream.filename;
      const splittedFileName = fileName.split('.');
      const reformedFileName = `${splittedFileName[0]}-${Math.floor(Date.now() / 1000)}.${splittedFileName[splittedFileName.length - 1]}`;
      sails.log.info({ message: `UploadController-uploadImageToS3: Starting upload: ${reformedFileName}` });
      const options = {
        adapter: require("skipper-better-s3"),
        key: sails.config.globalConf.AWS_KEY,
        secret: sails.config.globalConf.AWS_SECRET,
        bucket: sails.config.globalConf.AWS_BUCKET,
        s3Params: { Key: reformedFileName },
        region: sails.config.globalConf.AWS_REGION,
        saveAs: reformedFileName,
        noop: true
      };

      file.upload(options, (err, files) => {
        if (!err) {
          sails.log.info({ message: `UploadController-uploadImageToS3: Uploaded successfully: ${reformedFileName}` });
          res.ok({ link: `${process.env.CDN_ENDPOINT}/${files[0].fd}` });
        }
      });
    } catch (err) {
      sails.log.error({ message: `UploadController-uploadImageToS3 Error: ${JSON.stringify(err.stack)}` })
      res.badRequest({ message: "ERROR MISSING FILE STREAM" });
    }
  },
};
