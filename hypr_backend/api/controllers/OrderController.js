var csv = require("fast-csv");
const AWS = AWSService.getAWSConfig();
const s3 = new AWS.S3();
var datetime = require("node-datetime");
var xlsx = require("xlsx");
const customerExtractionService = require('../user_service_extraction/customerService');
const CouponDao = require("../modules/v1/Coupon/CouponDao");
module.exports = {
  /* NOTE: pagination needs to be looked at, tax/service/delivery charges */
  getOrdersByStatus: async function (req, res, next) {
    try {
      var query = "";
      var params = req.allParams();
      try {
        sails.log(
          `ReqId: ${params.reqID}, userID: ${res.locals.userData.id}, context: "${req.url}", In getOrderByStatus()`
        );
        let findCriteria = {};
        params.status_id =
          typeof params.status_id == "string"
            ? JSON.parse(params.status_id)
            : params.status_id;
        sails.log(
          `ReqId: ${params.reqID}, userID: ${res.locals.userData.id
          }, context: "${req.url}", Request params: ${JSON.stringify(params)}`
        );

        if (params.fromPackerHistory) {
          findCriteria = { status_id: { ">": params.status_id, "!": 10 } };
        } else {
          findCriteria = { status_id: params.status_id };
        }

        let per_page = params.per_page ? params.per_page : 10;
        let page = params.page && params.page > 0 ? params.page - 1 : 0;
        if (!GeneralHelper.emptyOrAllParam(params.status_id, true)) {
          if (params.fromPackerHistory) {
            findCriteria = { status_id: { ">": params.status_id, "!": 10 } };
          } else {
            findCriteria = { status_id: params.status_id };
          }
        }

        if (params.startDate && params.endDate) {
          var endDate = new Date(params.endDate);
          endDate.setHours(23, 59, 59, 59);
          var startDate = new Date(params.startDate);
          startDate.setHours(0, 0, 0, 0);
          findCriteria["placed_at"] = { "<": endDate, ">": startDate };
        }

        if (params.location_id) {
          findCriteria["location_id"] = params.location_id;
        }

        if (params.delivery_boy_id) {
          findCriteria["delivery_boy_id"] = params.delivery_boy_id;
        }

        if (params.hasOwnProperty("fromPackerApp") && params.fromPackerApp) {
          findCriteria["packer_id"] = res.locals.userData.id;
        }

        if (params.delivered_time) {
          let delivered_time = params.delivered_time
            .slice(0, 19)
            .replace("T", " ");
          findCriteria["delivered_time"] = { ">=": delivered_time };
          sails.log(
            `ReqId: ${params.reqID}, userID: ${res.locals.userData.id
            }, context: "${req.url
            }", Delivered orders for Retailo, findCriteria: ${JSON.stringify(
              findCriteria
            )}`
          );
        }

        if (params.search) {
          sails.log(
            `ReqId: ${params.reqID}, userID: ${res.locals.userData.id}, context: "${req.url}", Inside the search block`
          );
          try {
            let customers = await customerExtractionService.find({
              searchOnAttributes: ["name", "phone"],
              searchValue: params.search,
            });
            var customerIds = [];
            customers.forEach(function (customer) {
              customerIds.push(customer.id);
            });

            findCriteria["or"] = [];
            findCriteria["or"].push({ customer_id: customerIds });
            let isnum = /^\d+$/.test(params.search);
            if (isnum) findCriteria["or"].push({ id: params.search });
            try {
              findCriteria.disabled = false;
              sails.log(
                `ReqId: ${params.reqID}, userID: ${res.locals.userData.id
                }, context: "${req.url
                }", findCriteria before orders count: ${JSON.stringify(
                  findCriteria
                )}`
              );
              let totalCount = await Order.count(findCriteria);
              findCriteria = { where: findCriteria };
              !params.fetchForMap
                ? (findCriteria.skip = page * per_page)
                : null;
              !params.fetchForMap ? (findCriteria.limit = per_page) : null;
              if (
                params.hasOwnProperty("fromPackerApp") &&
                params.fromPackerApp
              ) {
                sails.log(
                  `ReqId: ${params.reqID}, userID: ${res.locals.userData.id}, context: "${req.url}", Order from packer id: ${res.locals.userData.id}`
                );
                sails.log(
                  `ReqId: ${params.reqID}, userID: ${res.locals.userData.id
                  }, context: "${req.url
                  }", findCriteria before assemblePackerOrderList(): ${JSON.stringify(
                    findCriteria
                  )}`
                );
                query = await OrderService.assemblePackerOrderList(
                  findCriteria
                );
              } else {
                sails.log(
                  `ReqId: ${params.reqID}, userID: ${res.locals.userData.id
                  }, context: "${req.url
                  }", findCriteria before assembleOrdersList(): ${JSON.stringify(
                    findCriteria
                  )}`
                );
                query = await OrderService.assembleOrdersList(
                  findCriteria,
                  params.sortCriteria
                );
              }
              if (query.success) {
                sails.log(
                  `ReqId: ${params.reqID}, userID: ${res.locals.userData.id
                  }, context: "${req.url}", response: ${JSON.stringify({
                    orders: query.orders,
                    totalCount: totalCount,
                  })}`
                );
                if (params.delivery_boy_id) {
                  query.orders.sort(function (a, b) {
                    return a.delivery_priority - b.delivery_priority;
                  });
                }
                res.ok({ orders: query.orders, totalCount: totalCount });
              } else {
                sails.log.error(
                  `ReqId: ${params.reqID}, userID: ${res.locals.userData.id}, context: "${req.url}", ERROR!! while querying for Orders in search block -> [${query.trace}]`
                );
                res.serverError(query.trace);
              }
            } catch (err) {
              sails.log.error(
                `ReqId: ${params.reqID}, userID: ${res.locals.userData.id}, context: "${req.url}", ERROR!! in search block -> ${err}`
              );
              res.serverError(err);
            }
          } catch (err) {
            sails.log.error(
              `ReqId: ${params.reqID}, userID: ${res.locals.userData.id}, context: "${req.url}", ERROR!! while in the search block -> [${err}]`
            );
            res.serverError(err);
          }
        } else {
          sails.log(
            `ReqId: ${params.reqID}, userID: ${res.locals.userData.id}, context: "${req.url}", no search params found, continuing to gather orders`
          );
          findCriteria.disabled = false;
          let totalCount = await Order.count(findCriteria);
          findCriteria = { where: findCriteria };
          !params.fetchForMap ? (findCriteria.skip = page * per_page) : null;
          !params.fetchForMap ? (findCriteria.limit = per_page) : null;
          params.sortCriteria ? params.sortCriteria : "delivery_time desc";
          if (params.hasOwnProperty("fromPackerApp") && params.fromPackerApp) {
            sails.log(
              `ReqId: ${params.reqID}, userID: ${res.locals.userData.id}, context: "${req.url}", Order from packer id: ${res.locals.userData.id}`
            );
            sails.log(
              `ReqId: ${params.reqID}, userID: ${res.locals.userData.id
              }, context: "${req.url
              }", findCriteria before assemblePackerOrderList(): ${JSON.stringify(
                findCriteria
              )}`
            );
            query = await OrderService.assemblePackerOrderList(
              findCriteria,
              params.sortCriteria
            );
          } else {
            sails.log(
              `ReqId: ${params.reqID}, userID: ${res.locals.userData.id
              }, context: "${req.url
              }", findCriteria before assembleOrdersList(): ${JSON.stringify(
                findCriteria
              )}`
            );
            query = await OrderService.assembleOrdersList(
              findCriteria,
              params.sortCriteria
            );
          }
          if (query.success) {
            sails.log(
              `ReqId: ${params.reqID}, userID: ${res.locals.userData.id
              }, context: "${req.url}", response: ${JSON.stringify({
                orders: query.orders,
                totalCount: totalCount,
              })}`
            );
            if (params.delivery_boy_id) {
              query.orders.sort(function (a, b) {
                return a.delivery_priority - b.delivery_priority;
              });
            }
            res.ok({ orders: query.orders, totalCount: totalCount });
          } else {
            sails.log.error(
              `ReqId: ${params.reqID}, userID: ${res.locals.userData.id}, context: "${req.url}", ERROR!! while querying for Orders -> [${query.trace}]`
            );
            res.serverError(query.trace);
          }
        }
      } catch (err) {
        sails.log.error(
          `ReqId: ${params.reqID}, userID: ${res.locals.userData.id}, context: "${req.url}", ERROR!! In getOrdersByStatus() -> [${err?.stack}]`
        );
        res.serverError(err);
      }
    } catch (err) {
      sails.log.error(
        `ReqId: ${req.id}, userID: ${res.locals.userData.id}, context: "${req.url}", Caused by params -> [${req.params}], ERROR!! In getOrdersByStatus() -> [${err?.stack}]`
      );
      res.serverError(err);
    }
  },

  /* NOTE: DONE, pagination needs to be looked at */

  getAllOrders: async function (req, res, next) {
    /* NOTE: DECLARATIONS */

    var params = req.allParams();
    let isDateTime = false;
    if (params.startDate && params.endDate) {
      var endDate = new Date(params.endDate);
      var startDate = new Date(params.startDate);
      isDateTime = true;
    }
    var findCriteria = { disabled: false };
    params.sortCriteria ? params.sortCriteria : "id desc";

    /* NOTE: CRITERIA LOGIC */
    if (params.location_id) {
      findCriteria["location_id"] = params.location_id;
    } else if (res.locals.userData.role.id != Constants.HyprRoles.ADMIN) {
      findCriteria["location_id"] =
        res.locals.userData.accessHierarchy.locations;
    }
    if (params.awatingForPacker) {
      findCriteria["sort"] = "delivery_time desc";
      params.sortCriteria = "delivery_time desc";
    }
    isDateTime
      ? (findCriteria["placed_at"] = { "<=": endDate, ">=": startDate })
      : null;

    params.orderStatusId
      ? params.orderStatusId == 0
        ? (findCriteria["status_id"] = { "!": [10, 9] })
        : (findCriteria["status_id"] = params.orderStatusId)
      : null;

    params.selectedSalesAgentId
      ? (findCriteria["sales_agent_id"] = params.selectedSalesAgentId)
      : null;

    let criteriaBuild = params.search
      ? await OrderService.buildCriteria(params, findCriteria)
      : null;
    if (criteriaBuild)
      criteriaBuild.success
        ? (findCriteria = criteriaBuild.findCriteria)
        : findCriteria;

    let countCriteria = { ...findCriteria };

    /* NOTE: PAGINATION NEEDS TO BE CHANGED */
    let per_page = params.per_page ? params.per_page : 10;
    let page = params.page && params.page > 0 ? params.page - 1 : 0;
    try {
      let totalCount = await Order.count(countCriteria);
      findCriteria = {
        where: findCriteria,
        skip: page * per_page,
        limit: per_page,
      };

      let result = await OrderService.assembleOrdersList(
        findCriteria,
        params.sortCriteria
      );
      result.success
        ? res.ok({ orders: result.orders, totalCount: totalCount })
        : res.ok(result.message ? result.message : "ORDER NOT FOUND");
    } catch (err) {
      res.serverError(err);
    }
  },

  getOrderStatusReasons: async function (req, res, next) {
    const language = req.header('language');
    try {
      const statusReason = await OrderStatusReasons.find({
        deleted_at: null,
        tag: req.param("tag"),
      }).populate('multilingual');
      const mappedReasons = statusReason.map(reason => {
        if (reason.multilingual.length) {
          const desiredLanguage = reason.multilingual.find(r => r.language === language);
          if (desiredLanguage) {
            reason.reason = desiredLanguage.value;
            reason.description = desiredLanguage.value;
          }
        }
        delete reason.multilingual;
        return reason;
      })
      res.ok({ reasons: mappedReasons });
    } catch (err) {
      res.serverError(err);
    }
  },

  bulkPackOrders: async function (req, res, next) {
    // req.validate(["file_name"]);
    res.ok();
    var s3Options = { Bucket: sails.config.globalConf.AWS_BUCKET, Key: req.param("file_name") };
    const stream = s3.getObject(s3Options).createReadStream();
    var i = 0;
    let ordersPacked = [];
    let errorOrders = [];
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
        .on("end", () => {
          async.eachSeries(
            allCSVData,
            async (data, callback) => {
              if (!(data[0] > 0)) {
                return callback();
              }
              let order = await Order.findOne({ id: data[0] }).populate(
                "order_items", {
                  deleted_at: null
                }
              );

              if (order) {
                try {
                  const batch_ids = (await DeliveryBatchOrder.find({
                    order_id: data[0],
                    deleted_at: null,
                  })).map(batch => batch.batch_id);
                  const existing_batch = await DeliveryBatch.find({
                    id: batch_ids,
                    deleted_at: null,
                    status_id: { "<": 6 }
                  });
                  if (existing_batch.length == 0) {
                    if (
                      order.status_id != Constants.HyprOrderStates.DELIVERED &&
                      order.status_id !=
                      Constants.HyprOrderStates.PARTIAL_DELIVERED &&
                      order.status_id != Constants.HyprOrderStates.CANCELLED &&
                      order.status_id != Constants.HyprOrderStates.IN_TRANSIT
                    ) {
                      let result = await OrderService.assignAndPackBulkOrders(
                        order,
                        res.locals.userData.id,
                        res.locals.userData.role.id
                      );
                      ordersPacked.push({
                        order_id: data[0],
                        message: "Order " + data[0] + " is packed",
                        index: i,
                      });
                      i++;
                      callback();
                    } else {
                      errorOrders.push({
                        order_id: data[0],
                        message: "ORDER ALREADY IN END STATE",
                        index: i,
                      });
                      i++;
                      callback();
                    }
                  } else {
                    errorOrders.push({
                      order_id: data[0],
                      message: "ORDER IN EXISTING BATCH",
                      index: i,
                    });
                    i++;
                    callback();
                  }
                } catch (err) {
                  errorOrders.push({
                    order_id: data[0],
                    message: err,
                    index: i,
                  });
                  i++;
                  callback();
                }
              } else {
                errorOrders.push({
                  order_id: data[0],
                  message: "Order id not exist!",
                  index: i,
                });
                i++;
                callback();
              }
            },
            async (err, result) => {
              var html = "";
              if (ordersPacked.length > 0) {
                var str = "";
                html +=
                  "<h2>Packer ORDERS</h2><table><tr><th>Index</th><th>Order Id</th><th>Reason</th></tr>";
                for (var row of ordersPacked) {
                  str +=
                    "<tr><td>" +
                    row.index +
                    "</td>" +
                    "<td>" +
                    row.order_id +
                    "</td>" +
                    "<td>" +
                    row.message +
                    "</td></tr>";
                }
                html += str + "</table>";
              }
              if (errorOrders.length > 0) {
                html +=
                  "<h2>Error Orders</h2><table><tr><th>Index</th><th>Order Id</th><th>Reason</th></tr>";
                var str = "";
                for (var row of errorOrders) {
                  str +=
                    "<tr><td>" +
                    row.index +
                    "</td>" +
                    "<td>" +
                    row.order_id +
                    "</td>" +
                    "<td>" +
                    row.message +
                    "</td></tr>";
                }
                html += str + "</table>";
              }
              html += "<h3>Summary</h3>";
              html += "<p>" + "PACKED ORDERS: " + ordersPacked.length + "</p>";
              html +=
                "<p>" + "ERROR ASSIGNMENTS: " + errorOrders.length + "</p>";
              let user = await AuthStoreService.populateHierarchyAccess(
                res.locals.userData
              );
              let recipients = await UtilService.getAccountEmails(user);
              if (res.locals.userData.email && res.locals.userData.email != "")
                recipients.push(res.locals.userData.email);
              return;
            }
          );
        })
    );
  },
  /* NOTE: utility controller to take order dump */
  // [REVISIT REQUIRED]: needs to be revisited for query optimization
  getOrderDump: async function (req, res, next) {
    // TODO DEPRECATE ENTIRE FUNCTION!
    // if (Constants.HyprRoles.ADMIN !== req.user.role) {
    //   return res.unauthorized();
    // }
    // await sails.getDatastore("readReplica").transaction(async (db) => {
      const params = req.allParams();
      let findCriteria = {};
      let company_name, bu_name, store_name;
      findCriteria["location_id"] = params.location_id;
      let filterQuery = "";
      if (params.startDate) {
        var startDate = new Date(params.startDate);
        findCriteria["placed_at"] = { ">=": startDate };
        filterQuery +=
          " and o.placed_at >= '" +
          GeneralHelper.dateObjectToMySqlDateConversion(startDate) +
          "'";
      }
      if (params.endDate) {
        var endDate = new Date(params.endDate);
        if (!params.startDate) {
          findCriteria["placed_at"] = {};
        }
        findCriteria["placed_at"]["<="] = endDate;
        filterQuery +=
          " and o.placed_at <= '" +
          GeneralHelper.dateObjectToMySqlDateConversion(endDate) +
          "'";
      }
      if ((getDateDifference(params.startDate, params.endDate)) > 13) {
        return res.badRequest("Selected date range should not exceed 2 weeks");
      }
      if (params.statusId) {
        filterQuery += " and o.status_id in (" + params.statusId + " )";
        findCriteria["status_id"] = params.statusId;
      } else {
        filterQuery +=
          " and o.status_id in (" +
          Constants.HyprOrderStates.RESERVED +
          "," +
          Constants.HyprOrderStates.PACKED +
          "," +
          Constants.HyprOrderStates.IN_TRANSIT +
          ")";
        findCriteria["status_id"] = [
          Constants.HyprOrderStates.RESERVED,
          Constants.HyprOrderStates.PACKED,
          Constants.HyprOrderStates.IN_TRANSIT,
        ];
      }
      let totalOrders = await Order.count({
        where: findCriteria,
      });
      // .usingConnection(db);
      let isRetailo = true;
      company_name = "Retailo"
      //check if retailo company in locations,bu or company
      // if (!GeneralHelper.emptyOrAllParam(params.company_id, true)) {
      //   let company = await Companies.find({ id: params.company_id });
      //   console.log("I ADMIN COMPANY");
      //   for (let i = 0; i < company.length; i++) {
      //     company_name = company[i].name;
      //     if (company[i].code == "RET") {
      //       isRetailo = true;
      //       break;
      //     }
      //   }
      // } else if (
      //   !GeneralHelper.emptyOrAllParam(params.business_unit_id, true)
      // ) {
      //   let bu = await BusinessUnit.find({
      //     id: params.business_unit_id,
      //   })
      //     .populate("company_id")
      //     .usingConnection(db);
      //   for (let i = 0; i < bu.length; i++) {
      //     bu_name = bu[i].name;
      //     company_name = bu[i].company_id.name;
      //     if (bu[i].company_id.code == "RET") {
      //       isRetailo = true;
      //       break;
      //     }
      //   }
      // } else if (!GeneralHelper.emptyOrAllParam(params.location_id, true)) {
      //   let location = await Location.find({
      //     id: params.location_id,
      //   })
      //     .populate("company_id")
      //     .usingConnection(db);
      //   for (let i = 0; i < location.length; i++) {
      //     store_name = location[i].name;
      //     company_name = location[i].company_id.name;
      //     if (location[i].company_id.code == "RET") {
      //       isRetailo = true;
      //       break;
      //     }
      //   }
      // } else if (GeneralHelper.emptyOrAllParam(params.company_id, true)) {
      //   isRetailo = true;
      // }

      var orderDump = [];
      let i = 1;
      if (totalOrders) {
        let shopSelection = " ";
        let shopJoin = " ";
        let csv =
          "orderId,orderStatus,orderDate,statusDate,deliveryTime,itemSKU,itemName,size,itemPrice,orderedQuantity,originalQuantity,totalPrice,customerName,customerPhone, location_cordinates, salesAgent, category, coupon_name, coupon_discount_value";
        if (isRetailo) {
          shopSelection +=
            ", sh.shop_location " +
            "as shopLocation, sh.shop_name as shopName, ca.city_area as tagged_area, o.channel, order_status_reason.description as status_reason ";
          shopJoin +=
            "LEFT JOIN retailo_users.customer_retailer_shop_details sh " +
            "ON c.id = sh.customer_id ";
          csv += ",shopLocation,shopName, Tagged Area, Channel, Status Reason";
        }
        let query =
          "SELECT o.status_id,o.delivery_time,o.total_price,ca.location_cordinates, oi.product_id, o.id as orderId, os.name as orderStatus, osh.created_at as statusDate, o.placed_at as orderDate" +
          ", u.name as sales_agent, o.coupon_id" +
          ",p.sku as itemSKU,p.name as itemName, p.size,oi.price as itemPrice," +
          "oi.quantity as orderedQuantity, oi.quantity * oi.price as totalPrice , oi.original_quantity as originalQuantity," +
          "c.name as customerName, c.phone as customerPhone" +
          shopSelection +
          "FROM orders o " +
          "JOIN order_items oi ON o.id = oi.order_id left JOIN " +
          "order_statuses os ON o.status_id = os.id JOIN " +
          "products p ON p.id = oi.product_id JOIN " +
          "retailo_users.customers c ON c.id = o.customer_id" +
          shopJoin;
        query +=
          " left join retailo_users.customer_addresses ca on o.customer_address_id = ca.id";
        query +=
          " left join order_status_reason on order_status_reason.id = o.status_reason_id";
        query +=
          " left join order_status_history osh on osh.order_id = o.id and osh.status_id = o.status_id";
        query += " left JOIN users u on u.id = o.sales_agent_id";
        query +=
          " where o.location_id in ( " +
          params.location_id +
          " )" +
          filterQuery;
        query += " group by o.id, oi.product_id";
        sails.log.info(`ORDER DUMP CALL:  QUERY - ${query}`);
        let orders = await sails.sendNativeQuery(query);
        // .usingConnection(db);
        orders = orders.rows;
        let couponIds = [];
        orders.map((order) => {
          if (order.coupon_id) {
            couponIds.push(order.coupon_id);
          }
        });
        // const rawCoupons = couponIds.length ? await CouponDao.find({ id: couponIds }) : [];
        let orderIds = [],
          product_ids = [];
        orders.forEach(function (o) {
          // const rawCoupon = rawCoupons.find(coupon => coupon.id === order.coupon_id);
          // o.coupon_name = rawCoupon?.name;
          // o.discount_value = rawCoupon?.discountValue;
          // o.coupon_type = rawCoupon?.discountType.value;
          if (o.orderId) orderIds.push(o.orderId);
          if (o.product_id) product_ids.push(o.product_id);
        });
        sails.log.info(`ORDER DUMP CALL: ORDERS PROCESSED WITH COUPON ADDITION`);
        let status_history_query =
          "select * from order_status_history where order_id in (" +
          orderIds +
          ")group by order_id, status_id order by created_at desc";
        let order_status_history = await sails
          .sendNativeQuery(status_history_query)
          // .usingConnection(db);
        order_status_history = order_status_history.rows;
        let history_map = {};
        sails.log.info(`ORDER DUMP CALL: ORDER STATUS HISTORY PROCESSED`);

        order_status_history.forEach(function (order) {
          if (!history_map[order.order_id]) history_map[order.order_id] = {};
          history_map[order.order_id][order.status_id] = order.created_at;
        });
        let p_query =
          "SELECT pcj.product_id, pcj.category_id, categories.name, categories.parent_id FROM categories";
        p_query +=
          " join product_categories_junction as pcj on pcj.category_id = categories.id";
        p_query +=
          " and categories.location_id in (" +
          params.location_id +
          ") and categories.parent_id is not null";

        sails.log.info(`ORDER DUMP CALL: PRODUCT IDS - ${JSON.stringify(product_ids)}`);

        p_query += " and pcj.product_id in (" + product_ids + ")";
        p_query +=
          " group by pcj.category_id, pcj.product_id, categories.parent_id;";

        sails.log.info(`ORDER DUMP CALL: PRODUCT CATEGORIES QUERY - ${p_query}`);

        let product_categories_L2 = await sails
          .sendNativeQuery(p_query)
          // .usingConnection(db);
        product_categories_L2 = product_categories_L2.rows;
        let L1_ids = product_categories_L2.map(function (cat) {
          return cat.parent_id;
        });
        let product_categories_L1 = await sails
          .sendNativeQuery(
            "SELECT categories.id as category_id, categories.name FROM categories where id in ($1)",
            [L1_ids]
          )
          // .usingConnection(db);
        product_categories_L1 = product_categories_L1.rows;
        let product_categories_map = {},
          parent_categories_map = {};
        product_categories_L1.forEach(function (cat) {
          parent_categories_map[cat.category_id] = cat.name;
        });
        product_categories_L2.forEach(function (cat) {
          if (product_categories_map[cat.product_id]) {
            product_categories_map[cat.product_id] +=
              " ; " + parent_categories_map[cat.parent_id] + "-" + cat.name;
          } else {
            product_categories_map[cat.product_id] =
              parent_categories_map[cat.parent_id] + "-" + cat.name;
          }
        });
        var orderExcel = [];
        async.each(
          orders,
          async (order, _callback) => {
            let formatted_date = order.orderDate
              ? new Date(
                order.orderDate.setMinutes(
                  order.orderDate.getMinutes() - req.param("clientTimeOffset")
                )
              )
              : null;
            formatted_date = datetime
              .create(formatted_date, "w n d Y H:M:S")
              .format();
            let formatted_delivery_time = order.delivery_time
              ? new Date(
                order.delivery_time.setMinutes(
                  order.delivery_time.getMinutes() -
                  req.param("clientTimeOffset")
                )
              )
              : null;
            formatted_delivery_time
              ? (formatted_delivery_time = datetime
                .create(formatted_delivery_time, "w n d Y H:M:S")
                .format())
              : null;
            let formatted_status_date =
              history_map[order.orderId] &&
                history_map[order.orderId][order.status_id]
                ? new Date(
                  history_map[order.orderId][order.status_id].setMinutes(
                    history_map[order.orderId][order.status_id].getMinutes() -
                    req.param("clientTimeOffset")
                  )
                )
                : null;
            formatted_status_date
              ? (formatted_status_date = datetime
                .create(formatted_status_date, "w n d Y H:M:S")
                .format())
              : null;
            /* NOTE: the original order status change date, formatted_status_date needs to be removed later */
            let formatted_status_date_o = order.statusDate
              ? new Date(
                order.statusDate.setMinutes(
                  order.statusDate.getMinutes() -
                  req.param("clientTimeOffset")
                )
              )
              : null;
            formatted_status_date_o = datetime
              .create(formatted_status_date_o, "w n d Y H:M:S")
              .format();
            let cust_location = "";
            if (order.location_cordinates) {
              cust_location = JSON.parse(order.location_cordinates);
              cust_location =
                cust_location.latitude + "," + cust_location.longitude;
            }
            if (isRetailo) {
              let loc =
                order.shopLocation && order.shopLocation != ""
                  ? JSON.parse(order.shopLocation)
                  : null;
              loc
                ? (order.shopLocation = loc.latitude + ", " + loc.longitude)
                : "";
            }
            var orderCSV;
            let coupon_discount_value;
            if (order.coupon_name) {
              if (order.coupon_type == "fixed")
                coupon_discount_value = order.discount_value;
              else
                coupon_discount_value =
                  (order.total_price / 100) * order.discount_value;
            }
            if (params.file_type == "csv") {
              orderCSV = [
                order.orderId,
                order.orderStatus ? '"' + order.orderStatus + '"' : "",
                formatted_date ? formatted_date : "",
                formatted_status_date_o ? formatted_status_date_o : "",
                formatted_delivery_time ? formatted_delivery_time : "",
                order.itemSKU ? '"' + order.itemSKU + '"' : "",
                order.itemName ? '"' + order.itemName + '"' : "",
                order.size ? '"' + order.size + '"' : "",
                order.itemPrice ? '"' + order.itemPrice + '"' : "",
                order.orderedQuantity ? '"' + order.orderedQuantity + '"' : "0",
                order.originalQuantity
                  ? '"' + order.originalQuantity + '"'
                  : "0",
                order.totalPrice ? '"' + order.totalPrice + '"' : "",
                order.customerName ? '"' + order.customerName + '"' : "",
                order.customerPhone ? '"' + order.customerPhone + '"' : "",
                JSON.stringify(cust_location),
                order.sales_agent ? '"' + order.sales_agent + '"' : "",
                product_categories_map[order.product_id]
                  ? '"' + product_categories_map[order.product_id] + '"'
                  : "",
                order.coupon_name ? '"' + order.coupon_name + '"' : "",
                coupon_discount_value ? '"' + coupon_discount_value + '"' : "",
              ];
              /* NOTE: adding shop location and shop name for retailo */
              if (isRetailo) {
                orderCSV.push(JSON.stringify(order.shopLocation));
                orderCSV.push(order.shopName ? '"' + order.shopName + '"' : "");
                orderCSV.push(order.tagged_area);
                order.channel
                  ? orderCSV.push(order.channel)
                  : orderCSV.push("");
                order.status_reason
                  ? orderCSV.push(order.status_reason)
                  : orderCSV.push("");
              }
              csv += "\n";
              csv += orderCSV.join(",");
              orderDump.push(orderCSV);
              i++;
              _callback();
            } else {
              orderExcel.push({
                orderId: order.orderId,
                orderStatus: order.orderStatus ? order.orderStatus : "",
                orderDate: formatted_date ? formatted_date : "",
                statusDate: formatted_status_date_o
                  ? formatted_status_date_o
                  : "",
                deliveryTime: formatted_delivery_time
                  ? formatted_delivery_time
                  : "",
                itemSKU: order.itemSKU ? order.itemSKU : "",
                itemName: order.itemName ? order.itemName : "",
                size: order.size ? order.size : "",
                itemPrice: order.itemPrice ? order.itemPrice : "",
                orderedQuantity: order.orderedQuantity
                  ? order.orderedQuantity
                  : "0",
                originalQuantity: order.originalQuantity
                  ? order.originalQuantity
                  : "0",
                totalPrice: order.totalPrice ? order.totalPrice : "",
                customerName: order.customerName ? order.customerName : "",
                customerPhone: order.customerPhone ? order.customerPhone : "",
                location_cordinates: JSON.stringify(cust_location),
                salesAgent: order.sales_agent ? order.sales_agent : "",
                category: product_categories_map[order.product_id]
                  ? product_categories_map[order.product_id]
                  : "",
                coupon_name: order.coupon_name ? order.coupon_name : "",
                coupon_discount_value: coupon_discount_value
                  ? coupon_discount_value
                  : "",
              });
              /* NOTE: adding shop location and shop name for retailo */
              if (isRetailo) {
                orderExcel[orders.indexOf(order)].shopLocation = JSON.stringify(
                  order.shopLocation
                );
                orderExcel[orders.indexOf(order)].shopName = order.shopName
                  ? order.shopName
                  : "";
                orderExcel[orders.indexOf(order)]["Tagged Area"] =
                  order.tagged_area;
                orderExcel[orders.indexOf(order)].Channel = order.channel
                  ? order.channel
                  : "";
                orderExcel[orders.indexOf(order)][
                  "Status Reason"
                ] = order.status_reason ? order.status_reason : "";
              }
              _callback();
            }
          },
          async function (err, result) {
            if (err) return res.serverError(err);
            else {
              var amazonfileName = new Date() + "order-dump";
              amazonfileName = amazonfileName.replace(/[^a-zA-Z0-9]/g, "-");
              if (params.file_type === "excel") {
                amazonfileName = amazonfileName + ".xlsx";
                const wb = xlsx.utils.book_new();
                wb.SheetNames.push("Orders");
                let header_order = [
                  "orderId",
                  "orderStatus",
                  "orderDate",
                  "statusDate",
                  "deliveryTime",
                  "itemSKU",
                  "itemName",
                  "size",
                  "itemPrice",
                  "orderedQuantity",
                  "originalQuantity",
                  "totalPrice",
                  "customerName",
                  "customerPhone",
                  "location_cordinates",
                  "salesAgent",
                  "category",
                  "coupon_name",
                  "coupon_discount_value",
                ];
                if (isRetailo) {
                  header_order = header_order.concat([
                    "shopLocation",
                    "shopName",
                    "Tagged Area",
                    "Channel",
                    "Status Reason",
                  ]);
                }
                const ws = xlsx.utils.json_to_sheet(orderExcel, {
                  header: header_order,
                });
                col_width_arr = [];
                for (let i = 0; i < 21; i++) {
                  col_width_arr.push({ width: 12 });
                }
                ws["!cols"] = col_width_arr;
                wb.Sheets.Orders = ws;
                const wbOut = xlsx.write(wb, {
                  bookType: "xlsx",
                  type: "buffer",
                });
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
                  console.log("Error at uploadFileOnS3Bucket function", err);
                } else {
                  console.log("File uploaded Successfully");
                  let user = await AuthStoreService.populateHierarchyAccess(
                    res.locals.userData
                  );
                  let recipients = await UtilService.getAccountEmails(user);
                  if (
                    res.locals.userData.email &&
                    res.locals.userData.email != ""
                  )
                    recipients.push(res.locals.userData.email);
                  let subject = "";
                  console.log(
                    "company name: " +
                    company_name +
                    " bu name: " +
                    bu_name +
                    " store name: " +
                    store_name
                  );
                  if (!company_name) {
                    subject = "All companies";
                  } else {
                    subject += company_name + " ";
                    if (bu_name) {
                      subject += " - business unit ( " + bu_name + " )";
                    }
                    if (store_name)
                      subject += " - store ( " + store_name + " )";
                  }
                  let fileUrl = `https://${sails.config.globalConf.AWS_BUCKET}.s3.${sails.config.globalConf.AWS_REGION}.amazonaws.com/${amazonfileName}`;
                  // MailerService.sendMailThroughAmazon({
                  //   email: recipients,
                  //   htmlpart:
                  //     fileUrl,
                  //   subject: subject + " Order Dump Report - " + new Date(),
                  //   destination: "operations@hypr.pk",
                  // });
                  res.ok(fileUrl);
                }
              });
            }
          }
        );
      } else {
        res.ok([], { message: "no orders found" });
      }
    // });
  },
};

const getDateDifference = (startDate, endDate) => {
  const startingDate = new Date(startDate);
  const endingDate = new Date(endDate);
  return Math.floor(
    (Date.UTC(endingDate.getFullYear(), endingDate.getMonth(), endingDate.getDate()) -
      Date.UTC(startingDate.getFullYear(), startingDate.getMonth(), startingDate.getDate())) /
    (1000 * 60 * 60 * 24)
  );
}
