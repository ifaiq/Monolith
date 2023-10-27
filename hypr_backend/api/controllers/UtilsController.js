// UTILITY CONTROLLER
const fs = require("fs");
const csv = require("fast-csv");
const AWS = AWSService.getAWSConfig();
const uuid4 = require("uuid4");
const http = require("axios");
const SmsService = require("../services/SmsService");
const s3 = new AWS.S3();
const requestify = require("requestify");
var JSZip = require("jszip");
const skipperbetters3 = require("skipper-better-s3");
const MailerService = require("../services/MailerService");
/*
const { redlock } = require('../modules/v1/Redis');
const productDao = require('../modules/v1/Product/ProductDao');
*/
const OdooRestClient = require('../clients/OdooRestClient')
const { getSessionId } = require('../services/OdooService');
var elasticSeachClient = require("../services/ElasticSearchService");
const axios = require("../clients/AxiosClient");
const camelcaseKeys = require("camelcase-keys");
const SmsRestClient = require('../clients/SmsRestClient')

const redis = require("redis");
const sourceClient = redis.createClient({ host: process.env.REDIS_SERVER, prefix: 'TEST_' + process.env.NODE_ENV });
const {
  redisService: {
    hsetAsyncDestination,
  },
  constants: { cart: CART_REDIS_KEY },
} = require("../modules/v1/Redis");

