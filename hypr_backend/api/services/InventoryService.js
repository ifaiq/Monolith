// var s3 = new AWS.S3();
var csv = require("fast-csv");
const AWSService = require("./AWSService");
const AWS = AWSService.getAWSConfig();
const userExtractionService = require("../user_service_extraction/userService");

module.exports = {
  stockIn: async (inventoryObj, emaarFeed = false, role = null) => {
    let response = await new Promise(async (resolve, reject) => {
      try {
        let product = await Product.findOne({
          sku: inventoryObj.sku,
          location_id: inventoryObj.location_id,
        });
        let change_reason = inventoryObj.change_reason;
        let quanToUpdate = emaarFeed
          ? inventoryObj.stock_quantity
          : parseFloat(product.stock_quantity) + inventoryObj.stock_quantity;
        await ProductService.updateProductWithHistory({
          old_product: product,
          new_product_data: {
            stock_quantity: quanToUpdate,
            tags: [],
            removed_tags: [],
          },
          reason: change_reason,
          user_id: inventoryObj.user_id,
          source: inventoryObj.source,
        }, role, product.location_id);
        resolve({ success: true });
      } catch (err) {
        reject(err);
      }
    });

    return response;
  },
  preStockInCall: async (params, user_id, role) => {
    let response = await new Promise(async (resolve, reject) => {
      async.each(
        params,
        async (inventoryObj, callback) => {
          try {
            if (inventoryObj.id && inventoryObj.sku) {
              inventoryObj.user_id = user_id;
              inventoryObj.source = "HYPR ADMIN";
              let stockedIn = await InventoryService.stockIn(inventoryObj, false, role);
              if (stockedIn.success) {
                console.log(
                  "Stocked In: " +
                  inventoryObj.id +
                  " by " +
                  inventoryObj.stock_quantity
                );
                callback();
              } else {
                callback(stockedIn.trace);
              }
            } else {
              callback();
            }
          } catch (err) {
            callback(err);
          }
        },
        (err, result) => {
          if (err) {
            reject();
          } else {
            resolve({
              success: true,
            });
          }
        }
      );
    });

    return response;
  },

  checkLock: async function (cartId, currentFloatQty, qty) {
    let response = await new Promise(async (resolve) => {
      if (!cartId) {
        resolve({
          quan: currentFloatQty - qty,
        });
      } else {
        RedisService.client.get(
          sails.config.globalConf.redisEnv + " : " + cartId,
          function (err, reply) {
            var reply = parseInt(reply);
            if (reply)
              resolve({
                quan: currentFloatQty,
              });
            else
              resolve({
                quan: currentFloatQty - qty,
              });
          }
        );
      }
    });

    return response;
  },
  stockReserveProcure: async (inventoryObj, qty, cart_id = null) => {
    let response = await new Promise(async (resolve) => {
      console.log("GOING TO CHECK LOCK " + cart_id);

      let resp = await InventoryService.checkLock(
        cart_id,
        currentFloatQty,
        qty
      );
      try {
        let inventoryObj_ = await Inventory.update(
          { id: inventoryObj.id },
          {
            stock_quantity: resp.quan,
          }
        );
        resolve({
          success: true,
          res_qty: qty,
          procuring: false,
        });
      } catch (err) {
        resolve({
          message:
            "ERROR OCCURED WHILE UPDATING INVENTORY STOCK RESERVE PROCURE",
          trace: err,
          success: false,
          type: ErrorTypes.SERVER_ERROR,
        });
      }
    });
    return response;
  },
  productResProc: async (location, sku, qty, cart_id = null) => {
    var qty_ = parseFloat(qty);
    console.log("location: " + location + " sku:" + sku + " orderqty: " + qty);

    let response = await new Promise(async (resolve) => {
      try {
        let inventoryObj = Inventory.findOne({
          location_id: location,
          product_id: sku,
        }).populate("res_proc_id");

        let isGoneProcuring = await InventoryService.stockReserveProcure(
          inventoryObj,
          qty_,
          cart_id
        );
        if (isGoneProcuring.success) resolve(isGoneProcuring);
        else {
          resolve({
            message: "ERROR OCCURED AFTER RESPONSE FROM STOCK RESERVE PROCURE",
            trace: err,
            success: false,
            type: ErrorTypes.SERVER_ERROR,
          });
        }
      } catch (err) {
        resolve({
          message: "ERROR OCCURED PRODUCT RES PROC",
          trace: err,
          success: false,
          type: ErrorTypes.SERVER_ERROR,
        });
      }
    });

    return response;
  },

  parseCSV_createStock: async (filename, user, file_url) => {
    var s3 = new AWS.S3(); // initializing S3
    var s3Options = { Bucket: sails.config.globalConf.AWS_BUCKET, Key: filename };
    let errorSkus = [];
    let i = 0;
    let allCSVData = [];
    const stream = s3.getObject(s3Options).createReadStream();
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
              location = data[2];
              if (
                AuthStoreService.verify_user_access(
                  { location_id: location },
                  user
                )
              ) {
                try {
                  let inventoryObj = {
                    sku: data[0],
                    location_id: parseInt(location),
                    stock_quantity: parseFloat(data[1]),
                    user_id: user.id,
                    source: file_url,
                  };
                  let stockedIn = await InventoryService.stockIn(inventoryObj);
                  if (stockedIn.success) {
                    console.log("Stocked In: " + data[0] + " by " + data[1]);
                  } else {
                    errorSkus.push({
                      sku: data[0],
                      location: location,
                      reason: stockedIn.message,
                    });
                  }
                } catch (err) {
                  errorSkus.push({
                    index: i,
                    sku: data[0],
                    reason: err,
                  });
                }
                i++;
              } else {
                errorSkus.push({
                  index: i,
                  sku: data[0],
                  reason: "Invalid location",
                });
                i++;
              }
              callback();
            },
            async () => {
              console.log("DONE. err_skus" + JSON.stringify(errorSkus));
              var html = "";
              if (errorSkus.length > 0) {
                html +=
                  "<h2>Inventory for following SKUs could not be updated</h2><table><tr><th>Index</th><th>SKU</th><th>Reason</th></tr>";
                var str = "";
                for (var row of errorSkus) {
                  str +=
                    "<tr><td>" +
                    row.index +
                    "</td>" +
                    "<td>" +
                    row.sku +
                    "</td><td>" +
                    row.reason +
                    "</td></tr>";
                }
                html += str + "</table>";
              } else {
                html = "<h2>INVENTORY ADDED SUCCESSFULLY<h2>";
              }
              let user = await AuthStoreService.populateHierarchyAccess(user);
              let recipients = await UtilService.getAccountEmails(user);
              if (user && user.email && user.email != "")
                recipients.push(user.email);
              // MailerService.sendMailThroughAmazon({
              //   email: recipients,
              //   htmlpart: html,
              //   subject: "HYPR Bulk Inventory Update Report - " + new Date(),
              //   destination: "operations@hypr.pk",
              // });
            }
          );
        })
    );
  },

  inventoryHistory: async (params, userData, requestUrl) => {
    const queryParams = [];
    let paramInjectionCounter = 1;
    try {
      // Adding pagination
      let per_page = params.per_page ? params.per_page : 10;
      let page = params.page && params.page > 1 ? params.page : 1;
      let query = `select pah.* from products as p join product_audit_history as pah on p.id = pah.product_id where`;
      let countQuery = `select count(pah.id) as total from products as p join product_audit_history as pah on p.id = pah.product_id where pah.updated_by is not null and`;

      // Adding filters to query
      if (!GeneralHelper.emptyOrAllParam(params.location_id)) {
        query += ` p.location_id in ($${paramInjectionCounter})`;
        countQuery += ` p.location_id in ($${paramInjectionCounter})`;
        queryParams.push(params.location_id.split(','));
        paramInjectionCounter++;
      }

      if (params.search) {
        const toBeSearched = `%${params.search}%`;
        query += ` and (p.sku like $${paramInjectionCounter} or p.name like $${paramInjectionCounter} or p.brand like $${paramInjectionCounter} or pah.reason like $${paramInjectionCounter})`;
        countQuery += ` and (p.sku like $${paramInjectionCounter} or p.name like $${paramInjectionCounter} or p.brand like $${paramInjectionCounter} or pah.reason like $${paramInjectionCounter})`;
        queryParams.push(toBeSearched);
        paramInjectionCounter++;
      }

      if (params.disabled == 0 || +params.disabled == 1) {
        query += ` and p.disabled = $${paramInjectionCounter}`;
        countQuery += ` and p.disabled = $${paramInjectionCounter}`;
        queryParams.push(params.disabled);
        paramInjectionCounter++;
      }

      if (params.stock_quantity) {
        if (params.stock_quantity == 0) {
          query += ` and p.stock_quantity = $${paramInjectionCounter}`;
          countQuery += ` and p.stock_quantity = $${paramInjectionCounter}`;
        } else {
          query += ` and p.stock_quantity >= $${paramInjectionCounter}`;
          countQuery += ` and p.stock_quantity >= $${paramInjectionCounter}`;
        }
        queryParams.push(params.stock_quantity);
        paramInjectionCounter++;
      }

      if (params.startDate) {
        query += ` and pah.created_at >= $${paramInjectionCounter}`;
        countQuery += ` and pah.created_at >= $${paramInjectionCounter}`;
        queryParams.push(params.startDate.slice(0, 19).replace('T', ' '));
        paramInjectionCounter++;
      }

      if (params.endDate) {
        query += ` and pah.created_at <= $${paramInjectionCounter}`;
        countQuery += ` and pah.created_at <= $${paramInjectionCounter}`;
        queryParams.push(params.endDate.slice(0, 19).replace('T', ' '));
        paramInjectionCounter++;
      }

      query += ` ORDER BY id DESC`;

      // Adding pagination to query
      if (per_page) query += ` LIMIT ${per_page}`;
      if (page && page > 0) query += ` OFFSET ${(page - 1) * per_page};`

      // Querying data
      sails.log(`QUERY PARAMS FOR INVENTORY HISTORY: ${JSON.stringify(queryParams)}`)
      sails.log(`ReqId: ${params.reqID}, userID: ${userData.id}, context: "${requestUrl}", Constructed data query: ${query}`);
      sails.log(`ReqId: ${params.reqID}, userID: ${userData.id}, context: "${requestUrl}", Constructed count query: ${countQuery}`);
      const products = await sails.sendNativeQuery(query, queryParams);
      const userIds = [];
      products.rows.map(product => {
        if (product.updated_by) userIds.push(product.updated_by);
      });
      const updatedByUsers = await userExtractionService.getAll({ id: userIds });
      products.rows.forEach(product => {
        const userData = updatedByUsers.find(user => product.updated_by && user.id === product.updated_by);
        product.updated_by_user = userData ? userData.username : 'N/A';
      });
      let totalProducts = await sails.sendNativeQuery(countQuery, queryParams);
      sails.log(`ReqId: ${params.reqID}, userID: ${userData.id}, context: "${requestUrl}", Query Response : successfully executed`);
      sails.log(`ReqId: ${params.reqID}, userID: ${userData.id}, context: "${requestUrl}", countQuery Response : ${JSON.stringify(totalProducts.rows)}`);
      // products.rows.totalProducts = totalProducts.rows[0].total;
      return {
        products: products.rows,
        totalCount: totalProducts.rows && totalProducts.rows.length > 0
          ? totalProducts.rows[0].total
          : 0
      };
    } catch (err) {
      throw err;
    }
  }
};
