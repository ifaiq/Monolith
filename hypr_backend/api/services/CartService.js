var defer = require("node-defer");
var redis = require("ioredis");
if (process.env.REDIS_SERVER)
  var client = redis.createClient({ host: process.env.REDIS_SERVER });
else var client = redis.createClient();

var lock = require("redis-lock")(client);

var Scheduler = require("redis-scheduler");
var redisScheduler = new Scheduler({
  host: process.env.REDIS_SERVER,
  port: 6379,
});

const locationExtractionService = require("../config_service_extraction/locationsExtraction");
const companyExtractionService = require("../config_service_extraction/companiesExtraction");

module.exports = {
  updateOrderFromCart: async function (params) {
    let response = await new Promise(async (resolve) => {
      try {
        let order = await Order.findOne({ uuid: params.orderId });

        let orderItems = await CartService.mapSkuToId(
          order.id,
          params.orderItems,
          order.location_id
        );

        let removeResponse = await CartService.removeOrderItems(
          order.id,
          orderItems
        );
        if (removeResponse.success) {
          params.orderItems.forEach(function (item) {
            item.order_id = order.id;
          });

          let updatedOrderItems = await CartService.updateOrCreate(
            order.id,
            orderItems,
            params.fromPackerApp
          );
          if (updatedOrderItems.success) {
            err_msg = updatedOrderItems.err_msg;
            let order_items = updatedOrderItems.items;
            let taxResponse = await CartService.calculateTaxOnProducts(
              order.id,
              order_items
            );

            let orderUpdated = await CartService.updateOrderData(
              order.id,
              taxResponse.tax,
              params.clientTimeOffset
            );

            if (orderUpdated.success && taxResponse.success) {
              order["orderItems"] = taxResponse.orderItems;
              order["tax"] = parseFloat(taxResponse.tax);
              let totalResponse = await CartService.calculateGrandTotal(order);
              order["grand_total"] = parseFloat(totalResponse.grand_total);
              let totalForCoupon = order["grand_total"] + order["tax"];
              let coupon = null;
              let coupon_message = "";
              if (params.coupon_name || params.coupon_id) {
                let coupon_response = await CouponService.isValidCoupon({
                  location_id: order.location_id,
                  coupon_name: params.coupon_name,
                  coupon_id: params.coupon_id,
                  customer_id: order.customer_id,
                });
                if (coupon_response && coupon_response.coupon == null) {
                  coupon_message = coupon_response.message;
                  coupon = null;
                } else if (coupon_response && coupon_response.coupon) {
                  if (coupon_response.coupon.disabled) {
                    coupon_message = "Coupon disabled";
                    coupon = null;
                  } else if (coupon_response.coupon.min_coupon_limit) {
                    if (
                      totalForCoupon >= coupon_response.coupon.min_coupon_limit
                    ) {
                      coupon_message = coupon_response.message;
                      coupon = coupon_response.coupon;
                    } else {
                      coupon_message = `Order limit for coupon ${coupon_response.coupon.name} is ${coupon_response.coupon.min_coupon_limit}`;
                      coupon = null;
                    }
                  } else {
                    coupon_message = coupon_response.message;
                    coupon = coupon_response.coupon;
                  }
                }
              } else if (order.coupon_id)
                coupon_message = "Coupon Removed Successfully!";
              let customResponse = await CartService.buildCustomResponse(
                order,
                coupon,
                params.max_order_limit
              );

              if (customResponse.success) {
                await Order.update(
                  {
                    id: order.id,
                  },
                  {
                    coupon_id: coupon ? coupon.id : null,
                    coupon_discount: customResponse.order["coupon_discount"],
                  }
                );
                
                resolve({
                  success: true,
                  order: customResponse.order,
                  err_msg: updatedOrderItems.err_msg,
                  coupon_message: coupon_message ? coupon_message : "",
                });
              } else {
                sails.log.warn(
                  `OrderID: ${order.id
                  } Error occurred while building custom response: ${JSON.stringify(
                    customResponse
                  )}`
                );
                resolve({
                  success: false,
                  trace: customResponse.trace,
                  message: "ERROR OCCURRED WHILE BUILDING CUSTOME RESPONSE",
                  type: ErrorTypes.SERVER_ERROR,
                });
              }
            } else {
              sails.log.warn(
                `OrderID: ${order.id
                } Error occurred while updating order or calculating tax: ${JSON.stringify(
                  orderUpdated.trace || taxResponse.trace
                )}`
              );
              resolve({
                success: false,
                trace: orderUpdated.trace || taxResponse.trace,
                message:
                  "ERROR OCCURRED WHILE UPDATING ORDER OR CALCULATING TAX",
                type: ErrorTypes.SERVER_ERROR,
              });
            }
          } else {
            sails.log.warn(
              `OrderID: ${order.id
              } Error occurred while updating order items: ${JSON.stringify(
                updatedOrderItems.trace
              )}`
            );
            resolve({
              success: false,
              trace: updatedOrderItems.trace,
              message: "ERROR OCCURRED WHILE UPDATING ORDER ITEMS",
              type: ErrorTypes.SERVER_ERROR,
            });
          }
        } else {
          sails.log.warn(
            `OrderID: ${order.id
            } Error occurred while removing order items: ${JSON.stringify(
              removeResponse.trace
            )}`
          );
          resolve({
            success: false,
            trace: removeResponse.trace,
            message: "REMOVE ITEMS ERROR",
            type: ErrorTypes.SERVER_ERROR,
          });
        }
      } catch (err) {
        sails.log.error(`Error in cart: ${JSON.stringify(err)}`);
        resolve({
          success: false,
          trace: err,
          message: "CART ERROR",
          type: ErrorTypes.SERVER_ERROR,
        });
      }
    });

    return response;
  },

  calculateTaxOnProducts: async function (orderId, orderItems) {
    let response = await new Promise(async (resolve) => {
      var tax = 0.0;
      async.eachSeries(
        orderItems,
        async function (orderItem, cb) {
          try {
            let locationPrice = await Product.findOne({
              id: orderItem.product_id,
              // disabled: false, NOTE: removed as reserve Quantity will serve the purpose
            });

            if (locationPrice) {
              var tax_amount =
                (parseFloat(locationPrice.tax_percent) / 100) *
                parseFloat(ProductService.getPriceByCategory(locationPrice));
              tax = tax + parseFloat(tax_amount * parseInt(orderItem.quantity));

              if (locationPrice.tax_inclusive) {
                orderItem["price"] = locationPrice.price
                  ? (
                    parseFloat(locationPrice.price) - parseFloat(tax_amount)
                  ).toFixed(2)
                  : 0.0;
              } else {
                orderItem["price"] = locationPrice.price
                  ? parseFloat(locationPrice.price).toFixed(2)
                  : 0.0;
              }
              orderItem["tax_amount"] = tax_amount
                ? (
                  parseFloat(tax_amount) * parseInt(orderItem.quantity)
                ).toFixed(2)
                : 0.0;

              orderItem["price"] = parseFloat(orderItem["price"]);
              cb();
            } else {
              sails.log.warn(
                `OrderID: ${orderId} ProductID: ${orderItem.product_id} Product not found`
              );
              cb("PRODUCT NOT FOUND");
            }
          } catch (err) {
            sails.log.warn(
              `OrderID: ${orderId} Tax calculation error ${JSON.stringify(err)}`
            );
            cb(err);
          }
        },
        function (err, success) {
          if (err) {
            sails.log.error(
              `CartService.calculateTaxOnProducts(), OrderID: ${orderId} Error occurred while calculating tax -> ${JSON.stringify(err)}`
            );

            resolve({
              message: "ERROR OCCURRED WHILE CALCULATING TAX",
              trace: err,
              type: ErrorTypes.SERVER_ERROR,
              success: false,
            });
          } else {
            sails.log.debug(
              `OrderID: ${orderId} CartService.calculateTaxOnProducts tax ${JSON.stringify(
                tax ? tax.toFixed(2) : 0.0
              )} Order Items: ${JSON.stringify(orderItems)}`
            );
            resolve({
              success: true,
              tax: tax ? tax.toFixed(2) : 0.0,
              orderItems: orderItems,
            });
          }
        }
      );
    });
    return response;
  },

  updateOrderData: async function (orderId, tax, clientTimeOffset) {
    let response = await new Promise(async (resolve) => {
      try {
        await Order.updateAndCreateHistory(
          {
            id: orderId,
          },
          { tax: 0.00 } // we don't need to store tax on order level, as we are storing it on item level
        );
        resolve({
          success: true,
        });
      } catch (err) {
        sails.log.warn(
          `OrderID: ${orderId} Error while updating order: ${err}`
        );
        resolve({
          success: false,
          trace: err,
          message: "ERROR OCCURRED WHILE UPDATING ORDER",
          type: ErrorTypes.SERVER_ERROR,
        });
      }
    });
    return response;
  },

  /* NOTE: its only calculating order total now ( exclusive of tax ) 
   Adding everything up while building * CUSTOME RESPONSE * */

  calculateGrandTotal: async function (order) {
    let response = new Promise(async (resolve) => {
      var total = 0;
      async.eachSeries(
        order["orderItems"],
        function (item, callback) {
          total = total + item.price * item.quantity;
          callback();
        },
        function (err, success) {
          total = total.toFixed(2);
          var grand_total = parseFloat(total);
          resolve({
            success: true,
            grand_total: grand_total ? grand_total.toFixed(2) : 0.0,
          });
        }
      );
    });
  
    return response;
  },

  removeOrderItems: async function (orderId, orderItems) {
    let response = await new Promise(async (resolve) => {
      sails.log.info(
        `OrderID: ${orderId} Current order items: ${JSON.stringify(orderItems)}`
      );
      try {
        let dbOrderItems = await OrderItems.find({ order_id: orderId });
        var dbOrderItemsProductIds = [];
        sails.log.info(
          `OrderID: ${orderId} Old order items: ${JSON.stringify(dbOrderItems)}`
        );
        for (var item of dbOrderItems)
          dbOrderItemsProductIds.push(item.product_id);
        let dbOrderItemsToBeDeleted = dbOrderItemsProductIds.filter(
          (product_id) => {
            return !orderItems.find(
              (newItem) => product_id === newItem.product_id
            );
          }
        );

        if (dbOrderItemsToBeDeleted.length) {
          let deletedDBOrderItems = await OrderItems.destroy({
            product_id: dbOrderItemsToBeDeleted,
            order_id: orderId,
          });

          resolve({
            success: true,
          });
        } else {
          resolve({
            success: true,
          });
        }
      } catch (err) {
        sails.log.error(`CartService.removeOrderItems(), OrderID: ${orderId} Error: ${JSON.stringify(err)}`);
        resolve({
          message: "ERROR OCCURRED WHILE REMOVING ITEMS",
          type: ErrorTypes.SERVER_ERROR,
          trace: err,
          success: false,
        });
      }
    });

    return response;
  },

  getProductAndLocationPrice: async function (orderId, productId) {
    let response = await new Promise(async (resolve) => {
      try {
        let product = await Product.findOne({
          id: productId,
        });
        if (product) {
          const priceByCategory = ProductService.getPriceByCategory(product)
          var tax_amount = parseFloat(
            (product["tax_percent"] / 100) * priceByCategory
          );
          product["price"] = product.tax_inclusive
            ? parseFloat(product["price"] - tax_amount).toFixed(2)
            : parseFloat(product["price"]).toFixed(2);
          resolve({
            success: true,
            product: product,
            tax: tax_amount
          });
        } else {
          sails.log.debug(
            `OrderID: ${orderId} Product not found. ProductID: ${productId}`
          );
          resolve({
            message: "PRODUCT NOT FOUND",
            type: ErrorTypes.SERVER_ERROR,
            success: false,
            trace: "PRODUCT NOT FOUND",
          });
        }
      } catch (err) {
        sails.log.error(
          `OrderID: ${orderId} Error occurred while fetching product location price -> ${JSON.stringify(err)}`
        );
        resolve({
          message: "ERROR OCCURREDS WHILE FETCHING PRODUCT LOCATION PRICE",
          type: ErrorTypes.SERVER_ERROR,
          success: false,
          trace: err,
        });
      }
    });

    return response;
  },

  createOrderFromCart: async function (orderId, orderItems) {
    let response = await new Promise(async (resolve) => {
      var items = [];
      async.eachSeries(
        orderItems,
        async function (item, callback) {
          let result = await CartService.getProductAndLocationPrice(
            orderId,
            item.product_id
          );

          let product = result.product;

          if (result.success) {
            item["original_quantity"] = item["quantity"];
            item["price"] = product.price
            item["tax"] = result.tax
            try {
              /* NOTE: adding order id */
              item["order_id"] = orderId;
              let orderItem = await OrderItems.create(item);
              items.push(orderItem);
              
              callback(null, items);
            } catch (err) {
              sails.log.info(
                `OrderID: ${orderId} Error: ${JSON.stringify(err)}`
              );
              callback(err);
            }
          } else {
            sails.log.warn(
              `OrderID: ${orderId} Error: ${JSON.stringify(result.trace)}`
            );
            callback(result.trace);
          }
        },
        function (err, response) {
          if (err) {
            sails.log.error(`OrderID: ${orderId} Error: ${JSON.stringify(err)}`);
            return resolve({
              message: "AN ERROR OCCURRED IN ASYNC",
              trace: err,
              type: ErrorTypes.SERVER_ERROR,
              success: false,
            });
          }

          resolve({
            success: true,
            items: items,
          });
        }
      );
    });

    return response;
  },

  updateOrCreate: async function (orderId, orderItems, fromPackerApp = false) {
    var items = [];
    var err_msg = [];
    sails.log.debug(
      `OrderID: ${orderId} updateOrCreate order items: ${JSON.stringify(
        orderItems
      )}`
    );
    let response = await new Promise(async (resolve) => {
      async.eachSeries(
        orderItems,
        async function (item, cb) {
          try {
            let product = await Product.findOne({ id: item.product_id });
            let foundItem = await OrderItems.findOne({
              product_id: item.product_id,
              order_id: item.order_id,
            });
            if (foundItem == undefined) {
              if (
                product.stock_quantity >= item.quantity &&
                !product.disabled
              ) {
                const result = await CartService.getProductAndLocationPrice(item.order_id, item.product_id);
                item["price"] = result.product.price
                item["tax"] = result.tax

                if (typeof item["quantity"] == "string")
                  item["quantity"] = parseInt(item["quantity"]);
                item["original_quantity"] = item["quantity"];
                try {
                  let createdItem = await OrderItems.create(item);
                  items.push(createdItem);

                  cb();
                } catch (err) {
                  sails.log.warn(
                    `OrderID: ${orderId} Error: ${JSON.stringify(err)}`
                  );
                  cb(err);
                }
              } else if (product.disabled) {
                let msg = {};
                msg[item.product_id] = "PRODUCT NOT AVAILABLE";
                msg["isDisabled"] = 1;
                items.push(item);
                sails.log.info(
                  `OrderID: ${orderId} Product disabled: ${JSON.stringify(
                    item
                  )}`
                );
                err_msg.push(msg);
                cb();
              } else {
                let msg = {};
                msg[item.product_id] = !product.stock_quantity
                  ? "INVENTORY NOT AVAILABLE"
                  : "INVENTORY AVAILABLE ( " + product.stock_quantity + " )";
                msg["stock_available"] = product.stock_quantity;
                if (!product.stock_quantity) msg["isOutOfStock"] = 1;
                item["quantity"] = product.stock_quantity;
                items.push(item);

                err_msg.push(msg);
                cb();
              }
            } else {
              if (fromPackerApp) {
                let result = await CartService.updateCartItem(
                  item,
                  foundItem.price / foundItem.quantity
                );
                if (result.success) {
                  result.item.product_id = product.id;
                  items.push(result.item);
                  cb();
                } else cb(result.trace);
              } else {
                if (
                  product.stock_quantity >= item.quantity &&
                  !product.disabled
                ) {
                  let result = await CartService.updateCartItem(
                    item,
                    foundItem.price / foundItem.quantity
                  );
                  if (result.success) {
                    items.push(result.item);
                    cb();
                  } else {
                    sails.log.warn(
                      `OrderID: ${orderId} updateOrCreate Error: ${JSON.stringify(
                        result.trace
                      )}`
                    );
                    cb(result.trace);
                  }
                } else if (product.disabled) {
                  let msg = {};
                  msg[item.product_id] = "PRODUCT NOT AVAILABLE";
                  msg["isDisabled"] = 1;
                  item.quantity = foundItem.quantity;
                  items.push(item);
                  err_msg.push(msg);

                  cb();
                } else {
                  let msg = {};
                  msg[item.product_id] = !product.stock_quantity
                    ? "INVENTORY NOT AVAILABLE"
                    : "INVENTORY AVAILABLE ( " + product.stock_quantity + " )";
                  msg["stock_available"] = product.stock_quantity;
                  if (!product.stock_quantity) msg["isOutOfStock"] = 1;
                  item["quantity"] = product.stock_quantity;
                  items.push(item);
                  err_msg.push(msg);

                  cb();
                }
              }
            }
          } catch (err) {
            let msg = {};
            msg[item.product_id] = "PRODUCT NOT FOUND";
            err_msg.push(msg);
            sails.log.warn(
              `OrderID: ${orderId} Product not found: ${item.product_id
              } Error: ${JSON.stringify(err)}`
            );
            cb();
          }
        },
        function (err, success) {
          if (err) {
            sails.log.warn(
              `OrderID: ${orderId} Error in updateOrCreate: ${JSON.stringify(
                err
              )}`
            );
            resolve({
              trace: err,
              message: "ERROR OCCURRED WHILE PROCESSING",
              type: ErrorTypes.SERVER_ERROR,
              success: false,
            });
          } else {
            sails.log.info(
              `OrderID: ${orderId} Items: ${JSON.stringify(items)}`
            );
            resolve({ success: true, items: items, err_msg: err_msg });
          }
        }
      );
    });

    return response;
  },

  // [NOTE]: DEPRECATED SERVICE FUNCTION
  buildCustomResponse: async function (order, coupon, max_order_limit) {
    let response = await new Promise(async (resolve) => {
      var items = order.orderItems;
      let customerOrder = _.pick(order, ["uuid"]);
      Object.defineProperty(
        customerOrder,
        "id",
        Object.getOwnPropertyDescriptor(customerOrder, "uuid")
      );
      delete customerOrder["uuid"];

      let tax = 0.0;
      async.eachSeries(
        items,
        async function (item, callback) {
          try {
            let product = await Product.findOne({
              id: item["product_id"],
            });
            item['price'] = parseFloat(item["price"]) + parseFloat(item["tax_amount"]) / parseInt(item["quantity"])
            var customObj = {
              product_sku: product["sku"],
              quantity: item["quantity"],
              name: product.name ? product.name : "",
              unit: product["unit"],
              size: product["size"],
              image_url: product["image_url"],
              brand: product["brand"],
              price: item['price'],
              total: item["price"] * item["quantity"],
              product_id: item["product_id"],
              tax_amount: item["tax_amount"]
                ? parseFloat(item["tax_amount"])
                : 0.0,
              disabled: product.disabled,
              isOutOfStock: product.stock_quantity <= 0 ? true : false,
              stock_quantity: product["stock_quantity"],
              tax_percent: product["tax_percent"],
              tax_inclusive: product["tax_inclusive"],
              consent_required: product["consent_required"],
            };
            tax += parseFloat(item["tax_amount"]);
            var index = items.indexOf(item);
            items[index] = customObj;
            callback();
          } catch (err) {
            callback(err);
          }
        },
        async function (err, success) {
          if (err) {
            resolve({
              success: false,
              message: "ERROR occurred WHILE BUILDING CUSTOM RESPONSE",
              type: ErrorTypes.SERVER_ERROR,
              trace: err,
            });
          } else {
            customerOrder["cartItems"] = items;
            customerOrder["total_price"] = order.grand_total + tax;
            customerOrder["service_charge"] = 0.0;
            customerOrder["delivery_charge"] = 0.0;
            customerOrder["tax"] = 0.00; // old consumer app will show tax zero
            customerOrder["sub_total"] = parseFloat(
              (order.grand_total + tax).toFixed(2)
            );
            if (coupon) {
              customerOrder["is_coupon"] = 1;
              customerOrder[
                "coupon_discount"
              ] = CouponService.calculateCouponDiscount(
                coupon,
                customerOrder["sub_total"]
              );
              customerOrder["coupon_id"] = coupon;
            } else {
              customerOrder["is_coupon"] = 0;
              customerOrder["coupon_discount"] = 0;
            }
            customerOrder.service_charge = GeneralHelper.getFlatOrPercent(
              order.service_charge_type,
              order.service_charge_value,
              customerOrder["sub_total"]
            );
            let location = await locationExtractionService.findOne({
              id: order.location_id,
            });
            location.company_id = await companyExtractionService.findOne({
              id: location.company_id
            });
            if (
              location.company_id.code == Constants.COMPANIES.CHASE &&
              customerOrder["sub_total"] >=
              Constants.ORDER_LIMITS.CHASE_ORDER_LIMIT_FOR_DELIVERY_CHARGE
            ) {
              customerOrder.delivery_charge = GeneralHelper.getFlatOrPercent(
                order.delivery_charge_type,
                0.0,
                customerOrder["sub_total"]
              );
              let updateOrder = await Order.update(
                {
                  uuid: customerOrder["id"],
                },
                { delivery_charge_value: 0.0 }
              );
            } else {
              if (location.company_id.code == Constants.COMPANIES.CHASE) {
                let result = await Order.update(
                  {
                    uuid: customerOrder["id"],
                  },
                  { delivery_charge_value: location.delivery_charge_value }
                );
                order.delivery_charge_value = result[0].delivery_charge_value;
              }
              customerOrder.delivery_charge = GeneralHelper.getFlatOrPercent(
                order.delivery_charge_type,
                order.delivery_charge_value,
                customerOrder["sub_total"]
              );
            }
            customerOrder["grand_total"] = parseFloat(
              parseFloat(customerOrder["sub_total"]) -
              customerOrder["coupon_discount"] +
              customerOrder["service_charge"] +
              customerOrder["delivery_charge"]
            ).toFixed(2);
            if (max_order_limit && customerOrder.grand_total > max_order_limit) {
              sails.log.warn(
                `OrderID: ${order.id
                } Order total: ${order.grand_total} is greater than order limit: ${max_order_limit}`
              );
              customerOrder["order_limit"] = max_order_limit;
            }

            resolve({
              success: true,
              order: customerOrder,
            });
          }
        }
      );
    });

    return response;
  },

  inventoryReviveCallback: async function (err, key) {
    var orderId = key.split("_")[0];

    try {
      let order = await Order.findOne({ id: orderId });
      if (order.status_id != Constants.HyprOrderStates.SALE_ORDER) return false;

      let orderItems = await OrderItems.find({ order_id: orderId });
      async.eachSeries(
        orderItems,
        function (item, callback) {
          lock(
            `${RedisService.FILTER_NAMES.product}_*product_id:${item.product_id}_*`,
            // sails.config.globalConf.redisEnv + ":" + item.product_id,
            async function (done) {
              try {
                let product = await Product.findOne({ id: item.product_id });
                let updatedProduct = await Product.update(
                  {
                    id: item.product_id,
                  },
                  { stock_quantity: product.stock_quantity + item.quantity }
                );
                done(function () {
                });
                callback();
              } catch (err) {
                done(function () {
                });
                callback(err);
              }
            }
          );
        },
        function (err, success) {
          if (err) sails.log.error("ERROR OCCURRED INVENTROY REVIVE", err);
          redisScheduler.cancel({ key: key }, function () {
          });
        }
      );
    } catch (err) {
      sails.log.error("ERROR WHILE GETTING ORDER  ", err);
    }
  },

  releaseReservedInventory: async function (orderId, products) {
    let response = await new Promise(async (resolve, reject) => {
      async.eachSeries(
        products,
        function (item, callback) {
          lock(
            `${RedisService.FILTER_NAMES.product}_*product_id:${item.product_id}_*`,
            // sails.config.globalConf.redisEnv + ":" + item.product_id,
            async function (done) {
              try {
                let product = await Product.findOne({ id: item.product_id });
                let updatedProduct = await Product.update(
                  {
                    id: item.product_id,
                  },
                  { stock_quantity: product.stock_quantity + item.quantity }
                );
                done(function () {
                });
                callback();
              } catch (err) {
                sails.log.error(
                  `OrderID: ${orderId} Error in releasing inventory: ${JSON.stringify(
                    err
                  )}`
                );
                done(function () {
                  sails.log.info(
                    `OrderID: ${orderId} Released lock for: ${item.product_id}`
                  );
                });
                callback(err);
              }
            }
          );
        },
        function (err, success) {
          if (err) {
            sails.log.warn(`OrderID: ${orderId} Error: ${JSON.stringify(err)}`);
            reject({
              success: false,
              trace: err,
              message: "ERROR occurred WHILE RELEASE RESERVATION",
              type: ErrorTypes.SERVER_ERROR,
            });
          } else {
            resolve({
              success: true,
              message: "DONE",
            });
          }
        }
      );
    });
    
    return response;
  },

  updateCartItem: async function (item, price) {
    let response = await new Promise(async (resolve) => {
      try {
        let updatedItem = await OrderItems.update(
          { product_id: item.product_id, order_id: item.order_id },
          {
            quantity: item.quantity,
            original_quantity: item.quantity,
          }
        );
        resolve({
          success: true,
          item: updatedItem[0],
        });
      } catch (err) {
        sails.log.warn(
          `OrderID: ${item.order_id
          } Error while updating cart item: ${JSON.stringify(err)}`
        );
        resolve({
          success: false,
          trace: err,
          type: ErrorTypes.SERVER_ERROR,
          message: "ERROR occurred WHILE UPDATING",
        });
      }
    });

    return response;
  },

  mapSkuToId: async function (orderId, orderItems, locationId) {
    var order_items = [];
    let response = await new Promise(async (resolve, reject) => {
      async.eachSeries(
        orderItems,
        async function (item, callback) {
          try {
            let product = await Product.findOne({
              sku: item.product_sku,
              location_id: locationId,
            });
            if (product) {
              item.product_id = product.id;
              order_items.push(item);
            }
            callback();
          } catch (err) {
            callback(err);
          }
        },
        function (err, response) {
          if (err) {
            sails.log.warn(`OrderID: ${orderId} Error: ${JSON.stringify(err)}`);
            reject(err);
          } else {
            sails.log.info(
              `OrderID: ${orderId} Order items: ${JSON.stringify(order_items)}`
            );
            resolve(order_items);
          }
        }
      );
    });

    return response;
  },

  mapIdToSku: async function (orderItems) {
    var order_items = [];
    let response = await new Promise(async (resolve) => {
      async.eachSeries(
        orderItems,
        async function (item, callback) {
          let product = await Product.findOne({
            id: item.product_id,
          });
          item.product_sku = product.sku;
          order_items.push(item);
          callback();
        },
        function (err, response) {
          resolve(order_items);
        }
      );
    });
    return response;
  },
};