const addPrioritiesForCategoriesOnLocation = function (req, res, next) {
  sails.log.error('Legacy API, unused routes called with heaeders :'
    , JSON.stringify(req.headers), '\n params :', JSON.stringify(req.allParams()));
  return res.notFound('Legacy API, unused routes');
  var categoryCount = 1;
  Categories.find({ location_id: req.query.location_id, parent: null }).exec(
    function (err, categories) {
      async.eachSeries(
        categories,
        async function (category, callback) {
          Categories.update(
            { id: category.id },
            { priority: categoryCount }
          ).exec(function (err, updated) {
            if (err) console.log(err);
            else {
              console.log(
                "UPDATED CATEGORY " +
                category.name +
                " count = " +
                categoryCount
              );
              categoryCount++;
              Categories.find({ parent: category.id }).exec(function (
                err,
                subCats
              ) {
                if (err) console.log(err);
                else {
                  var subCatCount = 1;
                  async.eachSeries(
                    subCats,
                    function (subCat, callback) {
                      Categories.update(
                        { id: subCat.id },
                        { priority: subCatCount }
                      ).exec(function (err, updatedSubCat) {
                        if (err) console.log(err);
                        else {
                          console.log(
                            "UPDATED CATEGORY " +
                            subCat.name +
                            " sub cat count = " +
                            subCatCount
                          );
                          subCatCount++;
                          callback();
                        }
                      });
                    },
                    function (err, result) {
                      console.log(
                        "SUB CATEGORIES COMPLETED FOR CATEGORY ",
                        category.name
                      );
                      callback();
                    }
                  );
                }
              });
            }
          });
        },
        function (err, result) {
          if (err) return res.serverError(err);
          return res.ok();
        }
      );
    }
  );
};
module.exports = {
  redisFlushKeys: async (req, res, next) => {
    sails.log.error('Legacy API, unused routes called with heaeders :'
      , JSON.stringify(req.headers), '\n params :', JSON.stringify(req.allParams()));
    return res.notFound('Legacy API, unused routes');
    let pattern = req.query.pattern;
    let clearAll = req.query.all ? true : false;
    RedisService.flushKeys(pattern, clearAll);
    return res.ok();
  },
  initializePriorityForAllLocations: async function (req, res, next) {
    sails.log.error('Legacy API, unused routes called with heaeders :'
      , JSON.stringify(req.headers), '\n params :', JSON.stringify(req.allParams()));
    return res.notFound('Legacy API, unused routes');
    try {
      findCriteria = {};
      let locations = await Location.find(findCriteria);
      locations.forEach(function (loc) {
        req.query = {};
        req.query.location_id = loc.id;
        addPrioritiesForCategoriesOnLocation(req, res, next);
      });
      res.ok();
    } catch (e) {
      console.log(e);
    }
  },
  // UTILITY CONTROLLER
  addPrioritiesForCategoriesOnLocation: addPrioritiesForCategoriesOnLocation,
  replicateCategoryLocationImages: async (req, res, next) => {
    sails.log.error('Legacy API, unused routes called with heaeders :'
      , JSON.stringify(req.headers), '\n params :', JSON.stringify(req.allParams()));
    return res.notFound('Legacy API, unused routes');
    const params = req.allParams();
    let categories = await Categories.find({
      location_id: params.oldLoc,
    });
    let i = 1;
    async.eachSeries(
      categories,
      async function (category, callback) {
        try {
          let imageupdate = await Categories.update(
            {
              name: category.name,
              location_id: params.newLoc,
            },
            { image_url: category.image_url }
          );
          console.log("IMAGES ADDED FOR - ", category.name, " COUNT - ", i);
          i++;
          callback();
        } catch (err) {
          console.log("ERROR", err);
        }
      },
      function (err, result) {
        if (err) res.serverError(err);
        else res.ok();
      }
    );
  },
  replicateProductLocationImages: async (req, res, next) => {
    sails.log.error('Legacy API, unused routes called with heaeders :'
      , JSON.stringify(req.headers), '\n params :', JSON.stringify(req.allParams()));
    return res.notFound('Legacy API, unused routes');
    const params = req.allParams();
    let products = await Product.find({
      location_id: params.oldLoc,
    });
    let i = 1;
    async.eachSeries(
      products,
      async function (product, callback) {
        try {
          let imageupdate = await Product.update(
            {
              sku: product.sku,
              location_id: params.newLoc,
            },
            { image_url: product.image_url }
          );
          console.log("IMAGES ADDED FOR - ", product.sku, " COUNT - ", i);
          i++;
          callback();
        } catch (err) {
          console.log("ERROR", err);
        }
      },
      function (err, result) {
        if (err) res.serverError(err);
        else res.ok();
      }
    );
  },
  addproductsToEs: async function (req, res, next) {
    ProductService.fetchAndAddToEs(req.param("location_id"))
      .then((resp) => {
        res.ok(resp);
      })
      .catch((err) => {
        res.serverError(err);
      });
  },
  /* NOTE: controller to migrate retailo customers */

  onBoardB2BCustomer: function (req, res, next) {
    sails.log.error('Legacy API, unused routes called with heaeders :'
      , JSON.stringify(req.headers), '\n params :', JSON.stringify(req.allParams()));
    return res.notFound('Legacy API, unused routes');
    res.ok();
    var s3Options = { Bucket: sails.config.globalConf.AWS_BUCKET, Key: req.param("file_name") };
    const stream = s3.getObject(s3Options).createReadStream();
    var i = 0;
    var allCSVData = [];
    var customerOnBoarded = [];
    var customerNotOnBoarded = [];
    stream.pipe(
      csv()
        .on("data", async (data) => {
          if (!i) {
            i++;
          } else {
            allCSVData.push(data);
          }
        })
        .on("end", async () => {
          i = 1;
          for (let data of allCSVData) {
            let response = {};
            let orderMode = parseInt(data[9]);
            let shopType = parseInt(data[10]);

            let params = {
              name: data[2],
              phone: data[3],
              cnic: data[5] ? data[5] : "0000",
              secondary_phone: "0000",
              shopDetails: {
                shop_location: data[11],
                shop_name: data[4],
                shop_picture: data[7] ? data[7] : "",
                shop_type_id: shopType,
              },
              address_line_1: data[6],
              city_area: data[6],
              has_smart_phone: false,
              order_mode: orderMode,
              location_id: 44,
            };
            let customerFound = await Customer.findOne({
              phone: params.phone,
            });
            if (customerFound) continue;
            let customerData = _.pick(params, [
              "name",
              "phone",
              "cnic",
              "order_mode",
              "has_smart_phone",
              "secondary_phone",
            ]);
            var verificationCode = Math.floor(Math.random() * 89999 + 10000);
            var encrypted_password = CipherService.hashPassword(
              verificationCode
            );
            let addressData = _.pick(params, ["address_line_1", "city_area"]);
            addressData["location_cordinates"] = data[11];
            let company = await Companies.findOne({
              code: "RET",
            });
            customerData.company_id = company.id;
            let supervisor = await User.findOne({
              phone: data[12],
            });
            customerData.supervisor_id = supervisor.id;
            customerData.verification_code = verificationCode;
            customerData.verified_at = new Date(data[0]);
            customerData.pin_code = encrypted_password;
            customerData.terms_accepted = 1;
            try {
              let new_customer = await Customer.findOrCreate(
                { phone: customerData.phone },
                customerData
              );
              AuthService.clearSessions({ customer_id: new_customer.id });
              console.log("CUSTOMER ON-BOARD", new_customer);
              response = _.cloneDeep(new_customer);
              response["retailer_locations"] = [];
              response["addresses"] = [];
              if (new_customer && new_customer.id) {
                addressData.customer_id = new_customer.id;
                response["addresses"].push(
                  await CustomerAddress.findOrCreate(addressData, addressData)
                );
                params.shopDetails["customer_id"] = new_customer.id;
                let createShopDetails = await CustomerRetailerShopDetails.findOrCreate(
                  {
                    customer_id: new_customer.id,
                  },
                  params.shopDetails
                );

                console.log("AFTER ADDING ADDRESSSSSS", response);
                try {
                  let new_locations = await CustomerRetailerLocations.findOrCreate(
                    { customer_id: new_customer.id, location_id: 44 },
                    { customer_id: new_customer.id, location_id: 44 }
                  );
                  response.retailer_locations.push(_.cloneDeep(new_locations));
                  customerOnBoarded.push({
                    index: i,
                    phone: data[3],
                    reason: "successfully added",
                  });
                  console.log("ADDED RETAILER COUNT - ", i);
                  i++;
                } catch (err) {
                  customerNotOnBoarded.push({
                    index: i,
                    phone: data[3],
                    reason: err,
                  });
                  console.log("ADDED RETAILER COUNT - ", i);
                  i++;
                }
              } else {
                customerNotOnBoarded.push({
                  index: i,
                  phone: data[3],
                  reason: "location id not found",
                });
                console.log("ADDED RETAILER COUNT - ", i);
                i++;
              }
            } catch (err) {
              customerNotOnBoarded.push({
                index: i,
                phone: data[3],
                reason: err,
              });
              console.log("ADDED RETAILER COUNT - ", i);
              i++;
            }
          }
          var html = "";
          if (customerNotOnBoarded.length > 0) {
            html +=
              "<h2>Error Retailers</h2><table><tr><th>Index</th><th>SKU</th><th>Reason</th></tr>";
            var str = "";
            for (var row of customerNotOnBoarded) {
              str +=
                "<tr><td>" +
                row.index +
                "</td>" +
                "<td>" +
                row.phone +
                "</td>" +
                "<td>" +
                row.reason +
                "</td></tr>";
            }
            html += str + "</table>";
          }
          if (customerOnBoarded.length > 0) {
            var str = "";
            for (var row of customerOnBoarded) {
              str = str + row.phone + "<br>";
            }
            html += "<h3>Created Retailers</h3>";
            html += "<p>" + str + "<p>";
          }
          html += "<h3>Summary</h3>";
          html +=
            "<p>" + "Created Retailers: " + customerOnBoarded.length + "</p>";
          html +=
            "<p>" + "Error Retailers: " + customerNotOnBoarded.length + "</p>";
          let user = await AuthStoreService.populateHierarchyAccess(
            res.locals.userData
          );
          let recipients = await UtilService.getAccountEmails(user);
          if (res.locals.userData.email && res.locals.userData.email != "")
            recipients.push(res.locals.userData.email);
          MailerService.sendMailThroughAmazon({
            email: recipients,
            htmlpart: html,
            subject: "Customer Migration Report - " + new Date(),
            destination: "operations@hypr.pk",
          });
        })
    );
  },
  /* NOTE: controller to migrate retailo order and order statuses */

  onBoardB2BOrders: function (req, res, next) {
    sails.log.error('Legacy API, unused routes called with heaeders :'
      , JSON.stringify(req.headers), '\n params :', JSON.stringify(req.allParams()));
    return res.notFound('Legacy API, unused routes')
    res.ok();
    var s3Options = { Bucket: sails.config.globalConf.AWS_BUCKET, Key: req.param("file_name") };
    const stream = s3.getObject(s3Options).createReadStream();
    var i = 0;
    var allCSVData = [];
    var orderOnBoarded = [];
    var orderNotOnBoarded = [];
    stream.pipe(
      csv()
        .on("data", async (data) => {
          if (!i) {
            i++;
          } else {
            allCSVData.push(data);
          }
        })
        .on("end", async () => {
          i = 1;
          for (let data of allCSVData) {
            let response = {};
            let status = data[3];
            let customer = await Customer.findOne({
              phone: "92" + data[4],
            });
            if (customer) {
              let order = await Order.findOne({
                retailo_order_id: data[0] + "-aug",
              });
              if (!order) {
                let customerAddress = await CustomerAddress.find({
                  customer_id: customer.id,
                }).limit(1);
                let params = {
                  total_price: parseFloat(data[1]),
                  placed_at: new Date(data[2] + data[5]),
                  status_id: status == "Delivered" ? 9 : 10,
                  retailo_order_id: data[0] + "-aug",
                  packer_id: 212,
                  customer_id: customer.id,
                  location_id: 44,
                  cash_received: parseFloat(data[1]),
                  delivery_boy_id: 215,
                  disabled: 0,
                  packing_time: new Date(),
                  customer_address_id: customerAddress[0].id,
                  payment_type: "COD",
                  tax: 0.0,
                  tip_amount: 0.0,
                  is_updated: false,
                };

                try {
                  let orderCreated = await Order.create(params);
                  let statusAdded = await UtilService.createOrderStatuses(
                    status,
                    orderCreated.id
                  );
                  orderOnBoarded.push({
                    index: i,
                    orderId: orderCreated.id,
                    retailoOrderId: data[0],
                    reason: "successfully created",
                  });
                  console.log("ORDER CREATED - ", i);
                  i++;
                } catch (err) {
                  orderNotOnBoarded.push({
                    index: i,
                    orderId: "N/A",
                    retailoOrderId: data[0],
                    reason: err,
                  });
                  console.log("ORDER NOT CREATED - ", i);
                  i++;
                }
              } else {
                orderNotOnBoarded.push({
                  index: i,
                  orderId: order.id,
                  retailoOrderId: data[0],
                  reason: "Order Already Migrated",
                });
                console.log("ORDER NOT CREATED - ", i);
                i++;
              }
            } else {
              orderNotOnBoarded.push({
                index: i,
                orderId: "N/A",
                retailoOrderId: data[0],
                reason: "Customer Not Found",
              });
              console.log("ORDER NOT CREATED - ", i);
              i++;
            }
          }
          var html = "";
          if (orderNotOnBoarded.length > 0) {
            html +=
              "<h2>Error Order</h2><table><tr><th>Index</th><th>Order Id</th><th>Retailo Order Id</th><th>Reason</th></tr>";
            var str = "";
            for (var row of orderNotOnBoarded) {
              str +=
                "<tr><td>" +
                row.index +
                "</td>" +
                "<td>" +
                row.orderId +
                "</td>" +
                "<td>" +
                row.retailoOrderId +
                "</td> " +
                "<td>" +
                row.reason +
                "</td></tr>";
            }
            html += str + "</table>";
          }
          if (orderOnBoarded.length > 0) {
            var str = "";
            for (var row of orderOnBoarded) {
              str =
                str +
                "Order ID - " +
                row.orderId +
                ", Retailo Order Id - " +
                row.retailoOrderId +
                "<br>";
            }
            html += "<h3>Created Orders</h3>";
            html += "<p>" + str + "<p>";
          }
          html += "<h3>Summary</h3>";
          html += "<p>" + "Created Orders: " + orderOnBoarded.length + "</p>";
          html += "<p>" + "Error Orders: " + orderNotOnBoarded.length + "</p>";
          let user = await AuthStoreService.populateHierarchyAccess(
            res.locals.userData
          );
          let recipients = await UtilService.getAccountEmails(user);
          if (res.locals.userData.email && res.locals.userData.email != "")
            recipients.push(res.locals.userData.email);
          MailerService.sendMailThroughAmazon({
            email: recipients,
            htmlpart: html,
            subject: "Order Migration Report - " + new Date(),
            destination: "operations@hypr.pk",
          });
        })
    );
  },

  /* NOTE: controller to migrate retailo order Items */
  // [DEPRECATED CALL]: need to remove this call
  onBoardB2BOrderItems: function (req, res, next) {
    sails.log.error('Legacy API, unused routes called with heaeders :'
      , JSON.stringify(req.headers), '\n params :', JSON.stringify(req.allParams()));
    return res.notFound('Legacy API, unused routes')
    res.ok();
    var s3Options = { Bucket: sails.config.globalConf.AWS_BUCKET, Key: req.param("file_name") };
    const stream = s3.getObject(s3Options).createReadStream();
    var i = 0;
    var allCSVData = [];
    var orderItemOnBoarded = [];
    var orderItemNotOnBoarded = [];
    stream.pipe(
      csv()
        .on("data", async (data) => {
          if (!i) {
            i++;
          } else {
            allCSVData.push(data);
          }
        })
        .on("end", async () => {
          i = 1;
          for (let data of allCSVData) {
            let order = await Order.findOne({
              retailo_order_id: data[4] + "-aug",
            });
            if (order) {
              let product = await Product.find({
                name: data[0],
                location_id: 44,
                disabled: 0,
              }).limit(1);
              if (product.length) {
                product = product[0];
                let params = {
                  order_id: order.id,
                  product_id: product.id,
                  quantity: parseInt(data[1]),
                  original_quantity: parseInt(data[1]),
                  price: parseFloat(data[2]),
                  packed_quantity: parseInt(data[1]),
                  removed: 0,
                };

                try {
                  let orderItem = await OrderItems.create(params);
                  orderItemOnBoarded.push({
                    index: i,
                    orderId: order.id,
                    retailoOrderId: parseInt(data[4]),
                    reason: "successfully created/product exists",
                  });
                  console.log("ORDER ITEM CREATED - ", i);
                  i++;
                } catch (err) {
                  orderItemNotOnBoarded.push({
                    index: i,
                    orderId: order.id,
                    retailoOrderId: parseInt(data[4]),
                    reason: err,
                  });
                  console.log("ORDER ITEM NOT CREATED - ", i);
                  i++;
                }
              } else {
                let location = {
                  name: "Retailo Store",
                };
                let query =
                  "SELECT sku FROM `products` WHERE location_id = 44 and sku LIKE " +
                  "'" +
                  location.name.split(" ")[0] +
                  "-%" +
                  "'" +
                  " ORDER BY id DESC LIMIT 1";
                let result = await sails.sendNativeQuery(query);
                let productSku = result.rows;
                if (productSku.length > 0) {
                  var lastSku = productSku[0].sku;
                } else {
                  var lastSku = location.name.split(" ")[0] + "-44-" + "000000";
                }
                var lastNumber = lastSku.split("-")[2];
                var newNumber = +lastNumber + 1;
                newNumber = ("000000" + newNumber).slice(-6);
                var newSku = location.name.split(" ")[0] + "-44-" + newNumber;
                let createdProduct = await Product.create({
                  name: data[0],
                  price: parseFloat(data[2]),
                  location_id: 44,
                  sku: newSku,
                  image_url: "",
                  cost_price: 0.0,
                  mrp: 0.0,
                  stock_quantity: 100,
                  size: "",
                  unit: "",
                  brand: "",
                  urdu_size: "",
                  urdu_unit: "",
                  urdu_brand: "",
                  urdu_name: "",
                  tax_percent: 0.0,
                  tax_inclusive: 0,
                  barcode:
                    "HYPR" + Math.floor(100000000 + Math.random() * 900000000),
                  disabled: 1,
                });
                console.log("CREATED PRODUCT");
                let params = {
                  order_id: order.id,
                  product_id: createdProduct.id,
                  quantity: parseInt(data[1]),
                  original_quantity: parseInt(data[1]),
                  price: parseFloat(data[2]),
                  packed_quantity: parseInt(data[1]),
                  removed: 0,
                };

                try {
                  let orderItem = await OrderItems.create(params);
                  orderItemOnBoarded.push({
                    index: i,
                    orderId: order.id,
                    retailoOrderId: parseInt(data[4]),
                    reason: "successfully created/product created",
                  });
                  console.log("ORDER ITEM CREATED - ", i);
                  i++;
                } catch (err) {
                  orderItemNotOnBoarded.push({
                    index: i,
                    orderId: order.id,
                    retailoOrderId: parseInt(data[4]),
                    reason: err,
                  });
                  console.log("ORDER ITEM NOT CREATED - ", i);
                  i++;
                }
              }
            } else {
              orderItemNotOnBoarded.push({
                index: i,
                orderId: "N/A",
                retailoOrderId: parseInt(data[4]),
                reason: "Order Not Found",
              });
              console.log("ORDER ITEM NOT CREATED - ", i);
              i++;
            }
          }
          var html = "";
          if (orderItemNotOnBoarded.length > 0) {
            html +=
              "<h2>Error Order ITEM</h2><table><tr><th>Index</th><th>Order Id</th><th>Retailo Order Id</th><th>Reason</th></tr>";
            var str = "";
            for (var row of orderItemNotOnBoarded) {
              str +=
                "<tr><td>" +
                row.index +
                "</td>" +
                "<td>" +
                row.orderId +
                "</td>" +
                "<td>" +
                row.retailoOrderId +
                "</td> " +
                "<td>" +
                row.reason +
                "</td></tr>";
            }
            html += str + "</table>";
          }
          if (orderItemOnBoarded.length > 0) {
            var str = "";
            for (var row of orderItemOnBoarded) {
              str =
                str +
                "Order ID - " +
                row.orderId +
                ", Retailo Order Id - " +
                row.retailoOrderId +
                ", Reason - " +
                row.reason +
                "<br>";
            }
            html += "<h3>Created Order Items</h3>";
            html += "<p>" + str + "<p>";
          }
          html += "<h3>Summary</h3>";
          html +=
            "<p>" +
            "Created Order Items: " +
            orderItemOnBoarded.length +
            "</p>";
          html +=
            "<p>" +
            "Error Order Items: " +
            orderItemNotOnBoarded.length +
            "</p>";
          let user = await AuthStoreService.populateHierarchyAccess(
            res.locals.userData
          );
          let recipients = await UtilService.getAccountEmails(user);
          if (res.locals.userData.email && res.locals.userData.email != "")
            recipients.push(res.locals.userData.email);
          MailerService.sendMailThroughAmazon({
            email: recipients,
            htmlpart: html,
            subject: "Order Items Migration Report - " + new Date(),
            destination: "operations@hypr.pk",
          });
        })
    );
  },

  addStatusTaxonomy: function (req, res, next) {
    sails.log.error('Legacy API, unused routes called with heaeders :'
      , JSON.stringify(req.headers), '\n params :', JSON.stringify(req.allParams()));
    return res.notFound('Legacy API, unused routes')
    res.ok();
    var s3Options = { Bucket: sails.config.globalConf.AWS_BUCKET, Key: req.param("file_name") };
    const stream = s3.getObject(s3Options).createReadStream();
    var i = 0;
    var allCSVData = [];
    var orderTaxonomy = [];
    var orderTaxonomyNotAdded = [];
    stream.pipe(
      csv()
        .on("data", async (data) => {
          if (!i) {
            i++;
          } else {
            allCSVData.push(data);
          }
        })
        .on("end", async () => {
          i = 1;
          for (let data of allCSVData) {
            try {
              let order = await Order.findOne({
                retailo_order_id: parseInt(data[0]),
              });
              if (order) {
                let createdRecord = await StatusTaxonomy.create({
                  order_id: order.id,
                  status_name: data[1],
                });
                orderTaxonomy.push({
                  index: i,
                  orderId: order.id,
                  reason: "successfully created",
                });
                console.log("STATUS TAXONOMY CREATED - ", i);
                i++;
              } else {
                orderTaxonomyNotAdded.push({
                  index: i,
                  orderId: data[0],
                  reason: "ORDER NOT FOUND",
                });
                console.log("STATUS TAXONOMY NOT CREATED - ", i);
                i++;
              }
            } catch (err) {
              orderTaxonomyNotAdded.push({
                index: i,
                orderId: data[0],
                reason: err,
              });
              console.log("STATUS TAXONOMY NOT CREATED - ", i);
              i++;
            }
          }
          var html = "";
          if (orderTaxonomyNotAdded.length > 0) {
            html +=
              "<h2>Error Taxonomy</h2><table><tr><th>Index</th><th>Reason</th></tr>";
            var str = "";
            for (var row of orderTaxonomy) {
              str +=
                "<tr><td>" +
                row.index +
                "</td>" +
                "<td>" +
                row.reason +
                "</td></tr>";
            }
            html += str + "</table>";
          }
          if (orderTaxonomy.length > 0) {
            var str = "";
            for (var row of orderItemOnBoarded) {
              str =
                str +
                "Order ID - " +
                row.orderId +
                " Reason - " +
                row.reason +
                "<br>";
            }
            html += "<h3>Created Status Taxonomy</h3>";
            html += "<p>" + str + "<p>";
          }
          html += "<h3>Summary</h3>";
          html +=
            "<p>" + "Created Status Taxonomy: " + orderTaxonomy.length + "</p>";
          html +=
            "<p>" +
            "Error Status Taxonomy: " +
            orderTaxonomyNotAdded.length +
            "</p>";
          let user = await AuthStoreService.populateHierarchyAccess(
            res.locals.userData
          );
          let recipients = await UtilService.getAccountEmails(user);
          if (res.locals.userData.email && res.locals.userData.email != "")
            recipients.push(res.locals.userData.email);
          MailerService.sendMailThroughAmazon({
            email: recipients,
            htmlpart: html,
            subject: "Status Taxonomy Report - " + new Date(),
            destination: "operations@hypr.pk",
          });
        })
    );
  },
  initializeOperatingDaysForAllLocations: async function (req, res, next) {
    sails.log.error('Legacy API, unused routes called with heaeders :'
      , JSON.stringify(req.headers), '\n params :', JSON.stringify(req.allParams()));
    return res.notFound('Legacy API, unused routes');
    try {
      findCriteria = {};
      let locations = await Location.find(findCriteria);
      let operating_days = [1, 2, 3, 4, 5, 6, 7];
      locations.forEach(async function (loc) {
        await Location.update(
          { id: loc.id },
          {
            delivery_time: "24:0:0",
          }
        );
        operating_days.forEach(async function (day) {
          await StoreOperatingDays.findOrCreate(
            { day_id: day, location_id: loc.id },
            {
              day_id: day,
              location_id: loc.id,
              start_time: "0:0:0",
              end_time: "23:59:0",
              disabled: 0,
            }
          );
        });
      });
      res.ok();
    } catch (e) {
      console.log(e);
    }
  },
  sendBulkMessage: function (req, res, next) {
    sails.log.error('Legacy API, unused routes called with heaeders :'
      , JSON.stringify(req.headers), '\n params :', JSON.stringify(req.allParams()));
    return res.notFound('Legacy API, unused routes');
    res.ok();
    var s3Options = { Bucket: sails.config.globalConf.AWS_BUCKET, Key: req.param("file_name") };
    const stream = s3.getObject(s3Options).createReadStream();
    var i = 0;
    var allCSVData = [];
    stream.pipe(
      csv()
        .on("data", async (data) => {
          if (!i) {
            i++;
          } else {
            allCSVData.push(data);
          }
        })
        .on("end", async () => {
          i = 1;
          for (let data of allCSVData) {
            /* NOTE: message should be generic */

            SmsService.sendHyprMessage(
              "92" + data[0],
              "Muaziz Retailors,Apko btana chahengy k mausam ki tabdeeli or tez barish ki waja se hamen kch mushkilat ka samna karna par rha hai jiski waja se apkay order ki delivery may takheer hosakti hai. Takleef k lie muazrat. Mazeed malomat k lie retailo k helpline 0313-7382456 call karen. Shukriya"
            );
            console.log(
              "SENT MESSAGE TO RETAILER - ",
              "92" + data[0],
              " - count - ",
              i
            );
            i++;
          }
        })
    );
  },

  /* NOTE: controller to mark products disabled and out of stock */

  markProductsDisabled: function (req, res, next) {
    sails.log.error('Legacy API, unused routes called with heaeders :'
      , JSON.stringify(req.headers), '\n params :', JSON.stringify(req.allParams()));
    return res.notFound('Legacy API, unused routes');
    res.ok();
    var s3Options = { Bucket: sails.config.globalConf.AWS_BUCKET, Key: req.param("file_name") };
    const stream = s3.getObject(s3Options).createReadStream();
    var i = 0;
    var allCSVData = [];
    var productsUpdated = [];
    var productsNotUpated = [];
    stream.pipe(
      csv()
        .on("data", async (data) => {
          if (!i) {
            i++;
          } else {
            allCSVData.push(data);
          }
        })
        .on("end", async () => {
          i = 1;
          for (let data of allCSVData) {
            try {
              let product = await Product.findOne({
                name: data[0],
                location_id: 44,
              });
              if (product) {
                try {
                  let updated = await Product.update(
                    {
                      id: product.id,
                    },
                    {
                      stock_quantity: 0,
                      disabled: 1,
                    }
                  );
                  productsUpdated.push({
                    index: i,
                    productName: data[0],
                    reason: "product updated successfully",
                  });
                  console.log("PRODUCT UPDATED - ", i);
                  i++;
                } catch (err) {
                  productsNotUpated.push({
                    index: i,
                    productName: data[0],
                    reason: err,
                  });
                  console.log("PRODUCT NOT UPDATED - ", i);
                  i++;
                }
              }
            } catch (err) {
              productsNotUpated.push({
                index: i,
                productName: data[0],
                reason: err,
              });
              console.log("PRODUCT NOT UPDATED - ", i);
              i++;
            }
          }
          var html = "";
          if (productsNotUpated.length > 0) {
            html +=
              "<h2>Error Product</h2><table><tr><th>Index</th><th>Product name</th><th>Reason</th></tr>";
            var str = "";
            for (var row of productsNotUpated) {
              str +=
                "<tr><td>" +
                row.index +
                "</td>" +
                "<td>" +
                row.productName +
                "</td>" +
                "<td>" +
                row.reason +
                "</td></tr>";
            }
            html += str + "</table>";
          }
          if (productsUpdated.length > 0) {
            var str = "";
            for (var row of productsUpdated) {
              str =
                str +
                "Product Updated - " +
                row.productName +
                ", Reason - " +
                row.reason +
                "<br>";
            }
            html += "<h3>Updated Products</h3>";
            html += "<p>" + str + "<p>";
          }
          html += "<h3>Summary</h3>";
          html +=
            "<p>" + "Updated Products: " + productsUpdated.length + "</p>";
          html +=
            "<p>" + "Error Products: " + productsNotUpated.length + "</p>";
          let user = await AuthStoreService.populateHierarchyAccess(
            res.locals.userData
          );
          let recipients = await UtilService.getAccountEmails(user);
          if (res.locals.userData.email && res.locals.userData.email != "")
            recipients.push(res.locals.userData.email);
          MailerService.sendMailThroughAmazon({
            email: recipients,
            htmlpart: html,
            subject: "Products Update Report - " + new Date(),
            destination: "operations@hypr.pk",
          });
        })
    );
  },
  /* NOTE: controller to migrate retailo customers */

  onBoardB2BCustomerFromRetailoSystem: function (req, res, next) {
    res.ok();
    var s3Options = { Bucket: sails.config.globalConf.AWS_BUCKET, Key: req.param("file_name") };
    const stream = s3.getObject(s3Options).createReadStream();
    var i = 0;
    var allCSVData = [];
    var customerOnBoarded = [];
    var customerNotOnBoarded = [];
    stream.pipe(
      csv()
        .on("data", async (data) => {
          if (!i) {
            i++;
          } else {
            allCSVData.push(data);
          }
        })
        .on("end", async () => {
          i = 1;
          for (let data of allCSVData) {
            let response = {};
            let latLng = data[11] != "" ? data[11].split(",") : "";
            let orderMode =
              data[9] == "Unknown" || data[9] == "App User"
                ? 1
                : data[9] == "On Call Retailer"
                  ? 2
                  : data[9] == "Visit Retailer"
                    ? 6
                    : 1;
            let shopType =
              data[10] == "Unknown" || data[10] == "General Store"
                ? 1
                : data[10] == "Medical & General Store"
                  ? 3
                  : data[10] == "Pan Shop"
                    ? 7
                    : data[10] == "Bakery"
                      ? 4
                      : data[10] == "Kiryana"
                        ? 2
                        : data[10] == "Trader/Distributor"
                          ? 8
                          : data[10] == "Mart"
                            ? 5
                            : data[10] == "Wholesaler"
                              ? 6
                              : 9;
            latLng[0] = parseFloat(latLng[0]);
            latLng[1] = parseFloat(latLng[1]);
            let coords = {
              longitude: latLng[1],
              latitude: latLng[0],
            };

            let params = {
              name: data[2],
              phone: "92" + data[3],
              cnic: data[5] ? data[5] : "0000",
              secondary_phone: "0000",
              shopDetails: {
                shop_location: JSON.stringify({
                  latitude: latLng[0],
                  longitude: latLng[1],
                }),
                shop_name: data[4],
                shop_picture: data[7] ? data[7] : "",
                shop_type_id: shopType,
              },
              address_line_1: data[6],
              city_area: data[6],
              has_smart_phone: false,
              order_mode: orderMode,
              location_id: 44,
            };
            let customerFound = await Customer.findOne({
              phone: params.phone,
            });
            if (customerFound) continue;
            let customerData = _.pick(params, [
              "name",
              "phone",
              "cnic",
              "order_mode",
              "has_smart_phone",
              "secondary_phone",
            ]);
            var verificationCode = Math.floor(Math.random() * 89999 + 10000);
            var encrypted_password = CipherService.hashPassword(
              verificationCode
            );
            let addressData = _.pick(params, ["address_line_1", "city_area"]);
            addressData["location_cordinates"] = JSON.stringify(coords);
            let company = await Companies.findOne({
              code: "RET",
            });
            customerData.company_id = company.id;
            customerData.supervisor_id = 210;
            customerData.verification_code = verificationCode;
            customerData.verified_at = new Date();
            customerData.pin_code = encrypted_password;
            customerData.terms_accepted = 1;
            try {
              let new_customer = await Customer.findOrCreate(
                { phone: customerData.phone },
                customerData
              );
              AuthService.clearSessions({ customer_id: new_customer.id });
              console.log("CUSTOMER ON-BOARD", new_customer);
              response = _.cloneDeep(new_customer);
              response["retailer_locations"] = [];
              response["addresses"] = [];
              if (new_customer && new_customer.id) {
                addressData.customer_id = new_customer.id;
                response["addresses"].push(
                  await CustomerAddress.findOrCreate(addressData, addressData)
                );
                params.shopDetails["customer_id"] = new_customer.id;
                let createShopDetails = await CustomerRetailerShopDetails.findOrCreate(
                  {
                    customer_id: new_customer.id,
                  },
                  params.shopDetails
                );

                console.log("AFTER ADDING ADDRESSSSSS", response);
                try {
                  let new_locations = await CustomerRetailerLocations.findOrCreate(
                    { customer_id: new_customer.id, location_id: 44 },
                    { customer_id: new_customer.id, location_id: 44 }
                  );
                  response.retailer_locations.push(_.cloneDeep(new_locations));
                  customerOnBoarded.push({
                    index: i,
                    phone: "92" + data[3],
                    reason: "successfully added",
                  });
                  console.log("ADDED RETAILER COUNT - ", i);
                  i++;
                } catch (err) {
                  customerNotOnBoarded.push({
                    index: i,
                    phone: "92" + data[0],
                    reason: err,
                  });
                  console.log("ADDED RETAILER COUNT - ", i);
                  i++;
                }
              } else {
                customerNotOnBoarded.push({
                  index: i,
                  phone: "92" + data[3],
                  reason: "location id not found",
                });
                console.log("ADDED RETAILER COUNT - ", i);
                i++;
              }
            } catch (err) {
              customerNotOnBoarded.push({
                index: i,
                phone: "92" + data[3],
                reason: err,
              });
              console.log("ADDED RETAILER COUNT - ", i);
              i++;
            }
          }
          var html = "";
          if (customerNotOnBoarded.length > 0) {
            html +=
              "<h2>Error Retailers</h2><table><tr><th>Index</th><th>SKU</th><th>Reason</th></tr>";
            var str = "";
            for (var row of customerNotOnBoarded) {
              str +=
                "<tr><td>" +
                row.index +
                "</td>" +
                "<td>" +
                row.phone +
                "</td>" +
                "<td>" +
                row.reason +
                "</td></tr>";
            }
            html += str + "</table>";
          }
          if (customerOnBoarded.length > 0) {
            var str = "";
            for (var row of customerOnBoarded) {
              str = str + row.phone + "<br>";
            }
            html += "<h3>Created Retailers</h3>";
            html += "<p>" + str + "<p>";
          }
          html += "<h3>Summary</h3>";
          html +=
            "<p>" + "Created Retailers: " + customerOnBoarded.length + "</p>";
          html +=
            "<p>" + "Error Retailers: " + customerNotOnBoarded.length + "</p>";
          let recipients = ["moeed@shopistan.pk"];
          MailerService.sendMailThroughAmazon({
            email: recipients,
            htmlpart: html,
            subject: "Customer Migration Report - " + new Date(),
            destination: "operations@hypr.pk",
          });
        })
    );
  },

  bulkCreateUsers: async function (req, res, next) {
    sails.log.error('Legacy API, unused routes called with heaeders :'
      , JSON.stringify(req.headers), '\n params :', JSON.stringify(req.allParams()));
    return res.notFound('Legacy API, unused routes');
    res.ok();
    var s3Options = { Bucket: sails.config.globalConf.AWS_BUCKET, Key: req.param("file_name") };
    const stream = s3.getObject(s3Options).createReadStream();
    var i = 0;
    var allCSVData = [];
    var usersCreated = [];
    var usersNotCreated = [];
    stream.pipe(
      csv()
        .on("data", async (data) => {
          if (!i) {
            i++;
          } else {
            allCSVData.push(data);
          }
        })
        .on("end", async () => {
          i = 1;
          for (let data of allCSVData) {
            let params = {
              address: "karachi",
              cnic: "0000",
              cnic_picture: "",
              confirmPassword: "1234",
              name: data[1],
              password: "1234",
              phone: data[4],
              username: data[2],
              roles: [16],
              locations: [44],
            };
            requestify
              .post("http://localhost:8080/auth/signup", params)
              .then(function (response) {
                response.getBody();
                console.log(response.getBody());
                usersCreated.push({
                  index: i,
                  phone: data[5],
                  reason: "user created successfully",
                });
                console.log("ADDED USER COUNT - ", i);
                i++;
              })
              .catch(function (error) {
                console.log(error);
                usersNotCreated.push({
                  index: i,
                  phone: data[5],
                  reason: error,
                });
                console.log("NOT ADDED USER COUNT - ", i);
                i++;
              });
          }
          var html = "";
          if (usersNotCreated.length > 0) {
            html +=
              "<h2>Error Users</h2><table><tr><th>Index</th><th>phone</th><th>Reason</th></tr>";
            var str = "";
            for (var row of usersNotCreated) {
              str +=
                "<tr><td>" +
                row.index +
                "</td>" +
                "<td>" +
                row.phone +
                "</td>" +
                "<td>" +
                row.reason +
                "</td></tr>";
            }
            html += str + "</table>";
          }
          if (usersCreated.length > 0) {
            var str = "";
            for (var row of usersCreated) {
              str = str + row.phone + "<br>";
            }
            html += "<h3>Created Users</h3>";
            html += "<p>" + str + "<p>";
          }
          html += "<h3>Summary</h3>";
          html += "<p>" + "Created Users: " + customerOnBoarded.length + "</p>";
          html +=
            "<p>" + "Error Users: " + customerNotOnBoarded.length + "</p>";
          let user = await AuthStoreService.populateHierarchyAccess(
            res.locals.userData
          );
          let recipients = await UtilService.getAccountEmails(user);
          if (res.locals.userData.email && res.locals.userData.email != "")
            recipients.push(res.locals.userData.email);
          MailerService.sendMailThroughAmazon({
            email: recipients,
            htmlpart: html,
            subject: "User Creation Report - " + new Date(),
            destination: "operations@hypr.pk",
          });
        })
    );
  },
  uploadProductImages: function (req, res, next) {
    sails.log.error('Legacy API, unused routes called with heaeders :'
      , JSON.stringify(req.headers), '\n params :', JSON.stringify(req.allParams()));
    return res.notFound('Legacy API, unused routes');
    var file_name = req.file("file")._files[0].stream.filename;
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
      else {
        console.log("uploaded sucessfully");
        var s3Options = { Bucket: sails.config.globalConf.AWS_BUCKET, Key: file_name };
        const stream = s3.getObject(s3Options).createReadStream();
        var i = 0;
        let fileName = "";
        var allCSVData = [];
        let ext = "jpeg";
        stream.pipe(
          csv()
            .on("data", async (data) => {
              allCSVData.push(data);
            })
            .on("end", async () => {
              i = 0;
              allCSVData.forEach(async function (data, index) {
                let fileContent = await http.get(data[1], {
                  responseType: "arraybuffer",
                });
                let fileName = uuid4();
                let ext = fileContent.headers["content-type"].split("/")[1];

                fileName += `.${ext}`;
                try {
                  await S3Service.uploadImage(fileContent.data, fileName);
                  fileName = `https://${sails.config.globalConf.AWS_BUCKET}.s3.${sails.config.globalConf.AWS_REGION}.amazonaws.com/${fileName}`;
                  let prod = await Product.update(
                    { sku: data[0], location_id: 35 },
                    { image_url: fileName }
                  );
                  console.log(prod);
                } catch (err) {
                  console.log("ERROR AT INDEX: " + index);
                }
              });
              res.ok();
            })
        );
      }
    });
  },
  /* NOTE: controller to migrate retailo order statuses */

  onBoardOrderStatuses: function (req, res, next) {
    sails.log.error('Legacy API, unused routes called with heaeders :'
      , JSON.stringify(req.headers), '\n params :', JSON.stringify(req.allParams()));
    return res.notFound('Legacy API, unused routes')
    res.ok();
    var s3Options = { Bucket: sails.config.globalConf.AWS_BUCKET, Key: req.param("file_name") };
    const stream = s3.getObject(s3Options).createReadStream();
    var i = 0;
    var allCSVData = [];
    var orderOnBoarded = [];
    var orderNotOnBoarded = [];
    stream.pipe(
      csv()
        .on("data", async (data) => {
          if (!i) {
            i++;
          } else {
            allCSVData.push(data);
          }
        })
        .on("end", async () => {
          i = 1;
          for (let data of allCSVData) {
            let order = await Order.findOne({
              retailo_order_id: data[0] + "-aug",
            });
            if (order) {
              let statusAdded = await UtilService.createOrderStatuses(
                data[3],
                order.id
              );
              orderOnBoarded.push({
                index: i,
                orderId: order.id,
                retailoOrderId: data[0],
                reason: "successfully status added",
              });
              console.log("ORDER CREATED - ", i);
              i++;
            } else {
              orderNotOnBoarded.push({
                index: i,
                orderId: "n/a",
                retailoOrderId: data[0],
                reason: "Order not fuund",
              });
              console.log("ORDER NOT CREATED - ", i);
              i++;
            }
          }
          var html = "";
          if (orderNotOnBoarded.length > 0) {
            html +=
              "<h2>Error Order</h2><table><tr><th>Index</th><th>Order Id</th><th>Retailo Order Id</th><th>Reason</th></tr>";
            var str = "";
            for (var row of orderNotOnBoarded) {
              str +=
                "<tr><td>" +
                row.index +
                "</td>" +
                "<td>" +
                row.orderId +
                "</td>" +
                "<td>" +
                row.retailoOrderId +
                "</td> " +
                "<td>" +
                row.reason +
                "</td></tr>";
            }
            html += str + "</table>";
          }
          if (orderOnBoarded.length > 0) {
            var str = "";
            for (var row of orderOnBoarded) {
              str =
                str +
                "Order ID - " +
                row.orderId +
                ", Retailo Order Id - " +
                row.retailoOrderId +
                "<br>";
            }
            html += "<h3>Created Orders</h3>";
            html += "<p>" + str + "<p>";
          }
          html += "<h3>Summary</h3>";
          html += "<p>" + "Created Orders: " + orderOnBoarded.length + "</p>";
          html += "<p>" + "Error Orders: " + orderNotOnBoarded.length + "</p>";
          let recipients = ["moeed@shopistan.pk"];
          MailerService.sendMailThroughAmazon({
            email: recipients,
            htmlpart: html,
            subject: "Order Migration Report - " + new Date(),
            destination: "operations@hypr.pk",
          });
        })
    );
  },

  updateTestOrder: async function (req, res) {
    sails.log.error('Legacy API, unused routes called with heaeders :'
      , JSON.stringify(req.headers), '\n params :', JSON.stringify(req.allParams()));
    return res.notFound('Legacy API, unused routes')
    let params = req.allParams();
    try {
      let order = await Order.customUpdate(
        { id: 7521 },
        { status_id: params.status_id }
      );
      res.ok(order);
    } catch (err) {
      return res.serverError(err);
    }
  },

  /* NOTE: util controller to update customer lat/lng or area */
  correctCords: function (req, res, next) {
    sails.log.error('Legacy API, unused routes called with heaeders :'
      , JSON.stringify(req.headers), '\n params :', JSON.stringify(req.allParams()));
    return res.notFound('Legacy API, unused routes');
    let params = req.allParams();
    var file_name = req.file("file")._files[0].stream.filename;
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
      else {
        console.log("uploaded sucessfully");
        var s3Options = { Bucket: sails.config.globalConf.AWS_BUCKET, Key: file_name };
        const stream = s3.getObject(s3Options).createReadStream();
        var i = 0;
        let fileName = "";
        var allCSVData = [];
        let ext = "jpeg";
        let err_phone = [];
        stream.pipe(
          csv()
            .on("data", async (data) => {
              if (!i) {
                i++;
              } else {
                allCSVData.push(data);
              }
            })
            .on("end", async () => {
              let lat,
                long,
                cords,
                phone,
                customer,
                new_cords = {},
                toBeUpdated = {};
              shopDetailsUpdate = {};
              res.ok();
              let company = await Companies.findOne({ code: "RET" });
              var i = 1;
              for (let data of allCSVData) {
                phone = data[2];
                cords = data[3];

                try {
                  customer = await Customer.findOne({
                    phone: phone,
                    company_id: company.id,
                  });
                  if (customer) {
                    data[4] != "" ? (toBeUpdated["city_area"] = data[4]) : null;
                    if (cords != "") {
                      lat = cords.split(",")[0].trim();
                      long = cords.split(",")[1].trim();
                      new_cords.latitude = parseFloat(lat);
                      new_cords.longitude = parseFloat(long);
                      toBeUpdated["location_cordinates"] = JSON.stringify(
                        new_cords
                      );
                      shopDetailsUpdate["shop_location"] = JSON.stringify(
                        new_cords
                      );
                    }
                    if (toBeUpdated) {
                      console.log("UPDATING " + customer.phone);
                      console.log(toBeUpdated);
                      await CustomerAddress.update(
                        { customer_id: customer.id },
                        toBeUpdated
                      );
                      await CustomerRetailerShopDetails.update(
                        { customer_id: customer.id },
                        shopDetailsUpdate
                      );
                      console.log("UPDATED ROW", i);
                      i++;
                    }
                  } else {
                    console.log(
                      "NO CUSTOMER FOUND for phone: " +
                      phone +
                      " and company: " +
                      company.id
                    );
                    console.log(customer);
                    i++;
                  }
                } catch (err) {
                  console.log(err);
                }
              }
            })
        );
      }
    });
  },
  unverifyAndSignOutCustomers: function (req, res, next) {
    sails.log.error('Legacy API, unused routes called with heaeders :'
      , JSON.stringify(req.headers), '\n params :', JSON.stringify(req.allParams()));
    return res.notFound('Legacy API, unused routes');
    let params = req.allParams();
    var file_name = req.file("file")._files[0].stream.filename;
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
      else {
        console.log("uploaded sucessfully");
        var s3Options = { Bucket: sails.config.globalConf.AWS_BUCKET, Key: file_name };
        const stream = s3.getObject(s3Options).createReadStream();
        var i = 0;
        var allCSVData = [];
        stream.pipe(
          csv()
            .on("data", async (data) => {
              if (!i) {
                i++;
              } else {
                allCSVData.push(data);
              }
            })
            .on("end", async () => {
              res.ok();
              let company = await Companies.findOne({ code: "RET" });
              var i = 1;
              for (let data of allCSVData) {
                phone = data[2];
                try {
                  customer = await Customer.findOne({
                    phone: phone,
                    company_id: company.id,
                  });
                  if (customer) {
                    sails.log("UPDATING " + customer.phone);
                    let updatedCustomer = await Customer.updateAndClearSessions(customer.id, {
                      verified_at: null,
                    });
                    sails.log(`updatedCustomer ${customer.id} ${JSON.stringify(updatedCustomer)}`);
                    sails.log("UPDATED ROW", i);
                    i++;
                  } else {
                    sails.log(
                      "NO CUSTOMER FOUND for phone: " +
                      phone +
                      " and company: " +
                      company.id
                    );
                    i++;
                  }
                } catch (err) {
                  sails.log(err);
                }
              }
            })
        );
      }
    });
  },
  correcShopImages: async function (req, res, next) {
    sails.log.error('Legacy API, unused routes called with heaeders :'
      , JSON.stringify(req.headers), '\n params :', JSON.stringify(req.allParams()));
    return res.notFound('Legacy API, unused routes');
    var file_name = req.file("file")._files[0].stream.filename;
    let sucessful_customers = [];
    console.log("*** Upload started");
    let company = await Companies.findOne({ code: "RET" });
    res.ok();
    // calling function to get file contents
    UploadService.getFileContents3(req)
      .then((data) => {
        if (data.success) {
          console.log("HERE!!");
          var phone = "";
          try {
            let s2_filepath = data.filePath;
            S3Service.getFile(s2_filepath)
              .then(function (data) {
                console.log("data");
                console.log(data);
                data = data.Body;
                JSZip.loadAsync(data)
                  .then(async function (zip) {
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
                    S3Service.deleteFile(s2_filepath).then(
                      function functionName() {
                        console.log("file deleted");
                      }
                    );
                    console.log("*** file content");
                    let images = unzip_files;

                    // images: (file Contents), imageUploadCount (for future use to track errors in upload)
                    imageUploadCount = images.length;
                    var uploaded = 0;
                    async.eachSeries(
                      images,
                      function (image, callback) {
                        index = image.name.split(".");
                        // getting phone name from image
                        phone = index[0].trim();
                        console.log("PHONE: " + phone[0] + " " + phone[1]);
                        if (phone[0] == 0 && phone[1] == 3) {
                          phone = phone.replace("03", "923");
                        }
                        file_name =
                          phone + "-" + new Date().getTime() + "." + index[1];
                        file_name = file_name.split(" ").join("");
                        // find Customer
                        Customer.findOne({
                          phone: phone,
                          company_id: company.id,
                        }).exec(function (err, customer) {
                          if (err) {
                            console.log(
                              "image upload Customer not found: " + phone
                            );
                            callback();
                          } else if (customer) {
                            S3Service.uploadImage(image.content, file_name)
                              .then(function (result) {
                                if (result) {
                                  console.log("IMAGE UPlOADED URL", result);
                                  uploaded++;
                                  CustomerRetailerShopDetails.update(
                                    { customer_id: customer.id },
                                    {
                                      shop_picture: result,
                                    }
                                  ).exec(function (err, customer) {
                                    if (err) {
                                      console.log(
                                        "ERROR (UPDATING customer)",
                                        err
                                      );
                                      callback();
                                    } else {
                                      sucessful_customers.push(phone);
                                      callback();
                                    }
                                  });
                                }
                              })
                              .catch(function (err) {
                                console.log("ERROR (S3 SERVICE)", err);
                                callback(err);
                              });
                          } else {
                            // res.basRequest('customer not found');
                            console.log(
                              "image upload customer not found: " + phone
                            );
                            callback();
                          }
                        });
                      },
                      function (err, result) {
                        console.log("SUCESSFUL CUSTOMERS: ");
                        console.log(sucessful_customers);
                        if (err) {
                          console.log(err);
                        } else {
                          console.log("every thing works fine");
                        }
                      }
                    );
                  })
                  .catch(function (err) {
                    console.log("inside unzip file error", err);
                    return res.serverError(err);
                  });
              })
              .catch(function (err) {
                console.log("inside get file error", err);
                return res.serverError(err);
              });
          } catch (e) {
            console.log(e);
            return res.serverError(err);
          }
        } else {
          res.serverError("something went wrong!");
        }
      })
      .catch(function (err) {
        console.log(err);
        res.serverError(err);
      });
  },

  /* NOTE: 19 september, delete duplicate customer addreses */

  removeDuplicateCustomerAddresses: async function (req, res, next) {
    sails.log.error('Legacy API, unused routes called with heaeders :'
      , JSON.stringify(req.headers), '\n params :', JSON.stringify(req.allParams()));
    return res.notFound('Legacy API, unused routes');
    let query =
      "SELECT customer_id FROM customer_addresses ca join customers c on c.id = ca.customer_id WHERE c.company_id = 8 GROUP BY customer_id HAVING COUNT(*) > 1";
    let customerIds = await sails.sendNativeQuery(query);
    let ids = customerIds.rows;
    var count = 1;
    for (let id of ids) {
      let customerAddressRecords = await CustomerAddress.find({
        customer_id: id.customer_id,
      })
        .sort("id asc")
        .select("id");
      console.log(customerAddressRecords);
      var flag = false;
      var toBeDeletedIds = [];
      for (let address of customerAddressRecords) {
        let order = await Order.find({
          customer_address_id: address.id,
        });
        if (!order.length) {
          toBeDeletedIds.push(address.id);
          console.log("PUSHING", toBeDeletedIds);
        } else {
          flag = true;
        }
      }
      if (!flag) {
        toBeDeletedIds.splice(0, 1);
        console.log("TO BE DELETED REMOVED LATEST RECORD ID");
      }
      console.log("GOING TO REMOVE THESE", toBeDeletedIds);
      let destroyed = await CustomerAddress.destroy({
        id: toBeDeletedIds,
      });
      console.log("RECORDS REMOVED", toBeDeletedIds);
      console.log("CUSTOMER ID AGAINST RECORDS REMOVED", id.customer_id);
      console.log("******************** DONE ***************");
      console.log("COUNT", count);
      count++;
    }
  },

  updatePreviousLocationPriority: async function (req, res, next) {
    sails.log.error('Legacy API, unused routes called with heaeders :'
      , JSON.stringify(req.headers), '\n params :', JSON.stringify(req.allParams()));
    return res.notFound('Legacy API, unused routes');
    sails.log.error('Legacy API, unused routes called with heaeders :'
      , JSON.stringify(req.headers), '\n params :', JSON.stringify(req.allParams()));
    return res.notFound('Legacy API, unused routes');
    const params = req.allParams();
    console.log(params.code);
    var priorityCount = 1;
    let company = await Companies.findOne({ code: params.code });
    let locations = await Location.find({
      company_id: company.id,
    });

    async.eachSeries(
      locations,
      async function (loc, callback) {
        try {
          console.log(loc.id);
          let update = await Location.update(
            { id: loc.id },
            { priority: priorityCount }
          );
          console.log(update);

          console.log(
            "UPDATED LOCATION PRIORITY " +
            loc.name +
            " count = " +
            priorityCount
          );
          priorityCount++;

          callback();
        } catch (err) {
          console.log("ERROR", err);
          callback(err);
        }
      },
      function (err, result) {
        if (!err) res.ok();
      }
    );
  },

  // reset products priority by company code
  resetAllCategoryProductsPriorityByCompany: async function (req, res, next) {
    sails.log.error('Legacy API, unused routes called with heaeders :'
      , JSON.stringify(req.headers), '\n params :', JSON.stringify(req.allParams()));
    return res.notFound('Legacy API, unused routes');
    try {
      var params = req.allParams();
      let company = await Companies.findOne({
        code: params.code,
      });
      let locations = await Location.find({
        company_id: company.id,
      });
      async.eachSeries(
        locations,
        async function (location, callback) {
          let subCategories = await Categories.find({
            parent: { "!=": null },
            location_id: location.id,
          });
          async.eachSeries(
            subCategories,
            async function (cat, _callback) {
              try {
                await ProductService.resetCategoryProductsPriorityByCategory(
                  cat.id
                );
                sails.log(
                  `Product priorities in category: ${cat.id} have been updated`
                );
                _callback();
              } catch (err) {
                _callback();
              }
            },
            async function (err, result) {
              if (err) callback();
              callback();
            }
          );
        },
        async function (err, result) {
          res.ok(
            `priorities set for all categories under company. ${params.code}`
          );
        }
      );
    } catch (err) {
      return res.serverError(err);
    }
  },

  addOperatingDaysByCompany: async function (req, res, next) {
    sails.log.error('Legacy API, unused routes called with heaeders :'
      , JSON.stringify(req.headers), '\n params :', JSON.stringify(req.allParams()));
    return res.notFound('Legacy API, unused routes');
    try {
      var params = req.allParams();
      let company = await Companies.findOne({
        code: params.code,
      });
      let locations = await Location.find({
        company_id: company.id,
      });
      async.eachSeries(
        locations,
        async function (location, callback) {
          let weekdays = await Weekdays.find();
          async.eachSeries(
            weekdays,
            async function (day, _callback) {
              try {
                let findData = await StoreOperatingDays.findOne({
                  location_id: location.id,
                  day_id: day.id,
                });
                if (!findData) {
                  let operating_day = await StoreOperatingDays.create({
                    day_id: day.id,
                    location_id: location.id,
                    start_time: "00:00:00",
                    end_time: "23:59:59",
                    disabled: 0,
                  });
                }
                _callback();
              } catch (err) {
                _callback();
              }
            },
            async function (err, result) {
              if (err) callback();
              callback();
            }
          );
        },
        async function (err, result) {
          res.ok(
            `priorities set for all categories under company. ${params.code}`
          );
        }
      );
    } catch (err) {
      return res.serverError(err);
    }
  },
  // [DEPRECATED CALL]: need to remove this call
  setRetailoMigrationFlags: async function (req, res, next) {
    sails.log.error('Legacy API, unused routes called with heaeders :'
      , JSON.stringify(req.headers), '\n params :', JSON.stringify(req.allParams()));
    return res.notFound('Legacy API, unused routes');
    const params = req.allParams();
    let company = await Companies.findOne({
      code: "RET",
    });
    let accountQuery = `update account_settings set orders_disabled = ${params.orders_disabled} where company_id = ${company.id};`;
    let appVersionQuery = `update app_versions set current_version = '${params.version}' where is_customer = true and company_id = ${company.id};`;
    try {
      await sails.sendNativeQuery(accountQuery);
      await sails.sendNativeQuery(appVersionQuery);
      res.ok();
    } catch (err) {
      res.serverError(err);
    }
  },
  
  // NOTE: util controller to update customer tagged areas
  correctTaggedAreas: function (req, res, next) {
    var file_name = req.file("file")._files[0].stream.filename;
    const options = {
      adapter: require("skipper-better-s3"),
      key: sails.config.globalConf.AWS_KEY,
      secret: sails.config.globalConf.AWS_SECRET,
      bucket: sails.config.globalConf.AWS_BUCKET,
      s3Params: { Key: file_name },
      region: sails.config.globalConf.AWS_REGION,
      saveAs: file_name,
    };
    req.file("file").upload(options, function (err, uploadedFiles) {
      if (err) return res.serverError(err);
      else {
        sails.log(`correctTaggedAreas file uploaded successfully; ${file_name}`);
        var s3Options = { 
          Bucket: sails.config.globalConf.AWS_BUCKET,
          Key: file_name 
        };
        const stream = s3.getObject(s3Options).createReadStream();
        let i = 0;
        let areaUpdated = [];
        let areaNotUpdated = [];
        let allCSVData = [];
        stream.pipe(
          csv()
            .on("data", async (data) => {
              if (!i) {
                i++;
              } else {
                allCSVData.push(data);
              }
            })
            .on("end", async () => {
              let phone;
              res.ok();
              let i = 1;
              for (let data of allCSVData) {
                phone = data[0];

                try {
                  const query = `select * from retailo_users.customers where phone = ${phone} and company_id = ${8}`;
                  const customer = await sails.sendNativeQuery(query);
                  if (customer.rows.length) {
                    sails.log.info(`UPDATING ${customer.rows[0].phone}`);
                    const updateQuery = `update retailo_users.customer_addresses set city_area = "${data[1]}" where customer_id = ${customer.rows[0].id}`
                    await sails.sendNativeQuery(updateQuery);
                    console.log("CITY AREAS - UPDATED ROW: ", i);
                    areaUpdated.push({ index: i, phone: data[0] })
                    i++;
                  } else {
                    areaNotUpdated.push({ index: i, phone: data[0], reason: 'customer not found' })
                    i++;
                  }
                } catch (err) {
                  areaNotUpdated.push({ index: i, phone: data[0] });
                  sails.log.info(`BULK UPDATE TAGGED AREAS - error occured while updating - ${JSON.stringify(err)}`);
                  i++;
                }
              }
              const logIdentifier = `BULK UPDATE TAGGED AREAS: `
              sails.log.info(`${logIdentifier} - updated - ${areaUpdated.length} --- ${JSON.stringify(areaUpdated)}`)

              sails.log.error(`${logIdentifier} - not updated - ${areaNotUpdated.length} --- ${JSON.stringify(areaNotUpdated)}`)
            })
        );
      }
    });
  },
  // NOTE: util controller to update customer lat/lng or area
  correctCords: function (req, res, next) {
    let params = req.allParams();
    var file_name = req.file("file")._files[0].stream.filename;
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
      else {
        console.log("uploaded sucessfully");
        var s3Options = { Bucket: sails.config.globalConf.AWS_BUCKET, Key: file_name };
        const stream = s3.getObject(s3Options).createReadStream();
        var i = 0;
        let fileName = "";
        var allCSVData = [];
        let ext = "jpeg";
        let err_phone = [];
        stream.pipe(
          csv()
            .on("data", async (data) => {
              if (!i) {
                i++;
              } else {
                allCSVData.push(data);
              }
            })
            .on("end", async () => {
              let lat,
                long,
                cords,
                phone,
                customer,
                new_cords = {},
                toBeUpdated = {};
              shopDetailsUpdate = {};
              res.ok();
              let company = await Companies.findOne({ code: "RET" });
              var i = 1;
              for (let data of allCSVData) {
                phone = data[2];
                cords = data[3];

                try {
                  customer = await Customer.findOne({
                    phone: phone,
                    company_id: company.id,
                  });
                  if (customer) {
                    data[4] != "" ? (toBeUpdated["city_area"] = data[4]) : null;
                    if (cords != "") {
                      lat = cords.split(",")[0].trim();
                      long = cords.split(",")[1].trim();
                      new_cords.latitude = parseFloat(lat);
                      new_cords.longitude = parseFloat(long);
                      toBeUpdated["location_cordinates"] = JSON.stringify(
                        new_cords
                      );
                      shopDetailsUpdate["shop_location"] = JSON.stringify(
                        new_cords
                      );
                    }
                    if (toBeUpdated) {
                      console.log("UPDATING " + customer.phone);
                      console.log(toBeUpdated);
                      await CustomerAddress.update(
                        { customer_id: customer.id },
                        toBeUpdated
                      );
                      await CustomerRetailerShopDetails.update(
                        { customer_id: customer.id },
                        shopDetailsUpdate
                      );
                      console.log("UPDATED ROW", i);
                      i++;
                    }
                  } else {
                    console.log(
                      "NO CUSTOMER FOUND for phone: " +
                        phone +
                        " and company: " +
                        company.id
                    );
                    console.log(customer);
                    i++;
                  }
                } catch (err) {
                  console.log(err);
                }
              }
            })
        );
      }
    });
  },
  
  /* NOTE: util controller to update customer cnic and verify customer or to unverify customer */
  bulkSetCustomersCNIC: function (req, res, next) {
    sails.log.error('Legacy API, unused routes called with heaeders :'
      , JSON.stringify(req.headers), '\n params :', JSON.stringify(req.allParams()));
    return res.notFound('Legacy API, unused routes');
    let params = req.allParams();
    var file_name = req.file("file")._files[0].stream.filename;
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
      else {
        sails.log(`bulkSetCustomersCNIC file uploaded successfully; ${file_name}`);
        var s3Options = { Bucket: sails.config.globalConf.AWS_BUCKET, Key: file_name };
        const stream = s3.getObject(s3Options).createReadStream();
        let i = 0;
        let notFound = [];
        let errors = [];
        let allCSVData = [];
        stream.pipe(
          csv()
            .on("data", async (data) => {
              if (!i) {
                i++;
              } else {
                allCSVData.push(data);
              }
            })
            .on("end", async () => {
              res.ok();
              let company = await Companies.findOne({ code: "RET" });
              i = 0;
              for (let data of allCSVData) {
                try {
                  let phone = data[0];
                  let cnic = data[1];
                  let customer = await Customer.findOne({
                    phone: phone,
                    company_id: company.id,
                  });
                  if (customer) {
                    let updatedCustomer;
                    if (cnic) {
                      sails.log(`Updating customer: ${customer.phone} Setting cnic: ${cnic}`);
                      updatedCustomer = await Customer.update(customer.id, {
                        verified_at: GeneralHelper.dateObjectToMySqlDateConversion(new Date()),
                        cnic: cnic,
                      })
                    } else {
                      sails.log(`Updating customer: ${customer.phone} Unverifying customer`);
                      updatedCustomer = await Customer.updateAndClearSessions(customer.id, {
                        verified_at: null,
                      });
                    }
                    sails.log(`updatedCustomer ${customer.id} ${JSON.stringify(updatedCustomer)}`);
                    i++;
                  } else {
                    notFound.push(phone);
                    sails.log(`No customer found for phone: ${phone}`);
                  }
                } catch (err) {
                  errors.push({ data: data, error: err.stack });
                  sails.log.error(`Error in finding or updating data: ${JSON.stringify(data)} Error: ${err.stack}`);
                }
                sails.log(`bulkSetCustomersCNIC updated: ${i}, not found: ${notFound.length} errors: ${errors.length} remaining: ${allCSVData.length - i - errors.length - notFound.length}`);
              }
              sails.log(`bulkSetCustomersCNIC complete. Updated: ${i} not found: ${notFound.length} errors: ${errors.length}`);
              sails.log(`Customers not found: ${notFound}`);
              sails.log(`Errors: ${errors}`);
            })
        );
      }
    });
  },
  /* NOTE: util controller to update customer coordinates */
  bulkSetCustomerCoords: function (req, res, next) {
    sails.log.error('Legacy API, unused routes called with heaeders :'
      , JSON.stringify(req.headers), '\n params :', JSON.stringify(req.allParams()));
    return res.notFound('Legacy API, unused routes');
    let params = req.allParams();
    var file_name = req.file("file")._files[0].stream.filename;
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
      else {
        sails.log(`bulkSetCustomerCoords file uploaded successfully; ${file_name}`);
        var s3Options = { Bucket: sails.config.globalConf.AWS_BUCKET, Key: file_name };
        const stream = s3.getObject(s3Options).createReadStream();
        let i = 0;
        let notFound = [];
        let errors = [];
        let allCSVData = [];
        stream.pipe(
          csv()
            .on("data", async (data) => {
              if (!i) {
                i++;
              } else {
                allCSVData.push(data);
              }
            })
            .on("end", async () => {
              res.ok();
              let company = await Companies.findOne({ code: "RET" });
              i = 0;
              for (let data of allCSVData) {
                try {
                  let phone = data[0];
                  let coords = data[1];
                  let customer = await Customer.findOne({
                    phone: phone,
                    company_id: company.id,
                  });
                  if (customer && coords) {
                    let latitude = parseFloat(coords.split(",")[0].trim());
                    let longitude = parseFloat(coords.split(",")[1].trim());
                    let new_coords = { latitude: latitude, longitude: longitude };

                    sails.log(`Updating CustomerRetailerShopDetails, CustomerAddress phone: ${customer.phone} customerID: ${customer.id} Setting coords: ${JSON.stringify(new_coords)}`);
                    let updatedCustomerRetailerShopDetails = await CustomerRetailerShopDetails.update(
                      { customer_id: customer.id },
                      { shop_location: JSON.stringify(new_coords) }
                    );
                    sails.log(`updated CustomerRetailerShopDetails phone: ${customer.phone} customerID: ${customer.id} ${JSON.stringify(updatedCustomerRetailerShopDetails)}`);
                    let updatedCustomerAddress = await CustomerAddress.update(
                      { customer_id: customer.id },
                      { location_cordinates: JSON.stringify(new_coords) }
                    );
                    sails.log(`updated CustomerAddress phone: ${customer.phone} customerID: ${customer.id} ${JSON.stringify(updatedCustomerAddress)}`);
                    i++;
                  } else {
                    notFound.push(phone);
                    sails.log(`No customer found for phone: ${phone} or no coords provided: ${coords}`);
                  }
                } catch (err) {
                  errors.push({ data: data, error: err.stack });
                  sails.log.error(`Error in finding or updating data: ${JSON.stringify(data)} Error: ${err.stack}`);
                }
                sails.log(`bulkSetCustomerCoords updated: ${i}, not found: ${notFound.length} errors: ${errors.length} remaining: ${allCSVData.length - i - errors.length - notFound.length}`);
              }
              sails.log(`bulkSetCustomerCoords complete. Updated: ${i} not found: ${notFound.length} errors: ${errors.length}`);
              sails.log(`Customers not found: ${notFound}`);
              sails.log(`Errors: ${errors}`);
            })
        );
      }
    });
  },
  /* NOTE: util controller to update customer coordinates */
  bulkSetCustomerAreas: function (req, res, next) {
    sails.log.error('Legacy API, unused routes called with heaeders :'
      , JSON.stringify(req.headers), '\n params :', JSON.stringify(req.allParams()));
    return res.notFound('Legacy API, unused routes');
    let params = req.allParams();
    var file_name = req.file("file")._files[0].stream.filename;
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
      else {
        sails.log(`bulkSetCustomerAreas file uploaded successfully; ${file_name}`);
        var s3Options = { Bucket: sails.config.globalConf.AWS_BUCKET, Key: file_name };
        const stream = s3.getObject(s3Options).createReadStream();
        let i = 0;
        let notFound = [];
        let errors = [];
        let allCSVData = [];
        stream.pipe(
          csv()
            .on("data", async (data) => {
              if (!i) {
                i++;
              } else {
                allCSVData.push(data);
              }
            })
            .on("end", async () => {
              res.ok();
              let company = await Companies.findOne({ code: "RET" });
              i = 0;
              for (let data of allCSVData) {
                try {
                  let phone = data[0];
                  let city_area = data[1];
                  let customer = await Customer.findOne({
                    phone: phone,
                    company_id: company.id,
                  });
                  if (customer && city_area) {
                    sails.log(`Updating CustomerAddress phone: ${customer.phone} customerID: ${customer.id} Setting area: ${city_area}`);
                    let updatedCustomerAddress = await CustomerAddress.update(
                      { customer_id: customer.id },
                      { city_area: city_area }
                    );
                    sails.log(`updated CustomerAddress phone: ${customer.phone} customerID: ${customer.id} ${JSON.stringify(updatedCustomerAddress)}`);
                    i++;
                  } else {
                    notFound.push(phone);
                    sails.log(`No customer found for phone: ${phone} or no city_area provided: ${city_area}`);
                  }
                } catch (err) {
                  errors.push({ data: data, error: err.stack });
                  sails.log.error(`Error in finding or updating data: ${JSON.stringify(data)} Error: ${err.stack}`);
                }
                sails.log(`bulkSetCustomerAreas updated: ${i}, not found: ${notFound.length} errors: ${errors.length} remaining: ${allCSVData.length - i - errors.length - notFound.length}`);
              }
              sails.log(`bulkSetCustomerAreas complete. Updated: ${i} not found: ${notFound.length} errors: ${errors.length}`);
              sails.log(`Customers not found: ${notFound}`);
              sails.log(`Errors: ${errors}`);
            })
        );
      }
    });
  },
  /*
  profileLock: async function (req, res, next) {
    // the string identifier for the resource you want to lock
    const params = req.allParams();

    var resource = `locks:product_id:${params.id}`;
    var functionTime = new Date().getTime();

    // the maximum amount of time you want the resource locked in milliseconds,
    // keeping in mind that you can extend the lock up until
    // the point when it expires
    var ttl = 1000;
    redlock.lock(resource, ttl, async function(err, lock) {
      var lockTime = new Date().getTime();
      // we failed to lock the resource
      if(err) {
          // ...
          console.log(err);
      }
   
      // we have the lock
      else {
        // ...do something here...

        let product_id = params.id;
        var getTime = new Date().getTime();
        let products = await Product.find({
          id: product_id,
        });
        var getEndTime = new Date().getTime();
        if (products.length > 0) {
          var updateTime = new Date().getTime();

          let product = products[0];
          product.stock_quantity = product.stock_quantity + 2;
          product.tax_category = 0;
          let updatedProduct = await productDao.update(product_id, product);
          var updateEndTime = new Date().getTime();
        }
        // unlock your resource when you are done
        var lockEndTime = new Date().getTime();

        lock.unlock(function(err) {
            // we weren't able to reach redis; your lock will eventually
            // expire, but you probably want to log this error
            if (err) {
            console.error("error so unlocked");
            console.log(err);
            } else {
              var functionEndTime = new Date().getTime();

              functionTime = functionEndTime- functionTime;
              lockTime = lockEndTime - lockTime;
              getTime = getEndTime - getTime;
              updateTime = updateEndTime - updateTime;
              res.ok({functionTime: functionTime, lockTime: lockTime, getTime: getTime, updateTime: updateTime});
            }
        });
      }
    });
  },
  */
  /* NOTE: Controller to send an HTML file in the body of an email using AWS SES */
  sendHtmlFileThroughAwsSes: async function (req, res, next) {
    const params = req.allParams();
    let meta = {
      reqId: params.id,
      userData: res.locals.userData || 'N/A',
      caller: "UtilsController.sendHtmlFileThroughAwsSes()"
    };
    let logIdentifier = `ReqID: ${meta.reqId}, UserID: ${meta.userData.id}, context: ${req.url},`;
    const bodyHtmlFileKey = 'bodyHtmlFile';
    const bodyHtmlFileName = req.file('bodyHtmlFile')._files[0].stream.filename;
    sails.log.info(`${logIdentifier} In UtilsController.sendHtmlFileThroughAwsSes() called with params: destinationsArray: ${params.destinationsArray}, subject: ${params.subject}, bodyHtmlFile: ${bodyHtmlFileName}`);
    const bodyHtmlFileStream = req.file(bodyHtmlFileKey)._files[0].stream;
    try {
      bodyHtmlString = await MailerService.htmlFileStreamToString(bodyHtmlFileStream);
    } catch (err) {
      sails.log.error("Error in UtilsController.sendHtmlFileThroughAwsSes: ", err)
      return res.badRequest({ message: "Invalid input html file" });
    }
    try {
      await MailerService.sendEmailThroughAwsSes(params.destinationsArray, params.subject, bodyHtmlString);
      res.ok({ message: "Success. Sending email." });
    } catch (err) {
      sails.log.error("Error in UtilsController.sendHtmlFileThroughAwsSes: ", err)
      return res.serverError({ message: "Error while sending email." });
    }
  },

  /**
  * NOTE: controller to sync retailo products to odoo, one time sync 
  * made this controller location wise, because we dont need to sync fb area products, so products can be synced location by location
  */
  syncProductsToOdoo: async (req, res) => {
    const { location_id } = req.allParams()
    const products = await Products.find({ location_id }).populate('location_id');
    for (const product of products) {
      try {
        const response = await OdooService.addProduct(product)
      } catch (err) {
        sails.log.error(`error on product number ${products.indexOf(product) + 1} - ID: ${product.id} - SKU: ${product.sku}`)
        continue;
      }
    }
    res.ok('All products synced');
  },
  /* NOTE: util controller to set category images  */
  setCategoryImages: function (req, res, next) {
    sails.log.error('Legacy API, unused routes called with heaeders :'
      , JSON.stringify(req.headers), '\n params :', JSON.stringify(req.allParams()));
    return res.notFound('Legacy API, unused routes');
    var file_name = req.file("file")._files[0].stream.filename;
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
      else {
        sails.log(`set category images file uploaded successfully; ${file_name}`);
        var s3Options = { Bucket: sails.config.globalConf.AWS_BUCKET, Key: file_name };
        const stream = s3.getObject(s3Options).createReadStream();
        let i = 0;
        stream.pipe(
          csv()
            .on("data", async (data) => {
              if (!i) {
                i++;
              } else {
                try {
                  let updatedCategory = await Categories.updateOne({
                    id: data[0]
                  }, { image_url: data[1] })
                  sails.log.info(`updated category ${i} - updated category ${JSON.stringify(updatedCategory)}`)
                } catch (err) {
                  sails.log.error(`Error in finding or updating data: ${JSON.stringify(data)} Error: ${err.stack}`);
                }
              }
            })
            .on("end", async () => {
              res.ok();
            })
        );
      }
    });
  },

  createMissingSaleOrdersOnOdoo: function (req, res, next) {
    var file_name = req.file("file")._files[0].stream.filename;
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
      else {
        sails.log(`bulkSetCustomerAreas file uploaded successfully; ${file_name}`);
        var s3Options = { Bucket: sails.config.globalConf.AWS_BUCKET, Key: file_name };
        const stream = s3.getObject(s3Options).createReadStream();
        let i = 0;
        let saleOrderCreated = [];
        let saleOrderNotCreated = [];
        let allCSVData = [];
        stream.pipe(
          csv()
            .on("data", async (data) => {
              if (!i) {
                i++;
              } else {
                allCSVData.push(data);
              }
            })
            .on("end", async () => {
              res.ok();
              for (const data of allCSVData) {
                let odooProducts = [];
                const batch = await DeliveryBatch.findOne({
                  id: parseInt(data[0])
                });
                const user = await User.findOne({
                  id: batch.assigned_to
                });
                const odooSession = await getSessionId(false);
                const products = JSON.parse(batch.products);
                for (let product of products) {
                  odooProducts.push({
                    productId: product.id,
                    quantity: product.onboarded_quantity
                  });
                }
                try {
                  await OdooRestClient.createSaleOrder(odooSession.session_id, batch.id, user, odooProducts, batch.location_id);
                  saleOrderCreated.push({
                    index: i,
                    batch: batch.id,
                    result: "sale order created",
                  });
                  console.log(`sale order created against batch ${batch.id} `);
                  i++;
                } catch (err) {
                  sails.log.error(`error while trying ${batch.id}`)
                  saleOrderNotCreated.push({
                    index: i,
                    batch: batch.id,
                    result: "sale order not created",
                  });
                  console.log(`sale order not created against batch ${batch.id} `);
                  i++;
                }
              }
              const logIdentifier = `SALE ORDER BULK CREATE: `
              sails.log.info(`${logIdentifier} - created sale orders - ${saleOrderCreated.length} --- ${JSON.stringify(saleOrderCreated)}`)

              sails.log.error(`${logIdentifier} - not created sale orders - ${saleOrderNotCreated.length} --- ${JSON.stringify(saleOrderNotCreated)}`)
            })
        );
      }
    });
  },

  createMissingDeliveryReturnsOnOdoo: function (req, res, next) {
    var file_name = req.file("file")._files[0].stream.filename;
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
      else {
        sails.log(`createMissingDeliveryReturnsOnOdoo file uploaded successfully; ${file_name}`);
        var s3Options = { Bucket: sails.config.globalConf.AWS_BUCKET, Key: file_name };
        const stream = s3.getObject(s3Options).createReadStream();
        let i = 0;
        let deliveryReturnCreated = [];
        let deliveryReturnNotCreated = [];
        let allCSVData = [];
        stream.pipe(
          csv()
            .on("data", async (data) => {
              if (!i) {
                i++;
              } else {
                allCSVData.push(data);
              }
            })
            .on("end", async () => {
              res.ok();
              for (const data of allCSVData) {
                let odooProducts = [];
                const batch = await DeliveryBatch.findOne({
                  id: parseInt(data[0])
                });
                const odooSession = await getSessionId(false);
                const products = JSON.parse(batch.products);
                for (let product of products) {
                  if (product.onboarded_quantity > 0) {
                    odooProducts.push({
                      productId: product.id,
                      product_qty: product.return_quantity
                    });
                  }
                }
                try {
                  await OdooRestClient.createDeliveryReturn(odooSession.session_id, batch.id, odooProducts);
                  deliveryReturnCreated.push({
                    index: i,
                    batch: batch.id,
                    result: "delivery return created",
                  });
                  console.log(`delivery return created against batch ${batch.id} `);
                  i++;
                } catch (err) {
                  sails.log.error(`error while trying ${batch.id}`)
                  saleOrderNotCreated.push({
                    index: i,
                    batch: batch.id,
                    result: "delivery return not created",
                  });
                  console.log(`delivery return not created against batch ${batch.id} `);
                  i++;
                }
              }
              const logIdentifier = `DELIVERY RETURN BULK CREATE: `
              sails.log.info(`${logIdentifier} - created delivery returns - ${deliveryReturnCreated.length} --- ${JSON.stringify(deliveryReturnCreated)}`)

              sails.log.error(`${logIdentifier} - not created delivery returns - ${deliveryReturnNotCreated.length} --- ${JSON.stringify(deliveryReturnNotCreated)}`)
            })
        );
      }
    });
  },

  /**
   * controller to update trade_price and mrp for products
   * @param {*} req 
   * @param {*} res 
   * @param {*} next 
   * @returns {Promise<{}>}
   */

  updateTpAndMrp: function (req, res, next) {
    var file_name = req.file("file")._files[0].stream.filename;
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
      else {
        sails.log(`updateTpAndMrp file uploaded successfully; ${file_name}`);
        var s3Options = { Bucket: sails.config.globalConf.AWS_BUCKET, Key: file_name };
        const stream = s3.getObject(s3Options).createReadStream();
        let i = 0;
        let productsUpdated = [];
        let productsNotUpdated = [];
        let allCSVData = [];
        stream.pipe(
          csv()
            .on("data", async (data) => {
              if (!i) {
                i++;
              } else {
                allCSVData.push(data);
              }
            })
            .on("end", async () => {
              res.ok();
              for (const data of allCSVData) {
                // removed disabled since product team wants to update disabled items as well
                const product = await Product.findOne({
                  sku: data[0],
                  location_id: parseInt(data[3])
                })
                if (product) {
                  const updateObj = {
                    mrp: data[1] ? parseFloat(data[1]) : product.mrp,
                    trade_price: data[2] ? parseFloat(data[2]) : product.trade_price
                  }
                  try {
                    await Product.updateOne({
                      id: product.id
                    }, updateObj);
                    productsUpdated.push({
                      index: i,
                      batch: data[0],
                      result: `product updated successfully`,
                    });
                    console.log(`product updated successfully ${product.id} `);
                    i++;
                  } catch (err) {
                    sails.log.error(`error while trying ${parseInt(data[0])}`)
                    productsNotUpdated.push({
                      index: i,
                      batch: data[0],
                      result: "product not updated!!",
                    });
                    console.log(`product update failed ${parseInt(data[0])} `);
                    i++;
                  }
                } else {
                  sails.log.error(`error while updating ${parseInt(data[0])}`)
                  productsNotUpdated.push({
                    index: i,
                    batch: data[0],
                    result: "product not found",
                  });
                  console.log(`product update failed ${data[0]} `);
                  i++;
                }
              }
              const logIdentifier = `PRODUCT TRADE PRICE AND MRP BULK UPDATE: `
              sails.log.info(`${logIdentifier} - updated products - ${productsUpdated.length} --- ${JSON.stringify(productsUpdated)}`)

              sails.log.error(`${logIdentifier} - failed to update products - ${productsNotUpdated.length} --- ${JSON.stringify(productsNotUpdated)}`)
            })
        );
      }
    });
  },

  createMissingProductsOnOdoo: function (req, res, next) {
    var file_name = req.file("file")._files[0].stream.filename;
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
      else {
        sails.log(`createMissingProductsOnOdoo file uploaded successfully; ${file_name}`);
        var s3Options = { Bucket: sails.config.globalConf.AWS_BUCKET, Key: file_name };
        const stream = s3.getObject(s3Options).createReadStream();
        let i = 0;
        let productsCreated = [];
        let productsNotCreated = [];
        let allCSVData = [];
        stream.pipe(
          csv()
            .on("data", async (data) => {
              if (!i) {
                i++;
              } else {
                allCSVData.push(data);
              }
            })
            .on("end", async () => {
              res.ok();
              for (const data of allCSVData) {
                const product = await Product.findOne({
                  id: parseInt(data[0])
                }).populate('location_id');
                const odooSession = await getSessionId(false);
                try {
                  await OdooRestClient.addProduct(odooSession.session_id, product);
                  productsCreated.push({
                    index: i,
                    product: product.id,
                    result: "product created",
                  });
                  console.log(`product created against ${product.id} `);
                  i++;
                } catch (err) {
                  sails.log.error(`error while trying ${product.id}`)
                  productsNotCreated.push({
                    index: i,
                    product: product.id,
                    result: "product not created",
                  });
                  console.log(`product not created against ${product.id} `);
                  i++;
                }
              }
              const logIdentifier = `ODOO PRODUCT BULK CREATE: `
              sails.log.info(`${logIdentifier} - created products - ${productsCreated.length} --- ${JSON.stringify(productsCreated)}`)

              sails.log.error(`${logIdentifier} - not created products - ${productsNotCreated.length} --- ${JSON.stringify(productsNotCreated)}`)
            })
        );
      }
    });
  },


  /**
   * controller to bulk enable features for customers
   * @param {*} req 
   * @param {*} res 
   * @param {*} next 
   * @returns {Promise<{}>}
   */

  bulkToggleFeatureForCustomers: function (req, res, next) {
    sails.log.error('Legacy API, unused routes called with heaeders :'
      , JSON.stringify(req.headers), '\n params :', JSON.stringify(req.allParams()));
    if (!req.headers.apikey || sails.config.globalConf.API_KEY !== req.headers.apikey) {
      return res.unauthorized();
    }
    if (!req.file("file")._files.length) {
      return res.badRequest('please attach file to continue!');
    }
    const file_name = req.file("file")._files[0].stream.filename;
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
      else {
        sails.log(`bulkToggleFeatureForCustomers file uploaded successfully; ${file_name}`);
        var s3Options = { Bucket: sails.config.globalConf.AWS_BUCKET, Key: file_name };
        const stream = s3.getObject(s3Options).createReadStream();
        let i = 0;
        let customersUpdated = [];
        let customersNotUpdated = [];
        let allCSVData = [];
        stream.pipe(
          csv()
            .on("data", async (data) => {
              if (!i) {
                i++;
              } else {
                allCSVData.push(data);
              }
            })
            .on("end", async () => {
              res.ok();
              for (const data of allCSVData) {
                const customerId = parseInt(data[0]);
                const featureId = parseInt(data[1]);
                const tableName = data[3] && parseInt(data[3]) ? 'user_feature_junction': 'customer_feature_junction';
                const attributeName = data[3] && parseInt(data[3]) ? 'user_id': 'customer_id';
                const customerJunctionQuery = `select * from retailo_feature.${tableName} where ${attributeName} = ${customerId} and feature_id = ${featureId}`
                const findFeatureJunction = await sails.sendNativeQuery(customerJunctionQuery);
                sails.log.info(`going to update table - ${tableName} and attribute - ${attributeName}`);
                try {
                  sails.log.info(`checking for existing record to update otherwise create`)
                  if (findFeatureJunction.rows.length) {
                    sails.log.info(`updating record against criteria ${customerId} - ${featureId}`)
                    const disabledRecord = data[2] ? parseInt(data[2]) : findFeatureJunction.rows[0].disabled;
                    const updateQuery = `update retailo_feature.${tableName} set disabled = ${disabledRecord} where ${attributeName} = ${customerId} and feature_id = ${featureId}`
                    await sails.sendNativeQuery(updateQuery);
                  } else {
                    sails.log.info(`creating record against criteria ${customerId} - ${featureId}`)
                    const insertQuery = `INSERT INTO retailo_feature.${tableName} (${attributeName}, feature_id, disabled) VALUES (${customerId}, ${featureId}, 0)`;
                    await sails.sendNativeQuery(insertQuery);
                  }
                  customersUpdated.push({
                    index: i,
                    customerId: customerId,
                    result: `customer record update/created successfully`,
                  });
                  console.log(`customer record updated/created ${customerId} `);
                  i++;
                } catch (error) {
                  sails.log.error(`error while updating ${parseInt(customerId)}`)
                  customersNotUpdated.push({
                    index: i,
                    customerId: customerId,
                    result: `customer not updated - ${customerId}`,
                  });
                  console.log(`error occured while updating customer - ${customerId} `);
                  i++;
                }
              }
              const logIdentifier = `CUSTOMER FEATURE BULK UPDATE: `
              sails.log.info(`${logIdentifier} - updated customer - ${customersUpdated.length} --- ${JSON.stringify(customersUpdated)}`)
              sails.log.error(`${logIdentifier} - failed to update customers - ${customersNotUpdated.length} --- ${JSON.stringify(customersNotUpdated)}`)

            })
        );
      }
    });
  },

  /**
   * controller to bulk create customers { seed data for kyc }
   * [DISCLAIMER]: this controller should be removed before live
   * @param {*} req 
   * @param {*} res 
   * @param {*} next 
   * @returns {Promise<{}>}
   */
  bulkCreateCustomers: async function (req, res, next) {
    sails.log.error('Legacy API, unused routes called with heaeders :'
      , JSON.stringify(req.headers), '\n params :', JSON.stringify(req.allParams()));
    return res.notFound('Legacy API, unused routes');
    const { body: { customersToBeCreated } } = req;
    for (let i = 0; i < customersToBeCreated; i++) {
      const customerJson = {
        phone: `92333${Math.floor(Math.random() * (9999999 - 1000000) + 1000000)}`,
        email: `moeed.shahid.0${i}@retailo.co`,
        cnic: `${Math.floor(Math.random() * (99999 - 10000) + 10000)}-${Math.floor(Math.random() * (9999999 - 1000000) + 1000000)}-${Math.floor(Math.random() * (9 - 1) + 1)}`,
        name: `moeed-0${i}`,
        address: `Walton Road, Lahore - ${i}`,
        language: 1,
        device_name: `test user - 0${i}`,
      };
      const address = {
        address: `test address - 0${i}`,
        address_line_1: "addresss line 1",
        address_line_2: "addresss line 2",
        location_cordinates: "{\"latitude\":25.074225794312923,\"longitude\":67.07717694973698}",
      };
      let shop = {
        shop_location: "{\"latitude\":25.074225794312923,\"longitude\":67.07717694973698}",
        shop_name: `Auto test store - 0${i}`,
        shop_type_id: 1,
      };
      if (process.env.NODE_ENV === "stage") {
        shop = {
          shop_location: "{\"latitude\":24.235626417239928,\"longitude\":70.72463788723698}",
          shop_name: `Auto test store - 0${i}`,
          shop_type_id: 1,
        };
      }
      const order = {
        location_id: 13,
        status_id: 2,
        service_charge_type: 'FLAT',
        service_charge_value: 0.00,
        delivery_charge_type: 'FLAT',
        delivery_charge_value: 0.00,
        placed_at: new Date()
      };
      const orderItem = {
        quantity: 1,
        original_quantity: 1,
      }
      const product = (await Product.find({ location_id: 13, disabled: false }))[0];
      const verification_code = `${Math.floor(Math.random() * 100000)}`;
      const pin_code = CipherService.hashPassword(verification_code);
      const customer = await Customer.create({ ...customerJson, company_id: 4, business_unit_id: 4, pin_code, verification_code, verified_at: new Date() })
      const shopDetails = await CustomerRetailerShopDetails.create({ ...shop, customer_id: customer.id })
      const customerAddress = await CustomerAddress.create({ ...address, customer_id: customer.id })
      const createdOrder = await Order.create({ ...order, total_price: product.price, customer_id: customer.id, customer_address_id: customerAddress.id });
      const createdOrderItem = await OrderItems.create({ ...orderItem, product_id: product.id, price: product.price, order_id: createdOrder.id })
      const orderHistory = await OrderHistory.create({ order_id: createdOrder.id, status_id: 2 });
      const orderStatusHistory = await OrderStatusHistory.create({ order_id: createdOrder.id, status_id: 2 });
    }
    res.ok();
  },
  softDeleteProduct: function (req, res, next) {
    sails.log.error('Legacy API, unused routes called with heaeders :'
      , JSON.stringify(req.headers), '\n params :', JSON.stringify(req.allParams()));
    return res.notFound('Legacy API, unused routes');
    var file_name = req.file("file")._files[0].stream.filename;
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
      else {
        sails.log(`bulk soft delete products file uploaded successfully; ${file_name}`);
        var s3Options = { Bucket: sails.config.globalConf.AWS_BUCKET, Key: file_name };
        const stream = s3.getObject(s3Options).createReadStream();
        let i = 0;
        let allCSVData = [];
        stream.pipe(
          csv()
            .on("data", async (data) => {
              if (!i) {
                i++;
              } else {
                allCSVData.push(data);
              }
            })
            .on("end", async () => {
              res.ok();
              for (const data of allCSVData) {
                try {
                  const [sku, location_id] = data;
                  console.log(sku, location_id);
                  const [product] = await Product.update({ sku, location_id, disabled: 1 }).set({ deleted_at: new Date() }).fetch();
                  console.log('product', product);
                  const res = await elasticSeachClient
                    .deleteData([product.id]);
                  console.log(`Product Deleted Successfully ${sku} ${location_id}`);
                  i++;
                } catch (err) {
                  console.log(`Product Not Deleted ${err} `);
                  i++;
                }
              }
            })
        );
      }
    });
  },

  /**
   * controller to update tax_percentage and tax_category for products
   * @param {*} req 
   * @param {*} res 
   * @param {*} next 
   * @returns {Promise<{}>}
   */

  updateTaxRateAndCategory: function (req, res, next) {
    sails.log.error('Legacy API, unused routes called with heaeders :'
      , JSON.stringify(req.headers), '\n params :', JSON.stringify(req.allParams()));
    return res.notFound('Legacy API, unused routes');
    var file_name = req.file("file")._files[0].stream.filename;
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
      else {
        sails.log(`updateTaxRateAndCategory file uploaded successfully; ${file_name}`);
        var s3Options = { Bucket: sails.config.globalConf.AWS_BUCKET, Key: file_name };
        const stream = s3.getObject(s3Options).createReadStream();
        let i = 0;
        let productsUpdated = [];
        let productsNotUpdated = [];
        let allCSVData = [];
        stream.pipe(
          csv()
            .on("data", async (data) => {
              if (!i) {
                i++;
              } else {
                allCSVData.push(data);
              }
            })
            .on("end", async () => {
              res.ok();
              for (const data of allCSVData) {
                // removed disabled since product team wants to update disabled items as well
                const product = await Product.findOne({
                  sku: data[0],
                  location_id: parseInt(data[4])
                })
                if (product) {
                  const updateObj = {
                    tax_percent: data[1] ? parseFloat(data[1]) : product.tax_percent,
                    tax_category: data[2] ? parseInt(data[2]) : product.tax_category,
                    tax_inclusive: data[3] ? parseInt(data[3]) : product.tax_inclusive
                  }
                  try {
                    await Product.updateOne({
                      id: product.id
                    }, updateObj);
                    productsUpdated.push({
                      index: i,
                      batch: data[0],
                      result: `product updated successfully`,
                    });
                    console.log(`product updated successfully ${product.id} `);
                    i++;
                  } catch (err) {
                    sails.log.error(`error while trying ${parseInt(data[0])}`)
                    productsNotUpdated.push({
                      index: i,
                      batch: data[0],
                      result: "product not updated!!",
                    });
                    console.log(`product update failed ${parseInt(data[0])} `);
                    i++;
                  }
                } else {
                  sails.log.error(`error while updating ${parseInt(data[0])}`)
                  productsNotUpdated.push({
                    index: i,
                    batch: data[0],
                    result: "product not found",
                  });
                  console.log(`product update failed ${data[0]} `);
                  i++;
                }
              }
              const logIdentifier = `PRODUCT TAX PERCENTAGE AND TAX CATEGORY BULK UPDATE: `
              sails.log.info(`${logIdentifier} - updated products - ${productsUpdated.length} --- ${JSON.stringify(productsUpdated)}`)

              sails.log.error(`${logIdentifier} - failed to update products - ${productsNotUpdated.length} --- ${JSON.stringify(productsNotUpdated)}`)
            })
        );
      }
    });
  },

  /**
   * controller to update order status from in transit to pack
   * @param {*} req 
   * @param {*} res 
   * @param {*} next 
   * @returns {Promise<{}>}
   */

  updateOrderStatusPacked: async (req, res, next) => {
    const { orderIds } = req.allParams();
    const logIdentifier = `ORDER BULK PACK: `
    const failedOrders = [];
    for (const orderId of orderIds) {
      const order = await Order.findOne({ id: orderId })
      if (order.status_id !== 5) continue; // skip if order status is not in transit
      sails.log.info(`${logIdentifier} updating order status from in transit to pack for order ${orderId}`);
      try {
        await Order.update({ id: orderId }, { status_id: 4 });
        await OrderHistory.create({ order_id: orderId, status_id: 4 });
        await OrderStatusHistory.create({ order_id: orderId, status_id: 4 });
      } catch (err) {
        failedOrders.push(orderId);
        console.log("ERROR", err)
        sails.log.error(`${logIdentifier} error occured while updating order status from in transit to pack for order ${orderId}`);
        continue;
      }
    }
    res.ok(failedOrders.length ? `order failed - ${JSON.stringify(failedOrders)}` : 'all orders are marked packed successfully')
  },

  /**
   * controller to create recommended products
   * @param {*} req 
   * @param {*} res 
   * @param {*} next 
   * @returns {Promise<{}>}
   */

  createRecommendedProducts: function (req, res, next) {
    var file_name = req.file("file")._files[0].stream.filename;
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
      else {
        sails.log(`createRecommendedProducts file uploaded successfully; ${file_name}`);
        var s3Options = { Bucket: sails.config.globalConf.AWS_BUCKET, Key: file_name };
        const stream = s3.getObject(s3Options).createReadStream();
        let i = 0;
        const recordCreated = [];
        const recordNotCreated = [];
        const allCSVData = [];
        stream.pipe(
          csv()
            .on("data", async (data) => {
              if (!i) {
                i++;
              } else {
                allCSVData.push(data);
              }
            })
            .on("end", async () => {
              res.ok();
              i = 1;
              for (const data of allCSVData) {
                try {
                  const products = await RecommendedProductSQL.find({ customer_id: parseInt(data[0]) });
                  if (!products.length) {
                    await RecommendedProductSQL.create({
                      customer_id: parseInt(data[0]),
                      product_ids: data[1]
                    });
                    recordCreated.push({index: i, customerId: data[0] });
                    console.log(`record created successfully - customer: ${parseInt(data[0])} - count: ${i}`);
                    i++;
                  } else {
                    let indexToUpdate = 0;
                    if (products.length > 1) {
                      await RecommendedProductSQL.destroy({
                        id: products[0].id,
                      });
                      indexToUpdate = 1;
                      console.log(`record deleted successfully - customer: ${parseInt(data[0])} `);
                    }
                    await RecommendedProductSQL.updateOne({
                      id: products[indexToUpdate].id,
                    }, { product_ids: data[1] });
                    console.log(`record updated successfully - customer: ${parseInt(data[0])} - count: ${i}`);
                    i++;
                  }
                } catch (err) {
                  sails.log.error(`error while trying adding for customer: ${parseInt(data[0])} - error: ${JSON.stringify(err)}`)
                  recordNotCreated.push({ index: i, customerId: data[0] });
                  console.log(`record creation failed - customer: ${parseInt(data[0])} - count: ${i}`);
                  i++;
                }          
              }
              const logIdentifier = `CREATE RECOMMENDED PRODUCTS FOR CUSTOMER: `
              sails.log.info(`${logIdentifier} - created records - ${recordCreated.length} --- ${JSON.stringify(recordCreated)}`)
              sails.log.error(`${logIdentifier} - failed to create records - ${recordNotCreated.length} --- ${JSON.stringify(recordNotCreated)}`)
            })
        );
      }
    });
  },

  /**
   * controller to bulk create customers for dubai
   * @param {*} req 
   * @param {*} res 
   * @param {*} next 
   * @returns {Promise<{}>}
   */

  bulkAddCustomersForBu: function (req, res, next) {
    var file_name = req.file("file")._files[0].stream.filename;
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
      else {
        sails.log(`bulkAddCustomersForBu file uploaded successfully; ${file_name}`);
        var s3Options = { Bucket: sails.config.globalConf.AWS_BUCKET, Key: file_name };
        const stream = s3.getObject(s3Options).createReadStream();
        let i = 0;
        let customersCreated = [];
        let customersNotCreated = [];
        let allCSVData = [];
        stream.pipe(
          csv()
            .on("data", async (data) => {
              if (!i) {
                i++;
              } else {
                allCSVData.push(data);
              }
            })
            .on("end", async () => {
              res.ok();
              let i = 1;
              for (const data of allCSVData) {
                const coords = JSON.stringify({
                  latitude: data[7],
                  longitude: data[8]
                });
                const params = {
                  "phone": data[1],
                  "name": data[2],
                  "customer": {
                    "termsAccepted": true,
                    "supervisorId": 1,
                    "language": "en-Us",
                    "location": coords,
                    "orderMode": 1,
                    "hasSmartPhone": true,
                    "selfSignUp": true,
                    "address": {
                      "addressLine1": data[6],
                      "coordinates": coords,
                      "deliveredLocationCordinates": coords,
                    }
                  },
                  "shop": {
                    "location": coords,
                    "name": data[3],
                    "typeId": 1
                  }
                };
                try {
                  const res = await axios.post({
                    url: "https://prod.retailo.me/user/customer/signup",
                    data: params,
                    headers: {
                      'App-Type': "CONSUMER",
                    },
                  });
                  sails.log(`BULK CREATE CUSTOMERS FLOW: created customer ${JSON.stringify(res)}`);
                  customersCreated.push({ index: i, phone: data[1] });
                  console.log("ADDED CUSTOMER COUNT - ", i);
                  i++;
                } catch (err) {
                  customersNotCreated.push({ index: i, phone: data[1] });
                  sails.log.info(`BULK CREATE CUSTOMERS FLOW: error occured while creating customer - ${JSON.stringify(err)}`);
                  i++;
                }
              }
              const logIdentifier = `BULK CREATE CUSTOMERS FOR BU: `
              sails.log.info(`${logIdentifier} - created customers - ${customersCreated.length} --- ${JSON.stringify(customersCreated)}`)

              sails.log.error(`${logIdentifier} - failed to create customers - ${customersNotCreated.length} --- ${JSON.stringify(customersNotCreated)}`)
            })
        );
      }
    });
  },

  /**
   * controller to bulk update physical stock - products
   * @param {*} req 
   * @param {*} res 
   * @param {*} next 
   * @returns {Promise<{}>}
   */

  // NOTE: we will use this data migration code later in the future
  updatePhysicalQuantity: async function (req, res, next) {
    sails.log(`bulk update physical stock products`);
    sails.log(`--------------total products------------------: ${await Product.count()}`);

    const update = async (lastId, index = 0) => {
      const criteria = { select: ["id", "stock_quantity", "physical_stock"] };
      if (lastId) criteria.where = { id: { ">": lastId } };
      const products = camelcaseKeys(await Product.find(criteria).limit(500));
      if (!products || products.length <= 0) {
        sails.log(`bulk update physical stock products done`);
        return Promise.resolve();
      } 
      const productIds = _.map(products, "id");
      const orderItems = camelcaseKeys(await OrderItems.find({ 
        select: ["order_id", "product_id", "original_quantity", "packed_quantity"],
        where: { product_id: { in: productIds } }
      }));
      const orderIds = _.compact(_.map(orderItems, "orderId"));
      const current = new Date();
      const fourtyEightHoursBack = new Date(current.setTime(current.getTime() - (2 * 24 * 60 * 60 * 1000)));
      const orders = camelcaseKeys(await Order.find({ 
        select: ["status_id"],
        where: { id: { in: orderIds }, status_id: { in: [2, 12] }, placed_at: { ">": fourtyEightHoursBack } }
      }));
      const productArr = []
      for (const order of orders) {
        productArr.push(...(_.filter(orderItems, { orderId: order.id }) || []));
      }
      const productGroup = _.groupBy(productArr, "productId");
      for (const key in productGroup) {
        if (Object.hasOwnProperty.call(productGroup, key)) {
          const productOriginalQuantity = _.sum(productGroup[key], "originalQuantity");
          const product = _.find(products, { id: parseInt(key) });
          await Product.updateOne({
            id: product.id
          }, {
            physical_stock: productOriginalQuantity + product.stockQuantity,
          });
        }
      }

      await update(products[products.length - 1].id);
    }

    res.ok();
    await update();
  },
  

  /**
   * controller to bulk create send sms
   * @param {*} req 
   * @param {*} res 
   * @param {*} next 
   * @returns {Promise<{}>}
   */

  bulkSendMessagesAndSetBu: function (req, res, next) {
    var file_name = req.file("file")._files[0].stream.filename;
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
      else {
        sails.log(`bulkSendMessagesAndSetBu file uploaded successfully; ${file_name}`);
        var s3Options = { Bucket: sails.config.globalConf.AWS_BUCKET, Key: file_name };
        const stream = s3.getObject(s3Options).createReadStream();
        let i = 0;
        let smsSent = [];
        let smsNotSent = [];
        let allCSVData = [];
        stream.pipe(
          csv()
            .on("data", async (data) => {
              if (!i) {
                i++;
              } else {
                allCSVData.push(data);
              }
            })
            .on("end", async () => {
              res.ok();
              let i = 1;
              for (const data of allCSVData) {
                try {
                  const query = `update retailo_users.customers set business_unit_id = ${52} where phone = "${data[0]}"`
                  await sails.sendNativeQuery(query);
                  const fetchQuery = `select * from retailo_users.customers where phone = "${data[0]}"`
                  const fetched = await sails.sendNativeQuery(fetchQuery);
                  const customer = fetched.rows[0];
                  sails.log(`BULK SEND MESSAGES AND SET BU: customer updated successfully, send sms now - verification code: ${customer.verification_code}`);
                  await SmsRestClient.sendSms({
                    recepient: data[0],
                    message_info: `Your Retailo pin code is: ${customer.verification_code} \n`,
                    country_code: 'AWS'
                  })
                  smsSent.push({ index: i, phone: data[0] });
                  console.log("SMS SENT COUNT - ", i);
                  i++;
                } catch (err) {
                  smsNotSent.push({ index: i, phone: data[0] });
                  sails.log.info(`BULK SEND MESSAGES AND SET BU: error occured while sending sms - ${JSON.stringify(err)}`);
                  i++;
                }
              }
              const logIdentifier = `BULK SEND MESSAGES AND SET BU DONE: `
              sails.log.info(`${logIdentifier} - send sms - ${smsSent.length} --- ${JSON.stringify(smsSent)}`)

              sails.log.error(`${logIdentifier} - failed to send sms - ${smsNotSent.length} --- ${JSON.stringify(smsNotSent)}`)
            })
        );
      }
    });
  },

  /**
   * controller to bulk set customer secondary phone and email for dubai
   * @param {*} req 
   * @param {*} res 
   * @param {*} next 
   * @returns {Promise<{}>}
   */

  bulkSetCustomerAttributes: function (req, res, next) {
    var file_name = req.file("file")._files[0].stream.filename;
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
      else {
        sails.log(`bulkSetCustomerAttributes file uploaded successfully; ${file_name}`);
        var s3Options = { Bucket: sails.config.globalConf.AWS_BUCKET, Key: file_name };
        const stream = s3.getObject(s3Options).createReadStream();
        let i = 0;
        let customersUpdated = [];
        let customersNotUpdated = [];
        let allCSVData = [];
        stream.pipe(
          csv()
            .on("data", async (data) => {
              if (!i) {
                i++;
              } else {
                allCSVData.push(data);
              }
            })
            .on("end", async () => {
              res.ok();
              let i = 1;
              for (const data of allCSVData) {
                try {
                  const query = `update retailo_users.customers set secondary_phone = "${data[1]}", email = "${data[2]}" where id = "${data[0]}"`
                  await sails.sendNativeQuery(query);
                  sails.log(`BULK UPDATE CUSTOMERS FLOW: updated customer - ${data[0]}`);
                  customersUpdated.push({ index: i, customerId: data[0] });
                  console.log("UPDATED CUSTOMER COUNT - ", i);
                  i++;
                } catch (err) {
                  customersNotUpdated.push({ index: i, customerId: data[0] });
                  sails.log.info(`BULK UPDATE CUSTOMERS FLOW: error occured while updating customer - ${JSON.stringify(err)}`);
                  i++;
                }
              }
              const logIdentifier = `BULK UPDATE CUSTOMERS FOR BU: `
              sails.log.info(`${logIdentifier} - update customers - ${customersUpdated.length} --- ${JSON.stringify(customersUpdated)}`)

              sails.log.error(`${logIdentifier} - failed to update customers - ${customersNotUpdated.length} --- ${JSON.stringify(customersNotUpdated)}`)
            })
        );
      }
    });
  },


  /**
   * controller to fetch customers and dump into csv
   * @param {*} req 
   * @param {*} res 
   * @param {*} next 
   * @returns {Promise<{}>}
   */

  fetchCustomerDump: async (req, res, next) => { 
    const { companyId } = req.query;
    if (!req.headers.apikey || sails.config.globalConf.API_KEY !== req.headers.apikey) {
      return res.unauthorized();
    }
    let csvHeaders = `fullname,inactive,creationDate,role`;
    try {
      const query = `select c.name as fullname, c.disabled as inactive, c.created_at as creationDate, 
      'CONSUMER' as role from retailo_users.customers c left join retailo_rewrite.user_roles ur on 
      ur.customer_id = c.id where c.company_id = ${companyId};`;
      const customerResults = await sails.sendNativeQuery(query);
      const csvData = customerResults.rows;
      for (const csv of csvData) {
        let customerData;
        customerData = [
          csv.fullname ? '"' + csv.fullname + '"' : "",
          csv.inactive,
          csv.creationDate ? new Date(csv.creationDate) : null,
          csv.role,
        ];
        csvHeaders += "\n";
        csvHeaders += customerData.join(",");
      }
      const amazonfileName = ((new Date() + "customer-dump").replace(/[^a-zA-Z0-9]/g, "-")) + ".csv";
      const fileParams = {
        Bucket: sails.config.globalConf.AWS_BUCKET,
        Key: amazonfileName,
        Body: csvHeaders,
        ContentType: "application/octet-stream",
        CacheControl: "public",
      };
      const s3 = new AWS.S3();
      s3.putObject(fileParams, async (err, data) => {
        if (err) {
          console.log(`FETCH CUSTOMER DUMP - S3: error occured while fetching and proccessing customers ${JSON.stringify(err)}`)
        } else {
          const fileUrl = `https://${sails.config.globalConf.AWS_BUCKET}.s3.${sails.config.globalConf.AWS_REGION}.amazonaws.com/${amazonfileName}`;
          console.log(`FETCH CUSTOMER DUMP - DATA: ${JSON.stringify(data)}`);
          res.ok(fileUrl);
        }
      });
    } catch (err) {
      console.log(`FETCH CUSTOMER DUMP - error occured while fetching and proccessing customers ${JSON.stringify(err)}`)
    }          
  },

  /**
   * controller to fetch users and dump into csv
   * @param {*} req 
   * @param {*} res 
   * @param {*} next 
   * @returns {Promise<{}>}
   */

  fetchUserDump: async (req, res, next) => { 
    const { companyId } = req.query;
    if (!req.headers.apikey || sails.config.globalConf.API_KEY !== req.headers.apikey) {
      return res.unauthorized();
    }
    let csvHeaders = `fullname,username,inactive,creationDate,role`;
    try {
      const query = `select u.name as fullname, u.username as username, u.disabled as inactive, 
      u.created_at as creationDate, r.name as role from retailo_users.users u
      left join retailo_rewrite.user_roles ur on ur.user_id = u.id
      left join retailo_rewrite.roles r on r.id = ur.role_id
      left join retailo_rewrite.auth_store ast on ast.user_id = u.id
      where ast.location_id in (select id from retailo_configuration.locations where company_id = ${companyId});`;
      const userResults = await sails.sendNativeQuery(query);
      const csvData = userResults.rows;
      for (const csv of csvData) {
        let userData;
        userData = [
          csv.fullname ? '"' + csv.fullname + '"' : "",
          csv.username ? '"' + csv.username + '"' : "",
          csv.inactive,
          csv.creationDate ? new Date(csv.creationDate) : null,
          csv.role,
        ];
        csvHeaders += "\n";
        csvHeaders += userData.join(",");
      }
      const amazonfileName = ((new Date() + "user-dump").replace(/[^a-zA-Z0-9]/g, "-")) + ".csv";
      const fileParams = {
        Bucket: sails.config.globalConf.AWS_BUCKET,
        Key: amazonfileName,
        Body: csvHeaders,
        ContentType: "application/octet-stream",
        CacheControl: "public",
      };
      const s3 = new AWS.S3();
      s3.putObject(fileParams, async (err, data) => {
        if (err) {
          console.log(`FETCH USER DUMP - S3: error occured while fetching and proccessing users ${JSON.stringify(err)}`)
        } else {
          const fileUrl = `https://${sails.config.globalConf.AWS_BUCKET}.s3.${sails.config.globalConf.AWS_REGION}.amazonaws.com/${amazonfileName}`;
          console.log(`FETCH USER DUMP - DATA: ${JSON.stringify(data)}`);
          res.ok(fileUrl);
        }
      });
    } catch (err) {
      console.log(`FETCH USER DUMP - error occured while fetching and proccessing users ${JSON.stringify(err)}`)
    }          
  },

  /**
   * controller to add permissions for super agent role
   * @param {*} req 
   * @param {*} res 
   * @param {*} next 
   * @returns {Promise<{}>}
  */

  addPermissionForSuperAgent: async (req, res, next) => { 
    const { source, destination } = req.allParams();
    try {
      const findQuery = `select * from retailo_rbac.role_permissions where role_id = ${source}`;
      const results = await sails.sendNativeQuery(findQuery);
      const permissions = results.rows;
      console.log(`source role: ${source} - total permissions: ${permissions.length}`);
      for (const perm of permissions) {
        try {
          const destRolePermQuery = `select * from retailo_rbac.role_permissions where role_id = ${destination} and permission_id = ${perm.permission_id}`;
          const destRolePermResults = await sails.sendNativeQuery(destRolePermQuery);
          const destPermissions = destRolePermResults.rows;
          if (destPermissions.length) {
            console.log(`permission found against role: ${destination} - permissionId: ${perm.permission_id}`);
            console.log(`found index - ${permissions.indexOf(perm)}`);
          }
          else if (!destPermissions.length) {
            console.log(`permission not found against role: ${destination} - permissionId: ${perm.permission_id}`);
            console.log(`not found index - ${permissions.indexOf(perm)}`);
            const insertQuery = `INSERT INTO retailo_rbac.role_permissions (role_id, permission_id) VALUES (${destination}, ${perm.permission_id})`;
            await sails.sendNativeQuery(insertQuery);
            console.log(`ADD PERMISSION CONTROLLER - added records: ${destination} & permissionID: ${perm.permission_id}`)
          }
        } catch (err) {
          console.log(`PERMISSION ERROR - ${JSON.stringify(err)}`);
        }
      }
      res.ok();
    } catch (err) {
      console.log(`ADD PERMISSION FOR SUPER AGENT - error occured while fetching and proccessing permissions ${JSON.stringify(err)}`);
      res.serverError(err)
    }          
  },

  migrateRedis: async (req, res, next) => { 
    if (!req.headers.apikey || sails.config.globalConf.API_KEY !== req.headers.apikey) {
      return res.unauthorized();
    }    
    let iteration = 0;
    sourceClient.hgetall(`${CART_REDIS_KEY}`, async (err, results) => {
      if (err) {
        console.log(`error occured while fetching keys ${JSON.stringify(err)}`)
      } else {
        console.log(`RESULTS FOUND FROM REDIS - ${JSON.stringify(Object.entries(results).length)}`);
        console.log(`---------------------------------------------------------------`);
        console.log(`MIGRATION STARTED - source: ${process.env.REDIS_SERVER} - destination: ${process.env.DESTINATION_REDIS_SERVER}`)
        console.log(`---------------------------------------------------------------`);
        for (const [key, value] of Object.entries(results)) {
          console.log(`MIGRATING - key: ${key} - value: ${value}`)
          await hsetAsyncDestination(CART_REDIS_KEY, key, value);
          iteration++;
          console.log(`MIGRATING - ITERATION DONE: ${iteration}`)
          console.log(`---------------------------------------------------------------`);
        }        
      }
    });
    res.ok();
  },
};
