var fs = require("fs");
var csv = require("fast-csv");
const AWS = AWSService.getAWSConfig();
const s3 = new AWS.S3();
var xlsx = require("xlsx");

const http = require("axios");
const uuid4 = require("uuid4");
const S3Service = require("../services/S3Service");
const ProductService = require("../services/ProductService");
const locationExtractionService = require("../config_service_extraction/locationsExtraction");
const { skuDeactivationReasonJunctionService } = require('../modules/v1/SkuDeactivationReasonJunction')
const { skuDeactivationReasonService } = require("../modules/v1/SkuDeactivationReason");
const { readCSV, convertCsvBufferToJson, validateMissingPriorityData, validatePriorityDataIds, validatePriorities, readVbpBulkUpdateCsv } = require("../../utils/csv-helpers");
const { PRICING_TYPES, PRODUCT_SEARCH_ATTRIBUTES } = require('../constants/product');

module.exports = {
  getProducts: async function (req, res, next) {
    try {
      var params = req.allParams();
      sails.log.info(
        `reqID: ${params.reqID
        }, context: ProductController.getProducts params: ${JSON.stringify(
          params
        )}`
      );
      let resp = await ProductService.getProducts(params.reqID, params);
      sails.log.info(
        `reqID: ${params.reqID
        }, context: ProductController.getProducts Response: ${JSON.stringify(
          resp
        )}`
      );
      return res.ok(resp);
    } catch (err) {
      sails.log.error(
        `reqID: ${params.reqID
        }, context: ProductController.getProducts Error: ${JSON.stringify(
          err.stack
        )}`
      );
      return res.serverError(err);
    }
  },
  createProduct: async function (req, res, next) {
    var params = req.allParams();
    const userId = req.user.id;
    params["stock_quantity"] = params.stock_quantity
      ? params.stock_quantity
      : 100; // added hardcoded for single product
    params["customSku"] = params.sku != "" ? true : false;

    let product = await ProductService.createProduct(params, userId);
    if (product["success"]) res.ok(product);
    else res.badRequest(product.message);
  },
  updateProduct: async function (req, res, next) {
    const params = req.allParams();
    sails.log.info(`single product update, update by: ${params.updated_by} for location: ${params.location_id}`);
    const { user: { id, role } } = req;
    let updateReason = "Single product update from admin portal";
    let productCategoryLocationMismatch = false;
    const { reason, is_deactivated = false } = params
    if (params.categoriesToEdit && params.isCategoryEdit) {
      params.categoriesToEdit.forEach(category => {
        if (category.location_id !== params.location_id) {
          productCategoryLocationMismatch = true;
        }
      });
    }

    if (productCategoryLocationMismatch) {
      return res.serverError(`Attached categories location doesn't match with the product location! Please re-add them to proceed. If the issue persists, log in again.`);
    }
    try {
      let product = await Product.findOne({ id: params.id });

      await ProductService.updateProductWithHistory({
        old_product: product,
        new_product_data: {
          name: params.name,
          sku: params.sku,
          image_url: params.image_url,
          size: params.size,
          unit: params.unit,
          brand: params.brand,
          configurable: params.configurable,
          urdu_name: params.urdu_name,
          urdu_unit: params.urdu_unit,
          urdu_size: params.urdu_size,
          urdu_brand: params.urdu_brand,
          disabled: params.disabled,
          barcode: params.barcode,
          price: params.price,
          description: params.description,
          consent_required: params.consent_required,
          cost_price: params.cost_price,
          mrp: params.mrp,
          trade_price: params.trade_price,
          tax_percent: params.tax_percent,
          tax_inclusive: params.tax_inclusive,
          weight: params.weight,
          width: params.width,
          length: params.length,
          height: params.height,
          updated_by: params.updated_by,
          tags: params.tags || [],
          removed_tags: params.removed_tags || [],
          tax_category: params.tax_category,
          delivery_time: params.delivery_time,
          quantity_limit: params.quantity_limit,
          is_dynamic_price_enabled: params.is_dynamic_price_enabled,
          is_volume_based_price_enabled: params.is_volume_based_price_enabled,
          volume_based_prices: params.volume_based_prices,
        },
        user_id: params.updated_by,
        reason: reason,
      }, role, product.location_id);
      if (reason) {
        await skuDeactivationReasonJunctionService.createSkuDeactivationRecord({
          productId: params.id, reason, isDeactivated: is_deactivated, userId: params.updated_by
        })
      }

      if (params.categoriesToEdit && params.isCategoryEdit) {
        await ProductService.updateProductJunctionRow(
          product.id,
          params.location_id,
          params.categoriesToEdit
        );
      }
      await ProductService.updateProductLanguages(params.multilingual);
      const result = await ProductService.updateProductInEs(product.id);
      result.success
        ? sails.log("SUCCESSFULLY UPDATED PRODUCT IN ES")
        : sails.log("ERROR OCCURRED WHILE UPDATING PRODUCT - ", product.id);
      res.ok();
    } catch (err) {
      res.serverError(err, {
        message: `AN ERROR OCCURRED WHILE UPDATING PRODUCT: ${err.message}`,
      });
    }
  },

  /* NOTE: modified 1 JULY 2020, added category name
  check for category id else category name last column -> data[22] */

  onBoardProducts: async function (req, res, next) {
    sails.log.info(
      `starting product bulk create. user_id: ${req.userId}`
    );
    var user_id = req.user.id;
    var bulk = req.param("bulk") ? req.param("bulk") : false;
    res.ok();
    var s3Options = { Bucket: sails.config.globalConf.AWS_BUCKET, Key: req.param("file_name") };
    const stream = s3.getObject(s3Options).createReadStream();
    var fileBuffers = [],
      repetitiveSkus = [],
      createdSkus = [],
      errorSkus = [];
    stream.on("data", async (data) => {
      fileBuffers.push(data);
    });
    stream.on("end", async () => {
      let workbook = xlsx.read(Buffer.concat(fileBuffers));
      let sheet_name_list = workbook.SheetNames;
      let allData = xlsx.utils.sheet_to_json(
        workbook.Sheets[sheet_name_list[0]]
      );
      for (let data of allData) {
        try {
          sails.log.info(
            `ReqID: ${req.id}, userID: ${JSON.stringify(
              res.locals.userData
            )}, context: ${req.url}, Creating SKU: ${data.name}`
          );
          if (!data.location_id) {
            errorSkus.push({
              index: allData.indexOf(data) + 1,
              sku: data.sku,
              reason: "No Location",
            });
            continue;
          }

          let location = await locationExtractionService.findOne({
            id: parseInt(data.location_id),
          });

          if (!data.name) {
            errorSkus.push({
              index: allData.indexOf(data) + 1,
              sku: data.sku,
              reason: "No Name",
            });
            continue;
          }

          if (!data.sku) {
            const queryParams = [parseInt(data.location_id)];
            const toBeSearched = `%${location.name.split(" ")[0]}-%`
            queryParams.push(toBeSearched);
            let query = `SELECT sku FROM products WHERE location_id = $1 and sku LIKE $2 ORDER BY id DESC LIMIT 1`;
            let result = await sails.sendNativeQuery(query, queryParams);
            let productSku = result.rows;
            if (productSku.length > 0) {
              var lastSku = productSku[0].sku;
            } else {
              var lastSku =
                location.name.split(" ")[0] +
                "-" +
                data.location_id.toString() +
                "-" +
                "000000";
            }
            let lastNumber = lastSku.split("-")[2];
            let newNumber = +lastNumber + 1;
            newNumber = ("000000" + newNumber).slice(-6);
            let newSku =
              location.name.split(" ")[0] +
              "-" +
              parseInt(data.location_id) +
              "-" +
              newNumber;
            data.sku = newSku;
          }
          if (
            !AuthStoreService.verify_user_access(
              { location_id: parseInt(data.location_id) },
              res.locals.userData
            )
          ) {
            errorSkus.push({
              index: allData.indexOf(data) + 1,
              sku: data.sku,
              reason: "Location Not Permitted",
            });
            continue;
          }
          if (
            (!data.price || data.price < 0 || data.price === '') ||
            (!data.mrp || data.mrp < 0 || data.mrp === '')
          ) {
            errorSkus.push({
              index: allData.indexOf(data) + 1,
              sku: data.sku,
              reason: "Invalide Price or MRP",
            });
            continue;
          }
          data.tax_category = +data.tax_category
          if (![
            Constants.TAX_CATEGORIES.TAX_ON_PRICE,
            Constants.TAX_CATEGORIES.TAX_ON_MRP,
            Constants.TAX_CATEGORIES.NO_TAX
          ].includes(data.tax_category)) {
            errorSkus.push({
              index: allData.indexOf(data) + 1,
              sku: data.sku,
              reason: "Incorrect Tax Category",
            });
            continue;
          }

          let check_repeat = await Product.find({
            sku: data.sku,
            location_id: data.location_id,
          });
          if (check_repeat && check_repeat.length > 0) {
            repetitiveSkus.push({
              index: allData.indexOf(data) + 1,
              sku: data.sku,
              reason: "SKU Already Exists",
            });
            continue;
          }

          if (!data.barcode)
            data.barcode =
              "HYPR" + Math.floor(100000000 + Math.random() * 900000000);

          if (!data.category_id) {
            /* NOTE: for category name flow, can be made more moduler later */
            /* NOTE: assuming that [0] will always have L1 and then there can be multiple L2 */
            if (!data.category_name || !data.category_name.trim()) {
              errorSkus.push({
                index: allData.indexOf(data) + 1,
                sku: data.sku,
                reason:
                  "No category-id/category-name is assigned to this product",
              });
              continue;
            }
            sails.log.info(
              `ReqID: ${req.id}, userID: ${JSON.stringify(
                res.locals.userData
              )}, context: ${req.url}, : Found category`
            );
            data.categories = [];
            let multipleCategories = data.category_name.split(";");
            var categoryIds = [];

            for (let categories of multipleCategories) {
              try {
                let toSentCategories = categories.split("-");
                let categoryResp = await ProductService.findOrCreateCategoryAndSubCategory(
                  toSentCategories,
                  data.location_id
                );
                categoryResp.forEach(async (ID) => {
                  categoryIds.push(ID);
                  data.categories.push({
                    id: ID,
                    product_priority: "maxPriority",
                  });
                });
              } catch (err) {
                let reason = "Category Creation Error";
                errorSkus.push({
                  index: allData.indexOf(data) + 1,
                  sku: data.sku,
                  reason: reason,
                });
              }
            }
            data.category_id = categoryIds;
            sails.log.info(
              `ReqID: ${req.id}, userID: ${JSON.stringify(
                res.locals.userData
              )}, context: ${req.url}, Category IDs: ${categoryIds}`
            );
          }
          try {
            imageUrl = data.image_url;
            if (imageUrl) {
              let fileContent = await http.get(imageUrl, {
                responseType: "arraybuffer",
              });
              let fileName = uuid4();
              let ext = fileContent.headers["content-type"].split("/")[1];
              fileName += `.${ext}`;
              await S3Service.uploadImage(fileContent.data, fileName);
              fileName = `https://${sails.config.globalConf.AWS_BUCKET}.s3.${sails.config.globalConf.AWS_REGION}.amazonaws.com/${fileName}`;
              sails.log(`s3 image: ${fileName}`);
              data.image_url = fileName;
            }
          } catch (err) {
            console.log("Image upload error", err);
            data.image_url = "";
          }

          if (typeof data.category_id === "string") {
            data.category_id = data.category_id.split(",");
          }
          data.category_id = (typeof data.category_id === 'string' || typeof data.category_id === 'number') ? [data.category_id] : data.category_id;
          let result = await ProductService.checkCategoriesAgainstLocation(
            data.category_id,
            parseInt(data.location_id)
          );
          if (result.success) {
            let productToCreate = await ProductService.buildProductForCreation(
              data,
              bulk,
              user_id,
              req.param("file_url")
            );
            sails.log.info(
              `ReqID: ${req.id}, userID: ${JSON.stringify(
                res.locals.userData
              )}, context: ${req.url}, About to call createProduct()`
            );
            let product = await ProductService.createProduct(productToCreate, user_id);
            if (product.success) {
              createdSkus.push(data.name + " " + data.size + " " + data.brand);
              /* NOTE: shouldn't be here
              let sendProductstoEs = await ProductService.fetchAndAddToEs(
                data.location_id
              );
              console.log(sendProductstoEs);
              */
            } else {
              errorSkus.push({
                index: allData.indexOf(data) + 1,
                reason: "Could Not Create",
              });
            }
          } else {
            let reason = result.message
              ? result.message
              : "Wrong Location Category";
            errorSkus.push({
              index: allData.indexOf(data) + 1,
              sku: data.sku,
              reason: reason,
            });
          }
        } catch (err) {
          console.log(err);
        }
      }

      var html = "";
      if (repetitiveSkus.length > 0) {
        var str = "";
        html +=
          "<h2>Repeating SKUS</h2><table><tr><th>Index</th><th>SKU</th><th>Reason</th></tr>";
        for (var row of repetitiveSkus) {
          str +=
            "<tr><td>" +
            row.index +
            "</td>" +
            "<td>" +
            row.sku +
            "</td>" +
            "<td>" +
            row.reason +
            "</td></tr>";
        }
        html += str + "</table>";
      }
      if (errorSkus.length > 0) {
        html +=
          "<h2>Error SKUS</h2><table><tr><th>Index</th><th>SKU</th><th>Reason</th></tr>";
        var str = "";
        for (var row of errorSkus) {
          str +=
            "<tr><td>" +
            row.index +
            "</td>" +
            "<td>" +
            row.sku +
            "</td>" +
            "<td>" +
            row.reason +
            "</td></tr>";
        }
        html += str + "</table>";
      }
      if (createdSkus.length > 0) {
        var str = "";
        for (var sku of createdSkus) {
          str = str + sku + "<br>";
        }
        html += "<h3>Created SKUS</h3>";
        html += "<p>" + str + "<p>";
      }
      html += "<h3>Summary</h3>";
      html += "<p>" + "Created SKUS: " + createdSkus.length + "</p>";
      html += "<p>" + "Error SKUS: " + errorSkus.length + "</p>";
      html += "<p>" + "Repeating SKUS: " + repetitiveSkus.length + "</p>";
      let userData = res.locals.userData;
      let user = await AuthStoreService.populateHierarchyAccess(userData);
      let recipients = await UtilService.getAccountEmails(user);
      if (res.locals.userData.email && res.locals.userData.email != "")
        recipients.push(res.locals.userData.email);
      // MailerService.sendMailThroughAmazon({
      //   email: recipients,
      //   htmlpart: html,
      //   subject: "HYPR Product On Boarding Report - " + new Date(),
      //   destination: "operations@hypr.pk",
      // });
      sails.log.info(`Created SKUs: ${JSON.stringify(createdSkus)}`);
      sails.log.info(`Repeted SKUs: ${JSON.stringify(repetitiveSkus)}`);
      sails.log.info(`Error SKUs: ${JSON.stringify(errorSkus)}`);
    });
  },

  updateProducts: async function (req, res, next) {
    sails.log.info(
      `starting product bulk update. user_id: ${req.param("user_id")}`
    );
    res.ok();
    const { user: { id, role } } = req;
    var s3Options = { Bucket: sails.config.globalConf.AWS_BUCKET, Key: req.param("file_name") };
    const stream = s3.getObject(s3Options).createReadStream();
    var fileBuffers = [],
      updatedSkus = [],
      errorSkus = [];
    stream.on("data", async (data) => {
      fileBuffers.push(data);
    });
    stream.on("end", async () => {
      let workbook = xlsx.read(Buffer.concat(fileBuffers));
      let sheet_name_list = workbook.SheetNames;
      let allData = xlsx.utils.sheet_to_json(
        workbook.Sheets[sheet_name_list[0]]
      );
      for (let data of allData) {
        try {
          let errorSku = false;
          let reason = "";
          if (
            !AuthStoreService.verify_user_access(
              { location_id: parseInt(data.location_id) },
              res.locals.userData
            )
          ) {
            errorSku = true;
            reason = reason ? reason : "Location Not Permitted";
          }

          if (!data.location_id) {
            errorSku = true;
            reason = reason ? reason : "No Location";
          }

          if (!data.sku) {
            errorSku = true;
            reason = reason ? reason : "No SKU";
          }
          data.tax_category = +data.tax_category
          if (![
            Constants.TAX_CATEGORIES.TAX_ON_PRICE,
            Constants.TAX_CATEGORIES.TAX_ON_MRP,
            Constants.TAX_CATEGORIES.NO_TAX
          ].includes(data.tax_category)) {
            errorSku = true;
            reason = reason ? reason : "Incorrect Tax Categry";
          }

          if (!data.barcode && !errorSku)
            data.barcode =
              "HYPR" + Math.floor(100000000 + Math.random() * 900000000);

          data.configurable = data.configurable
            ? parseInt(data.configurable)
            : 0;
          data.disabled = data.disabled ? parseInt(data.disabled) : 0;
          data.consent_required = data.consent_required
            ? parseInt(data.consent_required)
            : 0;
          data.tax_inclusive = data.tax_inclusive
            ? parseInt(data.tax_inclusive)
            : 0;
          if (data.delivery_time) {
            if (["null", "NULL", "Null"].includes(data.delivery_time)) data.delivery_time = null;
            else if (data.delivery_time > 168) data.delivery_time = 168;
            else if (data.delivery_time < 6) data.delivery_time = 6;
          }
          var product = {};
          if (!errorSku) {
            product = await Product.findOne({
              sku: data.sku,
              location_id: parseInt(data.location_id),
            });
          }

          if (product && !errorSku) {
            try {
              let updateReason = "Bulk Update Products";
              await ProductService.updateProductWithHistory({
                old_product: product,
                new_product_data: data,
                source: req.param("file_name"),
                user_id: res.locals.userData.id,
                reason: updateReason,
                location_id: parseInt(data.location_id),
                category_names: data.category_name,
              }, role, product.location_id);
              updatedSkus.push({
                index: allData.indexOf(data) + 1,
                sku: data.sku,
              });
            } catch (err) {
              errorSku = true;
              reason = reason ? reason : "category/product update error";
            }
            let result = await ProductService.updateProductInEs(product.id);
            result.success
              ? sails.log.info("SUCCESSFULLY UPDATED PRODUCT IN ES")
              : sails.log.info(result.trace);
          } else {
            errorSku = true;
            reason = reason ? reason : "Product not found";
          }
          if (errorSku) {
            errorSkus.push({
              index: allData.indexOf(data) + 1,
              sku: data.sku,
              reason: reason,
            });
          }
        } catch (err) {
          console.log(err);
        }
      }
      var html = "";
      if (errorSkus.length > 0) {
        html +=
          "<h2>Error SKUS</h2><table><tr><th>Index</th><th>SKU</th><th>Reason</th></tr>";
        var str = "";
        for (var row of errorSkus) {
          str +=
            "<tr><td>" +
            row.index +
            "</td>" +
            "<td>" +
            row.sku +
            "</td>" +
            "<td>" +
            row.reason +
            "</td></tr>";
        }
        html += str + "</table>";
      } else {
        html = "<h2>All products updated successfully!<h2>";
      }
      let user = await AuthStoreService.populateHierarchyAccess(
        res.locals.userData
      );
      let recipients = await UtilService.getAccountEmails(user);
      if (res.locals.userData.email && res.locals.userData.email != "")
        recipients.push(res.locals.userData.email);
      // MailerService.sendMailThroughAmazon({
      //   email: recipients,
      //   htmlpart: html,
      //   subject: "HYPR Bulk Product Update Report - " + new Date(),
      //   destination: "operations@hypr.pk",
      // });
      sails.log.info(`Updated SKUs:  ${JSON.stringify(updatedSkus)}`);
      sails.log.info(`Error SKUs:  ${JSON.stringify(errorSkus)}`);
    });
  },

  updateMultipleLocationPrices: async function (req, res, next) {
    sails.log.info(
      `starting product bulk update price/stock/availability. user_id: ${req.param(
        "user_id"
      )}`
    );
    let errorSkus = [];
    let allCSVData = [];
    res.ok();
    const { user: { id, role } } = req;
    var s3Options = { Bucket: sails.config.globalConf.AWS_BUCKET, Key: req.param("file_name") };
    const stream = s3.getObject(s3Options).createReadStream();
    let i = 0;
    stream.pipe(
      csv()
        .on("data", async (data) => {
          // to skip header in file
          if (!i) {
            i++;
          } else {
            allCSVData.push(data);
          }
        })
        .on("end", function () {
          i = 1;
          async.eachSeries(
            allCSVData,
            async (data, callback) => {
              var location = parseInt(data[4]);
              if (
                AuthStoreService.verify_user_access(
                  { location_id: location },
                  res.locals.userData
                )
              ) {
                try {

                  let product_criteria = {
                    sku: data[0],
                    location_id: location,
                  };
                  const isVbp = data[7];
                  let product = await Product.findOne(product_criteria);
                  let updateObj = {
                    price: data[1] != "" ? parseFloat(data[1]) : product.price,
                    stock_quantity:
                      data[2] != ""
                        ? parseInt(data[2])
                        : product.stock_quantity,
                    disabled: data[3] != "" ? parseInt(data[3]) : 0,
                    is_volume_based_price_enabled: (isVbp !=  "") ? parseInt(isVbp): 0,
                    volume_based_prices: readVbpBulkUpdateCsv(data),
                    tags: [],
                    removed_tags: [],
                  };
                  if (product) {
                    let updateReason =
                      "bulk products update Price/Availability/Stock from admin portal";
                    await ProductService.updateProductWithHistory({
                      old_product: product,
                      new_product_data: updateObj,
                      source: req.param("file_url"),
                      user_id: res.locals.userData.id,
                      reason: updateReason,
                      csv_vbp: true,
                    }, role, product.location_id);
                    let result = await ProductService.updateProductInEs(
                      product.id
                    );
                    result.success
                      ? console.log("SUCCESSFULLY UPDATED PRODUCT IN ES")
                      : console.log(
                        "ERROR OCCURRED WHILE UPDATING PRODUCT IN ES - ",
                        product.id
                      );
                    callback();
                  } else {
                    errorSkus.push({
                      index: i,
                      sku: data[0],
                      reason: "Product not found",
                    });
                    callback();
                  }
                  console.log("done " + i);
                } catch (err) {
                  callback(err);
                }
              } else {
                errorSkus.push({
                  index: i,
                  sku: data[0],
                  reason: "invalid location id",
                });
                callback();
              }
              i++;
            },
            async () => {
              console.log("DONE!!!!!!!. errorSkus" + JSON.stringify(errorSkus));
              var html = "";
              if (errorSkus.length > 0) {
                html +=
                  "<h2>Error SKUS</h2><table><tr><th>Index</th><th>SKU</th><th>Reason</th></tr>";
                var str = "";
                for (var row of errorSkus) {
                  str +=
                    "<tr><td>" +
                    row.index +
                    "</td>" +
                    "<td>" +
                    row.sku +
                    "</td>" +
                    "<td>" +
                    row.reason +
                    "</td></tr>";
                }
                html += str + "</table>";
              } else {
                html = "<h2>All products updated successfully!<h2>";
              }
              let user = await AuthStoreService.populateHierarchyAccess(
                res.locals.userData
              );
              let recipients = await UtilService.getAccountEmails(user);
              if (res.locals.userData.email && res.locals.userData.email != "")
                recipients.push(res.locals.userData.email);
              // MailerService.sendMailThroughAmazon({
              //   email: recipients,
              //   htmlpart: html,
              //   subject:
              //     "HYPR Bulk Product Price/Stock/Availibility Update Report - " +
              //     new Date(),
              //   destination: "operations@hypr.pk",
              // });
            }
          );
        })
    );
  },
  bulkUpdateSkuDeactivation: async function (req, res, next) {
    const logIdentifier = `context:ProductController.bulkUpdateSkuDeactivation`;
    const { user: { id, role } } = req;
    const source = req.param("file_url");

    sails.log.info(
      `context: bulkUpdateSkuDeactivation - starting product bulk update deactivation. user_id: ${id}`,
    );

    let allCSVData = [];
    const errorSkus = [];

    try {
      try {
        const _buff = await readCSV(req.param("file_name"), s3);

        allCSVData = convertCsvBufferToJson(_buff);
        sails.log.info(`${logIdentifier}, Convert CSV to JSON object: ${JSON.stringify(allCSVData)}`);
      } catch (e) {
        sails.log.error(`${logIdentifier}, Error occured while processing CSV: ${e.message}`);
        throw new Error(e.message);
      }


      if (allCSVData.length) {
        const skuDeactivationReasons = await skuDeactivationReasonService.getSkuDeactivationReason({});
        const productFindPromises = [];
        const productUpdatePromises = [];
        const skuDeactivationPromises = [];
        const updateProductEspromises = [];
        allCSVData.forEach(csvRow => {
          const sku = csvRow.sku.trim();

          const location = parseInt(csvRow.location);
          if (
            AuthStoreService.verify_user_access(
              { location_id: location },
              res.locals.userData,
            )
          ) {
            const criteria = { sku: sku, location_id: location };
            productFindPromises.push(Product.findOne(criteria));
          }
        });
        let foundProducts = [];
        try{
          foundProducts = await Promise.all(productFindPromises);
        }catch(e) {
          sails.log(`${logIdentifier}: Error occured while finding the products ${e.message}`);
          throw new Error(e.message);
        }
        if(foundProducts.length) {
          allCSVData.forEach(csvRow => {
            let product = foundProducts.find(item => item.sku === csvRow.sku.trim());
            if(product) {
              product = JSON.parse(JSON.stringify(product));
              const isDeactivated = parseInt(csvRow.deactivation);
              const reasonSlug = csvRow.reason;
              const reason = skuDeactivationReasons
                .find(skuDeactivationReason => skuDeactivationReason.slug === reasonSlug);
              if(reason) {
                if(isDeactivated) {
                  const historyData = {
                    product_id: product.id,
                    old_JSON: JSON.stringify(product),
                    new_JSON: JSON.stringify(product),
                    source: source || "",
                    updated_by: id,
                    reason: reason.reason,
                  };
                  productUpdatePromises.push(ProductAuditHistory.create(historyData));

                  skuDeactivationPromises.push(skuDeactivationReasonJunctionService.createSkuDeactivationRecord({
                    productId: product.id, reason: reason.reason, isDeactivated: isDeactivated, userId: id,
                  }));
                  updateProductEspromises.push(ProductService.updateProductInEs(product.id));
                }else{
                  errorSkus.push(`This API can only deactivate SKUs: ${csvRow.sku}, deactavtion flag must be 1`);
                }
              }else{
                errorSkus.push(`Invalid reason ${csvRow.reason}`);
              }
            }else{
              errorSkus.push(`SKU not found ${csvRow.sku}`);
            }
          });


          try{
            await Promise.all(productUpdatePromises);
          }catch(e) {
            sails.log(`${logIdentifier}: Error occured while updating the products history ${e.message}`);
            throw new Error(e.message);
          }

          try{
            await Promise.all(skuDeactivationPromises);
          }catch(e) {
            sails.log(`${logIdentifier}: Error occured while deactivating the products ${e.message}`);
            throw new Error(e.message);
          }

          try{
            await Promise.all(updateProductEspromises);
          }catch(e) {
            sails.log(`${logIdentifier}: Error occured while updating the products in ES ${e.message}`);
            throw new Error(e.message);
          }
          return res.send({
            totalProcessedRecords: foundProducts.length,
            message: "Records have been processed successfully!",
            totalFailedRecords: allCSVData.length - foundProducts.length,
            errors: {
              totalCount: errorSkus.length,
              errorSkus,
            },
          });
        }
        const error = new Error("No matching records found in system");
        error.statusCode = 400;
        throw error;
      } else {
        const error = new Error("No data found in csv");
        error.statusCode = 400;
        throw error;
      }
    } catch (error) {
      res.error(error);
    }
  },
  // [REVISIT REQUIRED]: needs to be revisited for query optimization
  getAllProducts: async function (req, res, next) {
    let params = req.allParams();
    var page = req.param("page");
    var per_page = req.param("per_page");
    var sortBy = req.param("sortBy");
    var sortOrder = req.param("sortOrder");
    var searchOnAttributes = req.param("searchOnAttributes") || "";
    var pricingTypes = req.param("pricingTypes");
    pricingTypes = pricingTypes ? pricingTypes.split(',') : "";
    searchOnAttributes = searchOnAttributes ? searchOnAttributes.split(',') : "";
    const searchProductsInCategory = !GeneralHelper.emptyOrAllParam(params.category_id, true);

    var query = "select distinct products.*";
    let count_query = "select count(distinct products.id) as productCount";
    let common_query = " from products";

    if (searchProductsInCategory) {
      common_query +=
        " inner join product_categories_junction on product_categories_junction.product_id = products.id";
      if (!params.isAdmin) {
        common_query +=
          "  inner join categories on product_categories_junction.category_id = categories.id and categories.disabled_at is null";
      }
      common_query +=
        " and product_categories_junction.category_id = " +
        params.category_id +
        " ";
    }
    if (params.location_id) {
      common_query += ` ${searchProductsInCategory ? "and" : "where"} products.location_id in (${params.location_id})`;
    }

    if (searchOnAttributes.length && params.search && params.search != "") {
      if (searchOnAttributes.includes(PRODUCT_SEARCH_ATTRIBUTES.NAME)) {
        common_query += " and (products.name LIKE '%" + params.search + "%'";
        common_query += " or products.urdu_name LIKE '%" + params.search + "%')";
      }
      if (searchOnAttributes.includes(PRODUCT_SEARCH_ATTRIBUTES.BRAND)) {
        common_query += " and (products.brand LIKE '%" + params.search + "%'";
        common_query += " or products.urdu_brand LIKE '%" + params.search + "%')";
      }
      if (searchOnAttributes.includes(PRODUCT_SEARCH_ATTRIBUTES.SKU)) {
        common_query += " and products.sku LIKE '%" + params.search + "%'";
      }
    }
    else if (params.search && params.search != "") {
      common_query += " and (products.name LIKE '%" + params.search + "%'";
      common_query += " or products.brand LIKE '%" + params.search + "%'";
      common_query += " or products.barcode LIKE '%" + params.search + "%'";
      common_query += " or products.urdu_name LIKE '%" + params.search + "%'";
      common_query += " or products.sku LIKE '%" + params.search + "%'";
      common_query += " or products.urdu_brand LIKE '%" + params.search + "%')";
    }

    if (!GeneralHelper.emptyOrAllParam(params.disabled)) {
      common_query += " and products.disabled = " + params.disabled;
    }

    if (pricingTypes.includes(PRICING_TYPES.DYNAMIC_PRICE) && !pricingTypes.includes(PRICING_TYPES.VBP_PRICE)) {
      common_query += " and products.is_dynamic_price_enabled = 1";
    }
    if (pricingTypes.includes(PRICING_TYPES.VBP_PRICE) && !pricingTypes.includes(PRICING_TYPES.DYNAMIC_PRICE)) {
      common_query += " and products.is_volume_based_price_enabled = 1";
    }
    if (pricingTypes.includes(PRICING_TYPES.VBP_PRICE) && pricingTypes.includes(PRICING_TYPES.DYNAMIC_PRICE)) {
      common_query += " and (products.is_volume_based_price_enabled = 1  or products.is_dynamic_price_enabled = 1)";
    }

    common_query += " and products.deleted_at is null";
    count_query += common_query;
    query += common_query;
    query += " group by products.id";
    if (sortBy && sortOrder) {
      query += " order by products." + sortBy + " " + sortOrder;
    } else {
      query += " order by products.id desc";
    }
    if (per_page) {
      query += " LIMIT " + per_page;
    }
    if (page && page > 0) {
      query += " OFFSET " + (page - 1) * params.per_page;
    }
    let totalCount = 0;
    try {
      totalCount = await sails.sendNativeQuery(count_query);
      let result = await sails.sendNativeQuery(query);
      if (result.rows && result.rows.length > 0) {
        let product_ids = result.rows.map(function (prod) {
          return prod.id;
        });
        let category_query =
          "select categories.*, product_categories_junction.id as pjc_id, product_categories_junction.product_id as pjc_product_id, product_categories_junction.product_priority as product_priority, (select max(product_priority) from product_categories_junction where category_id = categories.id) as product_max_priority";
        category_query +=
          " from categories inner join product_categories_junction on product_categories_junction.category_id = categories.id";
        category_query +=
          " and product_categories_junction.product_id in (" +
          product_ids +
          ")";
        let categories = await sails.sendNativeQuery(category_query);
        let categories_map = {};
        categories.rows.forEach(function (cat) {
          if (categories_map[cat.pjc_product_id]) {
            categories_map[cat.pjc_product_id].push({
              id: cat.pjc_product_id,
              category_id: _.omit(cat, [
                "pjc_id",
                "pjc_product_id",
                "product_priority",
                "product_max_priority",
              ]),
              product_id: cat.pjc_product_id,
              product_priority: cat.product_priority,
              product_max_priority: cat.product_max_priority,
            });
          } else {
            categories_map[cat.pjc_product_id] = [
              {
                id: cat.pjc_product_id,
                category_id: _.omit(cat, [
                  "pjc_id",
                  "pjc_product_id",
                  "product_priority",
                  "product_max_priority",
                ]),
                product_id: cat.pjc_product_id,
                product_priority: cat.product_priority,
                product_max_priority: cat.product_max_priority,
              },
            ];
          }
        });
        result.rows.forEach(function (prod) {
          prod.active_categories = _.cloneDeep(categories_map[prod.id]);
        });
      }
      await ProductService.populateProductTags(result.rows);
      await ProductService.populateLanguages(result.rows);
      await ProductService.populateVolumeBasedProductPrice(result.rows);
      await ProductService.populateSkuDeactivationReason(result.rows);
      res.ok({
        products: result.rows,
        totalCount:
          totalCount.rows && totalCount.rows.length > 0
            ? totalCount.rows[0].productCount
            : 0,
      });
    } catch (err) {
      res.serverError(err);
    }
  },
  getProductDump: async (req, res, next) => {
    await sails.getDatastore("readReplica").transaction(async (db) => {
      const params = req.allParams();
      let totalProducts = await Product.count({
        location_id: params.location_id,
      }).usingConnection(db);
      var productDump = [];
      let i = 1;
      let loc_name = "";
      let comp_name = "";
      if (totalProducts) {
        let query = `SELECT products.*, locations.name as loc_name, companies.name as comp_name
        from products inner join locations on products.location_id = locations.id
        inner join companies on locations.company_id = companies.id where location_id = $1`;
        let products = await sails.sendNativeQuery(query, [params.location_id]).usingConnection(db);
        products = products.rows;
        var productsExcel = [];
        var csv =
          "name,size,brand,price,category_id,configurable,unit,disabled,mrp,cost_price,trade_price,barcode,stock_quantity,location_id,sku,description,tax_percent,tax_inclusive,tax_category,consent_required,category_name,image_url";
        async.each(
          products,
          async (product, _callback) => {
            if (params.file_type === "csv") {
              var productsCSV;
              productsCSV = [
                product.name ? '"' + product.name + '"' : "",
                product.size ? '"' + product.size + '"' : "",
                product.brand ? '"' + product.brand + '"' : "",
                product.price,
                product.category_id ? product.category_id : null,
                product.configurable ? product.configurable : 0,
                product.unit,
                product.disabled ? product.disabled : 0,
                product.mrp,
                product.cost_price,
                product.trade_price ? product.trade_price : null,
                product.barcode,
                product.stock_quantity,
                product.location_id,
                product.sku,
                product.description ? '"' + product.description + '"' : "",
                product.tax_percent,
                product.tax_inclusive,
                product.tax_category,
                product.consent_required,
                "",
                product.image_url ? product.image_url : "",
              ];
            } else {
              productsExcel.push({
                name: product.name ? product.name : "",
                size: product.size ? product.size : "",
                brand: product.brand ? product.brand : "",
                price: product.price,
                category_id: product.category_id ? product.category_id : null,
                configurable: product.configurable ? product.configurable : 0,
                unit: product.unit,
                disabled: product.disabled ? product.disabled : 0,
                mrp: product.mrp,
                cost_price: product.cost_price,
                trade_price: product.trade_price ? product.trade_price : null,
                barcode: product.barcode,
                stock_quantity: product.stock_quantity,
                location_id: product.location_id,
                sku: product.sku,
                description: product.description ? product.description : "",
                tax_percent: product.tax_percent,
                tax_inclusive: product.tax_inclusive,
                tax_category: product.tax_category,
                consent_required: product.consent_required,
                category_name: "",
                image_url: product.image_url ? product.image_url : "",
              });
            }
            /* NOTE: ingesting category names */

            let categoryIds = await ProductCategoriesJunction.find({
              product_id: product.id,
            }).usingConnection(db);
            var l1s = [];
            var l2s = [];
            var categoryName = "";
            async.eachSeries(
              categoryIds,
              async function (catID, callback) {
                try {
                  let category = await Categories.findOne({
                    id: catID.category_id,
                  }).usingConnection(db);
                  if (category) {
                    if (!category.parent) {
                      l1s.push({
                        id: category.id,
                        isL1: true,
                        name: category.name,
                        parent: null,
                      });
                      callback();
                    } else {
                      l2s.push({
                        id: category.id,
                        isL1: false,
                        name: category.name,
                        parent: category.parent,
                      });
                      callback();
                    }
                  } else callback()
                } catch (err) {
                  callback(err);
                }
              },
              function (err, result) {
                if (err) _callback(err);
                else {
                  var firstOneProcessed = false;
                  l1s.forEach((l1) => {
                    let subCats = l2s.filter((l2) => l2.parent == l1.id);
                    l1.subCats = subCats;

                    if (!firstOneProcessed) {
                      categoryName = categoryName + l1.name;
                      l1.subCats.forEach((l2) => {
                        categoryName = categoryName + "-" + l2.name;
                      });
                      firstOneProcessed = true;
                    } else {
                      categoryName = categoryName + ";" + l1.name;
                      l1.subCats.forEach((l2) => {
                        categoryName = categoryName + "-" + l2.name;
                      });
                    }
                  });
                  if (params.file_type === "excel") {
                    productsExcel[
                      products.indexOf(product)
                    ].category_name = categoryName;
                    _callback();
                  }
                  if (params.file_type === "csv") {
                    productsCSV[20] = '"' + categoryName + '"';
                    csv += "\n";
                    csv += productsCSV.join(",");
                    _callback();
                  }
                }
              }
            );
          },
          (err, result) => {
            if (err) return res.serverError(err);
            var amazonfileName = new Date() + "product-dump";
            amazonfileName = amazonfileName.replace(/[^a-zA-Z0-9]/g, "-");
            if (params.file_type === "excel") {
              amazonfileName = amazonfileName + ".xlsx";
              const wb = xlsx.utils.book_new();
              wb.SheetNames.push("Products");
              const header_order = [
                "name",
                "size",
                "brand",
                "price",
                "category_id",
                "configurable",
                "unit",
                "disabled",
                "mrp",
                "cost_price",
                "trade_price",
                "barcode",
                "stock_quantity",
                "location_id",
                "sku",
                "description",
                "tax_percent",
                "tax_inclusive",
                "tax_category",
                "consent_required",
                "category_name",
                "image_url",
              ];
              const ws = xlsx.utils.json_to_sheet(productsExcel, {
                header: header_order,
              });
              col_width_arr = [];
              for (let i = 0; i < 24; i++) {
                col_width_arr.push({ width: 12 });
              }
              ws["!cols"] = col_width_arr;
              ws.A1.v = "name";
              ws.B1.v = "size";
              ws.C1.v = "brand";
              ws.D1.v = "price";
              ws.E1.v = "category_id";
              ws.F1.v = "configurable";
              ws.G1.v = "unit";
              ws.H1.v = "disabled";
              ws.I1.v = "mrp";
              ws.J1.v = "cost_price";
              ws.K1.v = "trade_price";
              ws.L1.v = "barcode";
              ws.M1.v = "stock_quantity";
              ws.N1.v = "location_id";
              ws.O1.v = "sku";
              ws.P1.v = "description";
              ws.Q1.v = "tax_percent";
              ws.R1.v = "tax_inclusive";
              ws.S1.v = "tax_category";
              ws.T1.v = "consent_required";
              ws.U1.v = "category_name";
              ws.V1.v = "image_url";
              wb.Sheets.Products = ws;
              const wbOut = xlsx.write(wb, {
                bookType: "xlsx",
                type: "buffer",
              });
              console.log("CALLING EXCEL PARAMS");
              var file_params = {
                Bucket: sails.config.globalConf.AWS_BUCKET,
                Key: amazonfileName,
                ACL: "public-read",
                Body: wbOut,
                ContentType:
                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                CacheControl: "public",
              };
            } else {
              console.log("CALLING CSV PARAMS");
              amazonfileName = amazonfileName + ".csv";
              var file_params = {
                Bucket: sails.config.globalConf.AWS_BUCKET,
                Key: amazonfileName,
                Body: csv,
                ContentType: "application/octet-stream",
                CacheControl: "public",
              };
            }
            var s3 = new AWS.S3();
            s3.putObject(file_params, async function (err, data) {
              if (err) {
                console.log("Error at uploadCSVFileOnS3Bucket function", err);
              } else {
                console.log("File uploaded Successfully");
                let user = await AuthStoreService.populateHierarchyAccess(
                  res.locals.userData
                );
                let recipients = await UtilService.getAccountEmails(user);
                if (res.locals.userData.email && res.locals.userData.email != "") {
                  recipients.push(res.locals.userData.email);
                }
                let fileUrl = `https://${sails.config.globalConf.AWS_BUCKET}.s3.${sails.config.globalConf.AWS_REGION}.amazonaws.com/${amazonfileName}`;
                // MailerService.sendMailThroughAmazon({
                //   email: recipients,
                //   htmlpart: fileUrl,
                //   subject:
                //     comp_name +
                //     " " +
                //     loc_name +
                //     " Product Dump Report - " +
                //     new Date(),
                //   destination: "operations@hypr.pk",
                // });
                res.ok(fileUrl);
              }
            });
          }
        );
      } else {
        res.ok([], { message: "no products found" });
      }
    });
  },
  /* Deep linking urls dump for chaseup app */
  getProductDumpByLocation: async function (req, res, next) {
    const params = req.allParams();
    ProductService.createProductDeepLinks(params.code);
  },

  // Reset products priority
  resetAllCategoryProductsPriorityByLocation: async function (req, res, next) {
    sails.log.error('Legacy API, unused routes called with heaeders :'
      , JSON.stringify(req.headers), '\n params :', JSON.stringify(req.allParams()));
    return res.notFound('Legacy API, unused routes');
    try {
      var params = req.allParams();
      sails.log.info(
        `reqID: ${params.reqID}, userID: ${res.locals.userData.id}, context: ${req.url
        }, In resetAllCategoryProductsPriorityByLocation(), params: ${JSON.stringify(
          params
        )}`
      );

      let categories = [];
      if (req.body.categoryLevel === Constants.CATEGORY_LEVEL.SUBCATEGORY && params.locationId) {
        categories = await Categories.find({
          parent: { "!=": null },
          disabled_at: null,
          location_id: params.locationId,
        });

        sails.log(
          `reqID: ${params.reqID}, userID: ${res.locals.userData.id
          }, context: ${req.url
          }, getAllSubCategoriesByLocation query response: ${JSON.stringify(
            categories
          )}, count: ${categories.length}`
        );
      } else if (req.body.categoryLevel === Constants.CATEGORY_LEVEL.PARENT_CATEGORY && params.locationId) {
        categories = await Categories.find({
          parent: null,
          disabled_at: null,
          location_id: params.locationId,
        });
        sails.log(
          `reqID: ${params.reqID}, userID: ${res.locals.userData.id
          }, context: ${req.url
          }, getAllParentCategoriesByLocation query response: ${JSON.stringify(
            categories
          )}, count: ${categories.length}`
        );
      }
      else {
        sails.log.info(
          `reqID: ${params.reqID}, userID: ${res.locals.userData.id}, context: ${req.url}, Your request could not be processed, Please specify correct category level in the params !!`
        );
        res.badRequest("Your request could not be processed, Please specify correct category level in the params !!");
        return;
      }
      try {
        for (const cat of categories) {
          await ProductService.resetCategoryProductsPriorityByCategory(
            cat.id
          );
          sails.log(
            `Product priorities in category: ${cat.id} have been updated`
          );
        }
      } catch (err) {
        sails.log.error(
          `reqID: ${params.reqID}, userID: ${res.locals.userData.id
          }, context: ${req.url
          }, Error while iterating over categories to initialize product priority -> ${JSON.stringify(
            err.stack
          )}`
        );
        throw err;
      }
      sails.log.info(
        `reqID: ${params.reqID}, userID: ${res.locals.userData.id}, context: ${req.url}, Product Priorities initialized, Leaving resetCategoryProductsPriority()`
      );
      res.ok("Product priority in all categories has been initialized");
    } catch (err) {
      sails.log.error(
        `reqID: ${params.reqID}, userID: ${res.locals.userData.id}, context: ${req.url
        }, Error: ${JSON.stringify(err.stack)}`
      );
      return res.serverError(err);
    }
  },

  // Reset products priority
  resetCategoryProductsPriorityByCategory: async function (req, res, next) {
    sails.log.error('Legacy API, unused routes called with heaeders :'
      , JSON.stringify(req.headers), '\n params :', JSON.stringify(req.allParams()));
    return res.notFound('Legacy API, unused routes');
    try {
      var params = req.allParams();
      sails.log.info(
        `reqID: ${params.reqID}, userID: ${res.locals.userData.id}, context: ${req.url
        }, In resetCategoryProductsPriority(), params: ${JSON.stringify(
          params
        )}`
      );

      if (params.category_id) {
        await ProductService.resetCategoryProductsPriorityByCategory(
          params.category_id
        );
        sails.log.info(
          `reqID: ${params.reqID}, userID: ${res.locals.userData.id}, context: ${req.url}, Product Priorities initialized, Leaving resetCategoryProductsPriority()`
        );
        res.ok(
          `Product priorities in category: ${params.category_id} have been updated `
        );
      } else {
        sails.log.warn(
          `reqID: ${params.reqID}, userID: ${res.locals.userData.id}, context: ${req.url}, No category supplied in params`
        );
        res.badRequest("No category supplied in params !!");
      }
    } catch (err) {
      sails.log.error(
        `reqID: ${params.reqID}, userID: ${res.locals.userData.id}, context: ${req.url
        }, Error: ${JSON.stringify(err.stack)}`
      );
      return res.serverError(err);
    }
  },

  bulkUpdateProductPriorities: async function (req, res, next) {
    const logIdentifier = `API version: v0, Context: ProductController.bulkUpdateProductPriorities()`;
    sails.log.info(
      `${logIdentifier}, Starting bulk updating product priorities for categories and sub-categories, UserId: ${req.param("user_id")}`
    );
    const userId = req.param("user_id");
    const fileName = req.param("file_name");
    sails.log.info(`${logIdentifier}, Reading stream to buffer from csv`);
    let data = [];
    try {
      const _buff = await readCSV(fileName, s3);
      data = convertCsvBufferToJson(_buff);
      sails.log.info(`${logIdentifier}, Convert CSV to JSON object: ${JSON.stringify(data)}`)
    } catch (e) {
      sails.log.error(`${logIdentifier}, Error occured while processing CSV: ${e.message}`)
      res.serverError(`Error occured while processing CSV: ${e.message}`)
    }
    const validationData = validateMissingPriorityData(data);
    if (validationData.failure) {
      return res.serverError(`Error Message: ${validationData.reason} is/are missing for an SKU/SKUs in the file`);
    }
    const validatedIds = validatePriorityDataIds(data);
    if (validatedIds.failure) {
      return res.serverError(`Error Message: ${validatedIds.reason} is not a valid id, ids must be numeric`);
    }
    const validationPriority = validatePriorities(data);
    if (validationPriority.failure) {
      return res.serverError(`Error Message: ${validationPriority.reason} is not a valid priority, priority must be greater than zero`);
    }
    const isDuplicateData = ProductService.isDuplicatePriorityData(data);
    sails.log.info(`${logIdentifier}, Check for duplicate items: ${isDuplicateData}`)
    if (isDuplicateData) {
      return res.serverError(`Error Message: There are duplicate entries in the file`)
    }

    sails.log.info(`${logIdentifier}, Required data and duplicate checks are passed, proceeding...`)
    const transformedData = ProductService.transformPriorityData(data);
    const isDuplicatePriorityInSameCategory = await ProductService.isDuplicatePriorityInSameCategory(transformedData);
    if (isDuplicatePriorityInSameCategory.failure) {
      return res.serverError(`Error Message: SKU/SKUs have multiple priorities for the same ${isDuplicatePriorityInSameCategory.type} (${isDuplicatePriorityInSameCategory.categoryId}) page. SKU id is ${isDuplicatePriorityInSameCategory.productId}.`)
    }
    try {
      const updatedRecords = await ProductService.updateProductJunctionRows(transformedData);
      res.status(200).send({ updatedCount: updatedRecords, message: `Successfully updated ${updatedRecords} records.` })
    } catch (e) {
      return res.serverError(e.message);
    }


  },

};
