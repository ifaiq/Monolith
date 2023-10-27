var fs = require("fs");
var JSZip = require("jszip");
var csv = require("fast-csv");
var skipperbetters3 = require("skipper-better-s3");

function getChunkSize(byteCount){
  let sizeInMB = byteCount/(1024*1024);
  let chunkSize = 5;
  while((sizeInMB/chunkSize)>50){
    chunkSize += 5;
  }
  return chunkSize;
}

module.exports = {
  getFileContents: async function (req) {
    console.log("uploading....");
    return new Promise((resolve, reject) => {
      req.file("file").upload(
        {
          dirname: process.cwd() + "/.tmp/uploads",
          maxBytes: 10000000000000,
        },
        function (err, uploadedFile) {
          console.log("uploadedFile");
          console.log(uploadedFile);
          if (err) console.log(err);
          else if (uploadedFile[0]) {
            var zipFile = uploadedFile[0];
            // read a zip file
            fs.readFile(zipFile["fd"], function (err, data) {
              if (err) {
                sails.log.error(`ReqID: ${req.id}, UserID: ${userID}, context: "context", Error in getFileContents(), while trying to read the file -> [${JSON.stringify(err.stack)}]`);
                reject(err); 
              }
              JSZip.loadAsync(data).then(async function (zip) {
                files = Object.keys(zip.files);
                console.log("files");
                console.log(files);
                unzip_files = [];
                for (var index = 0; index < files.length; index++) {
                  var content = await zip
                    .file(files[index])
                    .async("nodebuffer");
                  unzip_files.push({
                    content: content,
                    name: files[index],
                  });
                }
                console.log("unzip_files");
                console.log(unzip_files);
                resolve(unzip_files);
              });
            });
          }
        }
      );
    });
  },

  processUploadedZipFileForImages: async function(s3_file, location, file){
    new Promise((resolve, reject) => {
      var imageUploadCount = 0;
      var index = 0;
      var sku = "";
      let location_id = location;
      var file_name = file;
      try{
        S3Service.getFile(s3_file).then(function (data) {
          console.log("data");
          console.log(data);
          console.log(data.Body);
          data = data.Body;
          JSZip.loadAsync(data).then(async function (zip) {
            files = Object.keys(zip.files);
            console.log("files");
            console.log(files);
            unzip_files = [];
            for (var index = 0; index < files.length; index++) {
              var content = await zip.file(files[index]).async("nodebuffer");
              unzip_files.push({
                content: content,
                name: files[index],
              });
            }
            console.log("unzip_files");
            console.log(unzip_files);
            S3Service.deleteFile(s3_file).then(function functionName() {
              console.log("file deleted");
            });
            console.log("*** file content");
            let images = unzip_files;

            // images: (file Contents), imageUploadCount (for future use to track errors in upload)
            imageUploadCount = images.length;
            var uploaded = 0;
            async.eachSeries(
              images,
              function (image, callback) {
                index = image.name.split(".");
                // getting sku name from image
                sku = index[0].trim();
                file_name = sku + "-" + new Date().getTime() + "." + index[1];
                file_name = file_name.split(" ").join("");
                let product_criteria = { sku: sku, location_id: location_id };
    
                // find product
                Product.findOne(product_criteria).exec(function (err, product) {
                  if (err) {
                    // res.basRequest('Product not found');
                    console.log("image upload Product not found: " + sku);
                    callback();
                  }
                  if (product) {
                    //  if product image doesn't exist
                    if (!product.image_url) {
                      S3Service.uploadImage(image.content, file_name)
                        .then(function (result) {
                          if (result) {
                            console.log("IMAGE UPlOADED URL", result);
                            uploaded++;
                            Product.update(
                              product_criteria,
                              { image_url: result }
                            ).exec(function (err, product) {
                              if (err) console.log("ERROR (UPDATING PRODUCT)", err);
                              callback();
                            });
                          }
                        })
                        .catch(function (err) {
                          console.log("ERROR (S3 SERVICE)", err);
                          callback(err);
                        });
                    } else {
                      // Delete previous image and upload new
                      S3Service.deleteFile(product.image_url).done(function (
                        result
                      ) {
                        if (result) {
                          S3Service.uploadImage(image.content, file_name)
                            .then(function (result) {
                              if (result) {
                                console.log("IMAGE UPlOADED URL", result);
                                uploaded++;
                                Product.update(
                                  product_criteria,
                                  { image_url: result }
                                ).exec(function (err, product) {
                                  if (err)
                                    console.log("ERROR (UPDATING PRODUCT)", err);
                                  callback();
                                });
                              }
                            })
                            .catch(function (err) {
                              console.log("ERROR (S3 SERVICE)", err);
                              callback(err);
                            });
                        } else {
                          // res.badRequest('Can not delete file');
                          console.log("Can not delete file");
                        }
                      });
                    }
                  } else {
                    // res.basRequest('Product not found');
                    console.log("image upload Product not found: " + sku);
                    callback();
                  }
                });
              },
              function (err, result) {
                if (err) {
                  console.log(err);
                } else {
                  console.log("every thing works fine");
                }
              }
            );
            resolve();
          })
          .catch(function(err){
            console.log("inside unzip file error",err);
            reject(err);
          });
        })
        .catch(function(err){
          console.log("inside get file error",err);
          reject(err);
        });
      }
      catch(e){
        console.log(e);
      }
    });

  },

  getFileContents3: async function (req) {
    try{
      console.log("uploading....");

      var file_name = req.file("file")._files[0].stream.filename;
      console.log("S3 file_name");
      console.log(file_name);
      let chunkSize = getChunkSize(req.file("file")._files[0].stream.byteCount);
      console.log(chunkSize)
      const options = {
        adapter: skipperbetters3,
        key: sails.config.globalConf.AWS_KEY,
        secret: sails.config.globalConf.AWS_SECRET,
        bucket: sails.config.globalConf.AWS_BUCKET,
        s3Params: { Key: file_name, ACL: "public-read"},
        //region: "us-east-1",
        saveAs: file_name,
        s3options: { partSize: chunkSize * 1024 * 1024, queueSize: 1000},//10MB 
        onProgress: (progress) => sails.log.verbose("Upload progress:", progress),
      };
  
      return new Promise((resolve, reject) => {
        try{
          req.file("file").upload(options, function (err, uploadedFile) {
            console.log("uploadedFile");
            console.log(uploadedFile);
            if (err) {
              console.log("inside error")
              console.log(err)
              reject(err);
            }
            else if (uploadedFile[0]) {
              var zipFile = uploadedFile[0];
              console.log("zipFile");
              console.log(zipFile["fd"]);
              resolve({
                success: true,
                filePath: zipFile["fd"],
                chunkSize: chunkSize
              });
            }
            else{
              reject("something went wrong!");
            }
          });
        }
        catch(e){
          console.log(e);
          reject(e);
        }
      });
    }
    catch(e){
      console.log(e);
    }
  },
  uploadProductFeed: function (file_name, job_id) {
    var file = require("path").resolve(sails.config.appPath, ".tmp/uploads/");
    var stream = fs.createReadStream(file + "/" + file_name);
    var i = 0;
    var csvStream = csv()
      .on("data", function (data) {
        var locations = data[2].split(",");
        async.each(locations, function (location, next) {
          ProductLocationPrice.findOne({
            sku: data[0],
            location_id: location,
          }).exec(function (err, product) {
            if (product) {
              ProductLocationPrice.update(
                { sku: data[0] },
                { price: data[1] }
              ).exec(function (err, updatedProduct) {
                if (err) console.log("ERROR AT PRICING UPDATE");
                else {
                  Product.findOne({ sku: data[0] }).exec(function (
                    err,
                    productFound
                  ) {
                    if (err) console.log("PRODUCT FIND ERROR");
                    else {
                      ProductService.updateProductInEs(productFound.id)
                        .then((response) => {
                          console.log(response);
                        })
                        .catch((err) => {
                          console.log(err);
                        });
                    }
                  });
                  console.log(
                    "SUCCESSFULL SKU - " + data[0] + " - index - ",
                    i
                  );
                  i++;
                  next(null);
                }
              });
            } else {
              console.log("SKIPPED SKU - " + data[0] + " - index - ", i);
              i++;
              next(null);
            }
          });
        });
      })
      .on("data", function (data) {})
      .on("end", function () {
        InventoryAuditService.updateJobFeed(job_id, "COMPLETED");
      })
      .on("error", function (error) {
        InventoryAuditService.updateJobFeed(job_id, "ERROR OCCURED");
      });

    stream.pipe(csvStream);
  },
  uploadInventoryFeed: function (file_name, job_id) {
    var file = require("path").resolve(sails.config.appPath, ".tmp/uploads/");
    var stream = fs.createReadStream(file + "/" + file_name);
    var i = 1;
    var csvStream = csv()
      .validate(function (data, next) {
        Inventory.findOne({
          product_sku: data[0],
          location_id: parseInt(data[2]),
        }).exec((err, inventoryObj) => {
          // Update Old Inventory
          if (inventoryObj) {
            inventoryObj.quantity =
              parseFloat(data[1]) < 0 ? 0 : parseFloat(data[1]);
            InventoryService.stockIn(inventoryObj, true).then((inventory) => {
              if (err) console.log(err);
              console.log("SUCCESSFULL SKU - " + data[0] + " - index - ", i);
              i++;
              next(null);
            });
          } else {
            console.log("SKIPPED SKU - " + data[0] + " - index - ", i);
            i++;
            next(null);
          }
        });
      })
      .on("data", function (data) {})
      .on("end", function () {
        InventoryAuditService.updateJobFeed(job_id, "COMPLETED");
      })
      .on("error", function (error) {
        InventoryAuditService.updateJobFeed(job_id, "ERROR OCCURED");
      });
    stream.pipe(csvStream);
  },
};
