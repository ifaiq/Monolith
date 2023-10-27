var defer = require("node-defer");
var requestify = require("requestify");
var ejs = require("ejs");
var emptyCustomerObj = {
  name: "-",
  address: "-",
  phone: "-",
};

const {
  locationService: {
    findLocation
  }
} = require('../modules/v1/Location');
const { Notifications } = require("@development-team20/notification-library");

// User Extraction Services
const userExtractionService = require('../user_service_extraction/userService');
const customerExtractionService = require('../user_service_extraction/customerService');
const customerRetailerShopExtractionService = require('../user_service_extraction/customerRetailerShopDetailService');
const customerAddressExtractionService = require('../user_service_extraction/customerAddressService');
const accountSettingsExtractionService = require("../config_service_extraction/accountSettingsExtraction");
const locationExtractionService = require("../config_service_extraction/locationsExtraction");
const businessUnitExtractionService = require("../config_service_extraction/businessUnitExtraction");
const companiesExtractionService = require("../config_service_extraction/companiesExtraction");
const { findAllUserNotifications } = require('../modules/v1/UserNotification/UserNotificationDao');
const CouponDao = require("../modules/v1/Coupon/CouponDao");

function getDateForBatchNo(inputDate) {
  let date = inputDate.getDate();
  let month = inputDate.getMonth();
  let year = inputDate.getFullYear();
  return pad(date) + pad(month + 1) + year;
}
function pad(n) {
  return n < 10 ? "0" + n : n;
}

function getBatchNo(inputStartDate, inputEndDate, delivery_boy_id) {
  let startDate = new Date(inputStartDate);
  let endDate = new Date(inputEndDate);
  let batch_no =
    getDateForBatchNo(startDate) + "-" + getDateForBatchNo(endDate);
  delivery_boy_id ? (batch_no += "-" + delivery_boy_id) : null;
  return batch_no;
}

module.exports = {
  assemblePackerOrderList: async function (findCriteria, sortCriteria) {
    let response = await new Promise(async (resolve) => {
      try {
        findCriteria.sort = findCriteria.sort
          ? findCriteria.sort
          : "delivery_time desc";
        let orders_query = await Order.find(findCriteria)
          // .populate("sales_agent_id")
          // .populate("customer_id")
          // .populate("customer_address_id")
          .populate("status_id")
          .populate("location_id");
          // .populate("delivery_boy_id")
          // .populate("packer_id")

        if (sortCriteria) {
          orders_query.sort(sortCriteria);
        }
        let orders = await orders_query;
        let userIds = [];
        const customerIds = [];
        const customerAddressIds = [];
        const couponIds = [];
        for (order of orders) {
          if (order.delivery_boy_id) {
            userIds.push(order.delivery_boy_id)
          }
          if (order.packer_id) {
            userIds.push(order.packer_id);
          }
          if (order.sales_agent_id) {
            userIds.push(order.sales_agent_id);
          }
          if (order.customer_address_id) {
            customerAddressIds.push(order.customer_address_id)
          }
          if (order.customer_id) {
            customerIds.push(order.customer_id);
          }
          if (order.coupon_id) {
            couponIds.push(order.coupon_id);
          }
        }
        const users = await userExtractionService.getAll({ id: userIds });
        const customerAddresses = await customerAddressExtractionService.find({ id: customerAddressIds });
        const customers = await customerExtractionService.find(({ id: customerIds }));
        const coupons = couponIds.length ? await CouponDao.find({ id: couponIds }) : [];
        async.each(
          orders,
          async function (order, callback) {
            order.customer_address_id = customerAddresses.find(address => address.id === order.customer_address_id);
            order.customer_id = customers.find(customer => customer.id === order.customer_id) || order.customer_id;
            order.sales_agent_id = await users.find(obj => obj.id === order.sales_agent_id);
            order.delivery_boy_id = await users.find(obj => obj.id === order.delivery_boy_id);
            order.packer_id = await users.find(obj => obj.id === order.packer_id);
            order.coupon_id = coupons.find(coupon => coupon.id === order.coupon_id) || null;
            order["sub_total"] = order
              ? (parseFloat(order.tax) + parseFloat(order.total_price)).toFixed(
                2
              )
              : parseFloat(order.total_price);
            order.service_charge = GeneralHelper.getFlatOrPercent(
              order.service_charge_type,
              order.service_charge_value,
              order["sub_total"]
            );
            order.delivery_charge = GeneralHelper.getFlatOrPercent(
              order.delivery_charge_type,
              order.delivery_charge_value,
              order["sub_total"]
            );
            order["grand_total"] = order
              ? (
                parseFloat(order.total_price) +
                parseFloat(order.tax || 0) -
                parseFloat(order.coupon_discount || 0.0) +
                parseFloat(order.service_charge || 0.0) +
                parseFloat(order.delivery_charge || 0.0)
              ).toFixed(2)
              : parseFloat(order.total_price);
            if (!order.customer_id) {
              order.customer_id = emptyCustomerObj;
            }

            try {
              let history = await OrderStatusHistory.find({
                order_id: order.id,
              }).populate("status_id");
              order.history = history;
              let order_items = (await OrderItems.find({
                order_id: order.id,
              }).populate("product_id")).map(item => {
                item.price = parseFloat(item.price) + parseFloat(item.tax);
                return item;
              });
              let shopDetails = await customerRetailerShopExtractionService.findOne({
                customer_id: order.customer_id.id,
              });
              order.shopDetails = shopDetails ? shopDetails : null;
              order.items = order_items;
              var categories = [];
              var find_index = -1;
              order.original_price = 0;
              async.each(
                order_items,
                async function (item, callbackk) {
                  if (
                    item.original_quantity != item.quantity &&
                    !order.hasOwnProperty("is_out_of_stock")
                  ) {
                    order["is_out_of_stock"] = true;
                  }
                  try {
                    let categoryResponse = await CategoryService.getProductCategories(
                      item.product_id.id,
                      order.location_id.id
                    );
                    categoryResponse = categoryResponse.response;
                    if (
                      categoryResponse.status === "OK" &&
                      categoryResponse.data
                    ) {
                      var category = categoryResponse.data;
                      find_index = categories.findIndex(
                        (c) => c.category_id === category.category_id
                      );
                      if (find_index > -1) {
                        categories[find_index].items.push(item);
                      } else {
                        categories.push({
                          category_id: category.category_id,
                          category_name: category.category_name,
                          items: [item],
                        });
                      }
                    } else {
                      sails.log(
                        `UNABLE TO FIND PRODUCT CATEGORY AGAINST PRODUCT ID: ${item.product_id.id}, LOCATION ID: ${order.location_id.id}`
                      );
                    }
                    order.original_price += item.original_price * item.quantity;
                    callbackk();
                  } catch (err) {
                    callbackk(err);
                  }
                },
                async function (err, result) {
                  if (err) {
                    callback(err);
                  } else {
                    order["categories"] = await GeneralHelper.sortArray(
                      categories,
                      order.id
                    );

                    if (order.customer_address_id) {
                      if (order.customer_address_id.location_cordinates) {
                        order.customer_id = _.omit(order.customer_id, [
                          "customer_location_id",
                        ]);
                        order.customer_id.customer_location = {
                          location: JSON.parse(
                            order.customer_address_id.location_cordinates
                          ),
                        };
                      }
                      callback();
                    } else {
                      callback();
                    }
                  }
                }
              );
            } catch (err) {
              resolve({
                message:
                  "ERROR OCCURED WHILE FETCHING ORDER HISTORY OR ORDER ITEMS",
                trace: err,
                type: ErrorTypes.SERVER_ERROR,
                success: false,
              });
            }
          },
          function (err, result) {
            if (err) {
              resolve({
                message:
                  "ERROR OCCURED WHILE PROCCESING ASSEMBLE PACKER ORDER LIST",
                trace: err,
                type: ErrorTypes.SERVER_ERROR,
                success: false,
              });
            } else {
              resolve({
                orders: orders,
                success: true,
              });
            }
          }
        );
      } catch (err) {
        resolve({
          message:
            "ERROR OCCURED WHILE PROCCESING ASSEMBLE PACKER ORDER LIST MASTER RESOLVE",
          trace: err,
          type: ErrorTypes.SERVER_ERROR,
          success: false,
        });
      }
    });

    return response;
  },

  // [NOTE]: DEPRECATED SERVICE FUNCTION
  getBatchOrdersData: async function (params) {
    let response = await new Promise(async (resolve) => {
      try {
        let filterQuery = "";
        if (params.startDate) {
          let startDate = GeneralHelper.dateObjectToMySqlDateConversion(
            new Date(params.startDate)
          );
          filterQuery += " and o.placed_at > '" + startDate + "' ";
        }
        if (params.endDate) {
          let endDate = GeneralHelper.dateObjectToMySqlDateConversion(
            new Date(params.endDate)
          );
          filterQuery += " and o.placed_at < '" + endDate + "' ";
        }
        if (params.delivery_boy_id) {
          filterQuery =
            " and o.delivery_boy_id = " +
            params.delivery_boy_id +
            " and o.id in (SELECT order_id FROM order_history oh where oh.status_id = 5";
          if (params.startDate) {
            let startDate = GeneralHelper.dateObjectToMySqlDateConversion(
              new Date(params.startDate)
            );
            filterQuery += " and oh.updated_at > '" + startDate + "'";
          }
          if (params.endDate) {
            let endDate = GeneralHelper.dateObjectToMySqlDateConversion(
              new Date(params.endDate)
            );
            filterQuery += " and oh.updated_at < '" + endDate + "'";
          }
          filterQuery += " group by order_id order by updated_at)";
        }
        let selectQ =
          "SELECT baseParams.sku, baseParams.unitPrice as unitPrice, baseParams.quantity_taken, " +
          "baseParams.value_taken, (baseParams.quantity_taken - (CASE WHEN secondParams.deliveredQuan is not null " +
          "THEN secondParams.deliveredQuan ELSE 0 END)) as quantity_remaining, " +
          "(baseParams.value_taken - (CASE WHEN secondParams.deliveredValue is not null THEN secondParams.deliveredValue " +
          "ELSE 0 END)) as value_remaining ";
        let countQ =
          "SELECT count(baseParams.sku) as totalItems, sum(baseParams.unitPrice) as totalUnitPrice, " +
          "sum(baseParams.quantity_taken) as totalSkus, sum(baseParams.value_taken) as totalValue, " +
          "sum(baseParams.quantity_taken - (CASE WHEN secondParams.deliveredQuan is not null " +
          "THEN secondParams.deliveredQuan ELSE 0 END)) as totalRemainingQuan,  " +
          "sum(baseParams.value_taken - (CASE WHEN secondParams.deliveredValue is not null THEN secondParams.deliveredValue " +
          "ELSE 0 END)) as totalRemainingValue, sum(secondParams.deliveredQuan) as totalDeliveredQuan,  " +
          "sum(secondParams.deliveredValue) as totalDeliveredValue ";
        let common_query =
          " from (SELECT p.sku as sku, " +
          "ot.price as unitPrice, sum(ot.packed_quantity) as quantity_taken, sum(ot.price*ot.packed_quantity) as value_taken " +
          "FROM orders o JOIN order_items ot on o.id = ot.order_id JOIN products p on p.id = ot.product_id where o.location_id in " +
          "( " +
          params.location_id +
          " )" +
          filterQuery +
          " and o.status_id not in (" +
          Constants.HyprOrderStates.SALE_ORDER +
          ") group by p.sku) " +
          "as baseParams left JOIN (SELECT p.sku as sku, sum(ot.packed_quantity) as deliveredQuan, sum(ot.price*ot.packed_quantity) " +
          "as deliveredValue FROM orders o JOIN order_items ot on o.id = ot.order_id JOIN products p on p.id = ot.product_id " +
          "where o.location_id in ( " +
          params.location_id +
          " )" +
          filterQuery +
          // deliveryFilter +
          " and o.status_id in (" +
          +Constants.HyprOrderStates.PARTIAL_DELIVERED +
          "," +
          Constants.HyprOrderStates.DELIVERED +
          ") group by p.sku) as secondParams on baseParams.sku = secondParams.sku ";

        let result = await sails.sendNativeQuery(selectQ + common_query);
        let total = await sails.sendNativeQuery(countQ + common_query);
        let batch_no = getBatchNo(
          params.startDate,
          params.endDate,
          params.delivery_boy_id
        );
        resolve({
          orders: result.rows,
          total: total.rows[0],
          batch_no: batch_no,
          success: true,
        });
      } catch (err) {
        resolve({
          message: "ERROR OCCURED WHILE PROCCESING ASSEMBLE PACKER ORDER LIST",
          trace: err,
          type: ErrorTypes.SERVER_ERROR,
          success: false,
        });
      }
    });
    return response;
  },

  assembleOrdersList: async function (findCriteria, sortCriteria) {
    let response = await new Promise(async (resolve, reject) => {
      try {
        findCriteria.sort = sortCriteria;
        const orders = await Order.find(findCriteria)
          // .populate("customer_address_id")
          .populate("status_id")
          // .populate("location_id")
          // .populate("delivery_boy_id")
          // .populate("packer_id")
          .populate("status_reason_id");

        let userIds = [];
        const customerAddressIds = [];
        const customerIds = [];
        let couponIds = [];
        const locationIds = [];
        for (order of orders) {
          if (order.delivery_boy_id) {
            userIds.push(order.delivery_boy_id);
          }
          if (order.packer_id) {
            userIds.push(order.packer_id);
          }
          if (order.customer_address_id) {
            customerAddressIds.push(order.customer_address_id);
          }
          if (order.customer_id) {
            customerIds.push(order.customer_id);
          }
          if (order.coupon_id) {
            couponIds.push(order.coupon_id);
          }
          if (order.location_id) {
            locationIds.push(order.location_id);
          }
        }
        const users = await userExtractionService.getAll({ id: userIds });
        const customerAddresses = await customerAddressExtractionService.find({ id: customerAddressIds });
        const customers = await customerExtractionService.find(({ id: customerIds }));
        couponIds = []; // interim code, to be removed
        const coupons = couponIds.length ? await CouponDao.find({ id: couponIds }) : [];
        const locations = locationIds.length ? await locationExtractionService.find({ id: locationIds, allData: true }) : [];

        async.eachSeries(
          orders,
          async function (order, callback) {
            order.customer_id = customers.find(customer => customer.id === order.customer_id) || order.customer_id;
            order.customer_address_id = customerAddresses.find(address => address.id === order.customer_address_id);
            order.delivery_boy_id = (users.find(obj => obj.id === order.delivery_boy_id) || order.delivery_boy_id);
            order.packer_id = (users.find(obj => obj.id === order.packer_id) || order.packer_id);
            order.coupon_id = coupons.find(coupon => coupon.id === order.coupon_id) || null;
            order.location_id = _.cloneDeep(locations.find(location => location.id === order.location_id)) || null;

            async.parallel(
              [
                async function (_callback) {
                  order["sub_total"] = order
                    ? (
                        parseFloat(order.tax || 0) +
                        parseFloat(order.total_price)
                      ).toFixed(2)
                    : parseFloat(order.total_price);
                  order.service_charge = GeneralHelper.getFlatOrPercent(
                    order.service_charge_type,
                    order.service_charge_value,
                    order["sub_total"]
                  );
                  order.delivery_charge = GeneralHelper.getFlatOrPercent(
                    order.delivery_charge_type,
                    order.delivery_charge_value,
                    order["sub_total"]
                  );

                  // Service and Delivery charge already added to total_price
                  order["grand_total"] = order
                    ? (
                        parseFloat(order.total_price) -
                        (parseFloat(order.coupon_discount || 0.0) +
                          parseFloat(order.volume_based_discount || 0.0))
                      ).toFixed(2)
                    : parseFloat(order.total_price);

                  if (!order.customer_id) {
                    order.customer_id = emptyCustomerObj;
                  }

                  if (order.status_id.id === Constants.HyprOrderStates.IN_TRANSIT ||
                    order.status_id.id === Constants.HyprOrderStates.DELIVERED ||
                    order.status_id.id === Constants.HyprOrderStates.PARTIAL_DELIVERED) {
                    const orderWaiver = await OrderAmountAdjustment.findOne({
                      order_id: order.id,
                      context_name: 'WAIVER',
                      deleted_at: null
                    });
                    if (orderWaiver) {
                      const waiver = await Waiver.findOne({
                        id: orderWaiver.context_id
                      });
                      order.waiver = {
                        amount: parseFloat(waiver.amount.toFixed(2)),
                        reason_id: waiver.reason_id,
                        reason: Constants.WAIVER_REASONS.getWaiverReasonFromId(waiver.reason_id),
                      }
                    }
                  }
                  _callback();
                },
                async function (_callback) {
                  try {
                    let history = await OrderStatusHistory.find({
                      order_id: order.id,
                    }).populate("status_id");
                    order.history = history;
                    if (order.id > 0) {
                      const orders_history = await OrderHistory.find({
                        order_id: order.id,
                      });
                      for (const index in order.history) {
                        if (order.history[index].status_id.id === Constants.HyprOrderStates.IN_TRANSIT) {
                          const order_history = orders_history.find(order_history =>
                            // Allow 2 seconds tollerance when comparing dates
                            !(order_history.created_at.getTime() > order.history[index].created_at.getTime() + 2000) &&
                            !(order_history.created_at.getTime() < order.history[index].created_at.getTime() - 2000));
                          sails.log.info(`assembleOrdersList() Order ID: ${order.id}, Order History: ${JSON.stringify(order_history)}`);
                          if (order_history) {
                            const new_order_json = JSON.parse(order_history.newOrderJSON)
                            const old_order_json = JSON.parse(order_history.oldOrderJSON)
                            if (new_order_json && new_order_json.delivery_boy_id) {
                              sails.log.info(`assembleOrdersList() Order ID: ${order.id}, New Order History: ${JSON.stringify(new_order_json)}, Delivery Boy ID: ${new_order_json.delivery_boy_id}`);
                              // const delivery_agent = await User.findOne({ id: new_order_json.delivery_boy_id })
                              const delivery_agent = await userExtractionService.getOne({ id: new_order_json.delivery_boy_id });
                              sails.log.info(`assembleOrdersList() Order ID: ${order.id}, Delivery Agent: ${JSON.stringify(delivery_agent)}`);
                              if (delivery_agent) {
                                order.history[index].delivery_agent = `Agent: ${delivery_agent.id} - ${delivery_agent.name}`;
                                order.history[index].delivery_agent_phone = `Phone: ${delivery_agent.phone}`
                              }
                            } else if (old_order_json && old_order_json.delivery_boy_id) {
                              sails.log.info(`assembleOrdersList() Order ID: ${order.id}, New Order History: ${JSON.stringify(old_order_json)}, Delivery Boy ID: ${old_order_json.delivery_boy_id}`);
                              // const delivery_agent = await User.findOne({ id: old_order_json.delivery_boy_id })
                              const delivery_agent = await userExtractionService.getOne({ id: old_order_json.delivery_boy_id });
                              sails.log.info(`assembleOrdersList() Order ID: ${order.id}, Old Histroy Delivery Agent: ${JSON.stringify(delivery_agent)}`);
                              order.history[index].delivery_agent = `Agent: ${delivery_agent.id} - ${delivery_agent.name}`;
                              order.history[index].delivery_agent_phone = delivery_agent.phone;
                            }
                          }
                        }
                      }
                    } else {
                      sails.log.warn(`order_history query failed - order.id=${order.id}`)
                    }
                    let order_items = (await OrderItems.find({
                      order_id: order.id,
                    }).populate("product_id")).map(item => {
                      item.price = parseFloat(item.price) + parseFloat(item.tax);
                      return item;
                    });
                    let shopDetails = await customerRetailerShopExtractionService.findOne(
                      {
                        customer_id: order.customer_id.id,
                      }
                    );
                    order.shopDetails = shopDetails ? shopDetails : null;
                    order.items = order_items;
                    if (order.customer_address_id) {
                      if (order.customer_address_id.location_cordinates) {
                        order.customer_id.customer_location = {};
                        order.customer_id.customer_location = {
                          location: JSON.parse(
                            order.customer_address_id.location_cordinates
                          ),
                        };
                      }
                      _callback();
                    } else {
                      _callback();
                    }
                  } catch (err) {
                    _callback(err);
                  }
                },
                async function (_callback) {
                  try {
                    const bu = await businessUnitExtractionService.find({
                      id: order.location_id.business_unit_id,
                    });

                    if (bu) {
                      order.location_id.business_unit_id = bu[0];
                      order.country_code = bu[0].country_code;
                      _callback();
                    } else {
                      _callback("NO BUSINESS UNIT FOUND");
                    }
                  } catch (err) {
                    _callback(err);
                  }
                },
                async function (_callback) {
                  try {
                    order.location_id.company_id = (await companiesExtractionService.find({
                      id: order.location_id.company_id,
                    }))[0];
                    _callback();
                  } catch (err) {
                    _callback(err);
                  }
                },
                async function (_callback) {
                  try {
                    order.service_charge = GeneralHelper.getFlatOrPercent(
                      order.service_charge_type,
                      order.service_charge_value,
                      order.total_price + parseFloat(order.tax)
                    );
                    order.delivery_charge = GeneralHelper.getFlatOrPercent(
                      order.delivery_charge_type,
                      order.delivery_charge_value,
                      order.total_price + parseFloat(order.tax)
                    );
                    _callback();
                  } catch (err) {
                    _callback();
                  }
                },
                async function (_callback) {
                  try {
                    order.batch_id = await DeliveryBatchOrder.find({
                      order_id: order.id
                    }).populate('batch_id');
                    _callback();
                  } catch (err) {
                    _callback(err);
                  }
                },
              ],
              function (err, result) {
                if (err) {
                  callback(err);
                } else {
                  callback();
                }
              }
            );
          },
          function (err, result) {
            if (err) {
              reject(err);
            } else {
              resolve({
                orders: orders,
                success: true,
              });
            }
          }
        );
      } catch (err) {
        reject(err);
      }
    });

    return response;
  },

  // [NOTE]: DEPRECATED SERVICE FUNCTION
  assembleOrdersListRefactored: async function (findCriteria) {
    let response = await new Promise(async (resolve, reject) => {
      orders_data = [];
      findCriteria["sort"] = "id desc";
      try {
        let count_criteria = _.omit(findCriteria, ["skip", "limit", "sort"]);
        let totalCount = await Order.count(count_criteria);
        let orders = await Order.find(findCriteria)
          // .populate("sales_agent_id")
          // .populate("customer_id")
          .populate("status_id")
          .populate("location_id");
          // .populate("delivery_boy_id")
          // .populate("customer_address_id")

        let userIds = [];
        const customerIds = [];
        const customerAddressIds = [];
        const couponIds = [];
        for (order of orders) {
          if (order.delivery_boy_id) {
            userIds.push(order.delivery_boy_id)
          }
          if (order.sales_agent_id) {
            userIds.push(order.sales_agent_id);
          }
          if (order.customer_address_id) {
            customerAddressIds.push(order.customer_address_id)
          }
          if (order.customer_id) {
            customerIds.push(order.customer_id);
          }
          if (order.coupon_id) {
            couponIds.push(order.coupon_id);
          }
        }
        const users = await userExtractionService.getAll({ id: userIds });
        const customers = await customerExtractionService.find(({ id: customerIds }));
        const customerAddresses = await customerAddressExtractionService.find({ id: customerAddressIds });
        const coupons = couponIds.length ? await CouponDao.find({ id: couponIds }) : [];

        async.eachSeries(
          orders,
          async function (order, callback) {
            order.customer_id = customers.find(customer => customer.id === order.customer_id) || order.customer_id;
            order.customer_address_id = customerAddresses.find(address => address.id === order.customer_address_id);
            order.delivery_boy_id = (users.find(obj => obj.id === order.delivery_boy_id) || order.delivery_boy_id);
            order.sales_agent_id = (users.find(obj => obj.id === order.sales_agent_id) || order.sales_agent_id);
            order.coupon_id = coupons.find(coupon => coupon.id === order.coupon_id) || null;
            /* NOTE: flow changed so will add sub_total and grand_total later
               order table will also have tax field i guess @khizer @sara */
            async.parallel(
              [
                async function (_callback) {
                  if (!order.customer_id) {
                    order.customer_id = emptyCustomerObj;
                  }
                  try {
                    let account_setting = await AccountSettings.find({
                      company_id: order.location_id.company_id,
                    });

                    order["account_setting"] = account_setting;

                    if (order.status_id.id === Constants.HyprOrderStates.IN_TRANSIT ||
                      order.status_id.id === Constants.HyprOrderStates.DELIVERED ||
                      order.status_id.id === Constants.HyprOrderStates.PARTIAL_DELIVERED) {
                      const orderWaiver = await OrderAmountAdjustment.findOne({
                        order_id: order.id,
                        context_name: 'WAIVER',
                        deleted_at: null
                      });
                      if (orderWaiver) {
                        const waiver = await Waiver.findOne({
                          id: orderWaiver.context_id
                        });
                        order.waiver = {
                          amount: parseFloat(waiver.amount.toFixed(2)),
                          reason_id: waiver.reason_id,
                          reason: Constants.WAIVER_REASONS.getWaiverReasonFromId(waiver.reason_id),
                        }
                      }
                    }
                    let history = await OrderStatusHistory.find({
                      order_id: order.id,
                    }).populate("status_id");
                    order.history = history;
                    let order_items = (await OrderItems.find({
                      order_id: order.id,
                    }).populate("product_id")).map((item) => {
                      item.price = parseFloat(item.price) + parseFloat(item.tax);
                      item.product_id.tax_inclusive = false;
                      return item;
                    });
                    let shopDetails = await customerRetailerShopExtractionService.findOne(
                      {
                        customer_id: order.customer_id.id,
                      }
                    );
                    order.shopDetails = shopDetails ? shopDetails : null;
                    order.items = order_items;
                    order.location_id.phone = order.location_id.phone
                      ? JSON.parse(order.location_id.phone)
                      : null;
                    _callback();
                  } catch (err) {
                    _callback(err);
                  }
                },

                async function (_callback) {
                  try {
                    let bu = await BusinessUnit.find({
                      id: order.location_id.business_unit_id,
                    });
                    if (bu) {
                      order.currency = bu[0].currency;
                      _callback();
                    } else {
                      _callback("NO BUSINNES UNIT FOUND");
                    }
                  } catch (err) {
                    _callback(err);
                  }
                },
              ],
              function (err, result) {
                if (err) {
                  callback(err);
                } else {
                  callback();
                }
              }
            );
          },
          function (err, result) {
            if (err) {
              resolve({
                message: "ERROR OCCURED WHILE PROCESSING ORDERS",
                trace: err,
                type: ErrorTypes.SERVER_ERROR,
                success: false,
              });
            } else {
              resolve({
                orders: orders,
                totalCount: totalCount.rows ? totalCount.rows[0] : null,
                success: true,
              });
            }
          }
        );
      } catch (err) {
        resolve({
          message: "ERROR OCCURED WHILE FETCHING ORDERS",
          trace: err,
          type: ErrorTypes.SERVER_ERROR,
          success: false,
        });
      }
    });

    return response;
  },

  sendCustomerNotification: async (
    customer_id,
    type,
    order,
    order_amount,
    delivery_code = null,
    currency=null,
    due_date=null,
  ) => {
    try {
      OrderService.customerSmsAndNotification(
        customer_id,
        type,
        order,
        order_amount,
        delivery_code,
        currency,
        due_date
      );
    } catch (err) {
      sails.log.warn(
        `OrderID: ${
          order.id
        } OrderService.sendCustomerNotification(), Error: ${JSON.stringify(
          err
        )}`
      );
    }
  },

  customerSmsAndNotification: async function (
    customer_id,
    type,
    order,
    order_amount,
    delivery_code = null,
    currency,
    due_date,
  ) {
    const logIdentifier = `OrderService.customerSmsAndNotification(), CustomerId: ${customer_id}`;
    try {
      const customer = await customerExtractionService.findOne({
        id: customer_id,
      });

      if (!customer) {
        return;
      }
      // TODO HOT FIX NEEDS TO BE REFACTORED
      const location = await findLocation(order["location_id"]);
      const BU = await businessUnitExtractionService.findOne({
        id: location.businessUnitId,
      });
      const countryCode = BU["country_code"];
      const PAKISTAN_COUNTRY_CODE = "PAK"; // TODO PLACE IN CONSTANTS
      let message_data = null;
      let orderTip = OrderService.getOrderTip(order);

      order_amount = (parseFloat(order_amount) + parseFloat(orderTip)).toFixed(
        2
      );
      
      if (type === Constants.HyprNotificationType.CUSTOMER_PLACE_ORDER) {
        message_data = {
          templateName: "customer_order_placed",
          args: {
            orderId: order.id,
            orderAmount: order_amount,
          },
        };
      } else if (
        type === Constants.HyprNotificationType.ORDER_PAYMENT_TYPE_UPDATED
      ) {
        message_data = {
          templateName: "customer_order_payment_type_updated",
          args: {
            orderId: order.id,
            orderAmount: order_amount,
          },
        };
      } else if (type === Constants.HyprNotificationType.PACKER_ASSIGNED) {
        message_data = {
          templateName: "customer_packer_assigned",
          args: {
            orderId: order.id,
          },
        };
      } else if (type === Constants.HyprNotificationType.ORDER_MODIFIED) {
        message_data = {
          templateName: "customer_order_cancelled",
          args: {
            orderId: order.id,
          },
        };
      } else if (type === Constants.HyprNotificationType.PACKER_CANCELLED) {
        message_data = {
          templateName: "customer_order_cancelled",
          args: {
            orderId: order.id,
          },
        };
      } else if (
        type === Constants.HyprNotificationType.PACKED &&
        order.is_updated
      ) {
        message_data = {
          templateName: "customer_order_modified",
          args: {
            orderId: order.id,
            orderAmount: order_amount,
          },
        };
      } else if (type === Constants.HyprNotificationType.PACKED) {
        message_data = {
          templateName: "customer_order_packed",
          args: {
            orderId: order.id,
          },
        };
      } else if (type === Constants.HyprNotificationType.DELIVERED) {
        message_data = {
          templateName: "customer_order_delivered",
          args: {
            orderId: order.id,
          },
        };
      } 
      else if (type === Constants.HyprNotificationType.DELIVERY_ASSIGNED) {
        message_data = {
          templateName: "customer_order_delivery_assigned",
          args: {
            orderId: order.id,
            orderAmount: order_amount,
          },
        };
      } else if (type === Constants.HyprNotificationType.DELIVERY_REJECTED) {
        message_data = {
          templateName: "customer_delivery_rejected",
          args: {
            orderId: order.id,
          },
        };
      } else if (
        type === Constants.HyprNotificationType.REJECTED_ON_PAYMENT_FAILURE
      ) {
        message_data = {
          templateName: "order_rejected_on_payment_failure",
          args: {
            orderId: order.id,
          },
        };
      }
      // }

      type === Constants.HyprNotificationType.CUSTOMER_PLACE_ORDER &&
      countryCode != PAKISTAN_COUNTRY_CODE
        ? await Notifications.sendMessage({
            customerId: customer_id,
            templateName: "customer_order_placed_sms",
            args: message_data.args,
            sender: "monolith",
          })
        : sails.log.warn(
            `${logIdentifier}: OrderID: ${order.id} Not sending notification to Pakistan`
          );

      if (message_data) {
        await Notifications.sendMessage({
          customerId: customer_id,
          templateName: message_data.templateName,
          args: message_data.args,
          sender: "monolith",
        });
      } else {
      }
    } catch (e) {
      throw e;
    }
  },
  // [NOTE]: DEPRECATED SERVICE FUNCTION
  assignOrderToPacker: async function (params, res) {
    let response = await new Promise(async (resolve) => {
      try {
        let order = await Order.findOne({ id: params.order_id });
        if (order) {
          if (order.status_id == Constants.HyprOrderStates.RESERVED) {
            try {
              let updated_order = await Order.updateAndCreateHistory(
                { id: params.order_id },
                {
                  status_id: Constants.HyprOrderStates.PACKER_ASSIGNED,
                  packer_id: params.packer_id,
                }
              );

              let order = updated_order[0];
              if (order.customer_id) {
                var amount = 0.0;
                amount = order.total_price;
                OrderService.sendCustomerNotification(
                  order.customer_id,
                  Constants.HyprNotificationType.PACKER_ASSIGNED,
                  order,
                  amount
                );
              }
              NotificationService.sendPackerNotification(
                "Order " + order.id + " assigned to you",
                [params.user.player_id],
                {
                  order_id: order.id,
                  type: Constants.HyprNotificationType.PACKER_ASSIGNED,
                },
                order.location_id
              );

              params.status = "Packer Assigned";
              params.event_name = Constants.EVENTS.Order_Assigned;
              params.order_id = order.uuid;
              await OrderService.checkForEvents(res, params);
              resolve({ success: true, message: "ORDER ASSIGNED" });
            } catch (err) {
              resolve({
                message: "CANNOT ASSIGN PACKER",
                trace: err,
                type: ErrorTypes.SERVER_ERROR,
                success: false,
              });
            }
          } else {
            resolve({
              message: "ORDER ALREADY ASSIGNED",
              trace: "assignOrderToPacker ORDER ALREADY ASSIGNED",
              type: ErrorTypes.BAD_REQUEST,
              success: false,
            });
          }
        } else {
          resolve({
            message: "ORDER NOT FOUND",
            trace: "ORDER NOT FOUND",
            type: ErrorTypes.BAD_REQUEST,
            success: false,
          });
        }
      } catch (err) {
        resolve({
          message: "ERROR OCCURED WHILE FETCHING ORDER",
          trace: err,
          type: ErrorTypes.SERVER_ERROR,
          success: false,
        });
      }
    });

    return response;
  },

  unassignDeliveryBoy: async function (params, res) {
    let response = await new Promise(async (resolve) => {
      console.log(
        "UNASSIGNING ORDER " +
        params.order_id +
        "  FROM " +
        params.delivery_boy_id
      );
      try {
        let order = await Order.findOne({ id: params.order_id }).populate(
          "customer_id"
        );
        if (order) {
          if (order.status_id == Constants.HyprOrderStates.IN_TRANSIT) {
            let updatedOrder = await Order.updateAndCreateHistory(
              { id: params.order_id },
              {
                status_id: Constants.HyprOrderStates.PACKED,
                delivery_boy_id: null,
              }
            );
          }
          resolve({
            success: true,
            message: "DELIVERY BOY UNASSIGNED",
          });
        } else {
          resolve({
            success: false,
            trace: "ORDER NOT FOUND",
            type: ErrorTypes.SERVER_ERROR,
            message: "ORDER NOT FOUND",
          });
        }
      } catch (err) {
        resolve({
          success: false,
          trace: err,
          type: ErrorTypes.SERVER_ERROR,
          message: "ERROR OCCURED",
        });
      }
    });
    return response;
  },

  assignOrderToDeliveryBoy: async function (params, res) {
    try {
      let order = await Order.findOne({ id: params.order_id }).populate(
        "customer_id"
      );
      if (order) {
        if (
          order.status_id != Constants.HyprOrderStates.DELIVERED &&
          order.status_id != Constants.HyprOrderStates.PARTIAL_DELIVERED &&
          order.status_id != Constants.HyprOrderStates.CANCELLED
        ) {
          if (
            order.status_id == Constants.HyprOrderStates.PACKED ||
            order.status_id == Constants.HyprOrderStates.ON_HOLD
          ) {
            try {
              await Order.updateAndCreateHistory(
                { id: params.order_id },
                {
                  status_id: Constants.HyprOrderStates.IN_TRANSIT,
                  delivery_boy_id: params.delivery_boy_id,
                  delivery_priority: params.delivery_priority,
                }
              );
              order.service_charge = GeneralHelper.getFlatOrPercent(
                order.service_charge_type,
                order.service_charge_value,
                order.total_price + (order.tax ? parseFloat(order.tax) : 0)
              );
              order.delivery_charge = GeneralHelper.getFlatOrPercent(
                order.delivery_charge_type,
                order.delivery_charge_value,
                order.total_price + (order.tax ? parseFloat(order.tax) : 0)
              );
              order.total_price =
                parseFloat(order.total_price) +
                order.service_charge +
                order.delivery_charge +
                parseFloat(order.tax);
              order["grand_total"] = order.total_price
                ? order.total_price
                : 0.0;
              OrderService.sendCustomerNotification(
                order.customer_id.id,
                Constants.HyprNotificationType.DELIVERY_ASSIGNED,
                order,
                order["grand_total"]
              );
              return ({ success: true });
            } catch (err) {
              return ({
                success: false,
                trace: err,
                message: "CANNOT ASSIGN DELIVERY BOY",
              });
            }
          } else {
            return ({
              success: false,
              trace: "OrderService assignOrderToDeliveryBoy ORDER ALREADY ASSIGNED",
              message: "ORDER ALREADY ASSIGNED",
            });
          }
        } else {
          if (!order.delivery_boy_id) {
            return ({
              success: false,
              trace: "CANNOT MOVE ORDER TO IN TRANSIT. NO DELIVERY AGENT WAS ASSIGNED",
              message: "CANNOT MOVE ORDER TO IN TRANSIT. NO DELIVERY AGENT WAS ASSIGNED",
            });
          }
          const order_items = await OrderItems.find({
            order_id: order.id,
          }).populate("product_id");
          if (order.status_id === Constants.HyprOrderStates.DELIVERED ||
            Constants.HyprOrderStates.PARTIAL_DELIVERED) {
            const batch = await DeliveryBatchOrder.findOne({
              order_id: order.id,
            });
            let batchItems = await DeliveryBatch.findOne({
              id: batch.batch_id
            });
            batchItems = JSON.parse(batchItems.products);
            for (const item of order_items) {
              try {
                const index = batchItems.findIndex(batchItem => batchItem.id === item.product_id.id);
                batchItems[index].current_quantity = item.quantity;
              } catch (err) {
                return ({
                  success: false,
                  trace: err,
                  message: "ERROR OCCURED WHILE UPDATING BATCH ITEMS",
                });
              }
            }
            await DeliveryBatch.updateOne({
              id: batch.batch_id
            }).set({
              products: JSON.stringify(batchItems),
              status_id: 2
            });
          }
          if (order.status_id === Constants.HyprOrderStates.CANCELLED ||
            Constants.HyprOrderStates.PARTIAL_DELIVERED) {
            for (const item of order_items) {
              try {
                await Product.update(
                  {
                    id: item.product_id.id,
                    location_id: order.location_id,
                  },
                  {
                    stock_quantity:
                      item.product_id.stock_quantity - parseInt(item.quantity),
                  }
                );
              } catch (err) {
                return ({
                  success: false,
                  trace: err,
                  message: "ERROR OCCURED WHILE UPDATING INVENTORY",
                });
              }
            }
          }
          Order.updateAndCreateHistory(
            { id: params.order_id },
            {
              status_id: Constants.HyprOrderStates.IN_TRANSIT,
            }
          );
          return ({
            success: true
          });
        }
      } else {
        return ({
          success: false,
          trace: "ORDER NOT FOUND",
          message: "ORDER NOT FOUND",
        });
      }
    } catch (err) {
      return ({
        success: false,
        trace: err,
        message: "ERROR OCCURED",
      });
    }
  },

  // [NOTE]: DEPRECATED SERVICE FUNCTION
  // updateInventory: async function (item, location_id) {
  //   let response = await new Promise(async (resolve) => {
  //     if (item && item.original_quantity != item.quantity) {
  //       try {
  //         sails.log(`DEBUG: Product Quantity Reduction to Zero: ProductId ${item.product_id}, OrderId: ${item.order_id}, OrderItemId: ${item.id}`)
  //         let inventory_response = await Product.update(
  //           {
  //             id: item.product_id,
  //             location_id: location_id,
  //           },
  //           {
  //             stock_quantity: 0.0,
  //           }
  //         );
  //         resolve({
  //           success: true,
  //           item: inventory_response,
  //         });
  //       } catch (err) {
  //         resolve({
  //           message: "UNABLE TO UPDATE INVENTORY",
  //           success: false,
  //           trace: err,
  //           type: ErrorTypes.SERVER_ERROR,
  //         });
  //       }
  //     } else {
  //       resolve({
  //         message: "ORIGINAL AND PACKED QUANTITY MATCHED",
  //         success: true,
  //         trace: "ORIGINAL AND PACKED QUANTITY MATCHED",
  //         type: ErrorTypes.SERVER_ERROR,
  //       });
  //     }
  //   });

  //   return response;
  // },

  // [NOTE]: DEPRECATED SERVICE FUNCTION
  updateOrder: async function (params) {
    let response = await new Promise(async (resolve) => {
      try {
        let updateObj = {
          total_price: params.total_price,
          tax: params.tax,
          is_updated: true,
        };
        if (params.coupon_discount)
          updateObj["coupon_discount"] = params.coupon_discount;
        //NOTE: updateAndCreateHistory takes order items from db to put in history obj. So item update should be done after order update, send old items as thrid param otherwise
        let order_response = await Order.updateAndCreateHistory(
          { id: params.order_id },
          updateObj
        );
        params.order_items.forEach(async (category) => {
          category.items.forEach(async (item) => {
            if (item && item.hasOwnProperty("id") && item.id) {
              let updateObj = { quantity: item.quantity };
              if (item.removed) {
                (updateObj["removed"] = true),
                  (updateObj["deleted_at"] = new Date());
              }
              let result = await OrderItems.update({ id: item.id }, updateObj);
              resolve({
                success: true,
              });
            }
          });
        });
      } catch (err) {
        resolve({
          success: false,
          trace: err,
          type: ErrorTypes.SERVER_ERROR,
          message: "ERROR OCCURED WHILE UPDATING ORDER",
        });
      }
    });

    return response;
  },

  // [NOTE]: DEPRECATED SERVICE FUNCTION
  sendOrderStatusEvents: function (url, token, order_id, status) {
    return new Promise((resolve, reject) => {
      requestify
        .request(url, {
          method: "POST",
          body: { order_no: order_id, status: status },
          headers: {
            "X-Token": token,
            "Content-Type": "application/json; charset=utf-8",
          },
        })
        .then(function (response) {
          // parsing to get response status
          var response = JSON.parse(response.body);
          if (response.status) {
            resolve();
          } else {
            reject();
          }
        });
    });
  },

  // [NOTE]: DEPRECATED SERVICE FUNCTION
  checkForEvents: async function (res, params) {
    // var event_name = Constants.EVENTS.Order_Assigned;
    return new Promise(async (resolve, reject) => {
      try {
        if (
          params &&
          params.hasOwnProperty("order_id") &&
          params.hasOwnProperty("status") &&
          params.hasOwnProperty("event_name")
        ) {
          let location = null;
          if (
            [
              Constants.HyprRoles.ADMIN,
              Constants.HyprRoles.COMPANY_OWNER,
              Constants.HyprRoles.CARE,
              Constants.HyprRoles.GROWTH_SALES,
              Constants.HyprRoles.LEADS,
              Constants.HyprRoles.COMMERCIAL,
              Constants.HyprRoles.LOGISTICS,
              Constants.HyprRoles.BU_MANAGER,
              Constants.HyprRoles.MONTREAL_INTERN,
            ].includes(
              typeof res.locals.userData.role.id == "string"
                ? parseInt(res.locals.userData.role.id)
                : res.locals.userData.role.id
            )
          ) {
            location = params.location_id;
          } else if (res.locals.userData.accessHierarchy.locations.length > 0) {
            location = res.locals.userData.accessHierarchy.locations[0];
          }
          if (location) {
            try {
              let loc = await Location.findOne({ id: location }).populate(
                "company_id"
              );
              let companyDetails = await accountSettingsExtractionService.findOne({
                where: { company_id: loc.company_id.id },
              });
              if (companyDetails.app_type == Constants.APP_TYPES.CLIENT) {
                if (companyDetails.send_events) {
                  try {
                    let eventType = await EventTypes.findOne({
                      name: params.event_name,
                    });

                    try {
                      let foundEvent = await AccountEvents.findOne({
                        company_id: companyDetails.id,
                        event_type: eventType.id,
                      });
                      if (!foundEvent) {
                        OrderService.sendOrderStatusEvents(
                          foundEvent.url,
                          foundEvent.token,
                          params.order_id,
                          params.status
                        );
                      } else {
                        sails.log(
                          "EVENT NOT INTEGRATED AGAINST THIS ACCOUNT"
                        );
                      }
                    } catch (err) {
                      sails.log("EVENT FOUND ERROR", err);
                    }
                  } catch (err) {
                    sails.log("EVENT TYPE ERROR", err);
                  }
                } else {
                  sails.log(
                    "ACCOUNT " +
                    loc.company_id.name +
                    " NOT CONFIGURED FOR EVENTS!"
                  );
                  resolve();
                }
              } else {
                if (
                  companyDetails.shipment_method ==
                  Constants.SHIPMENT_METHODS.SELF_DELIVERY &&
                  params.event_name == Constants.EVENTS.Order_Packed
                ) {
                  let order = await Order.findOne({ uuid: params.order_id });
                  if (order.payment_reference && order.payment_type == "CC") {
                    try {
                      await OrderService.runStripePaymentFlow(params);
                      let customer = await customerExtractionService.findOne({
                        id: order.customer_id,
                      });
                      let accountSettings = await accountSettingsExtractionService.findOne({
                        company_id: customer.company_id,
                      });
                      if (!customer.store_card_info) {
                        StripeService.removeCard(
                          customer.customer_stripe_id,
                          order.card_reference,
                          accountSettings.stripe_secret
                        );
                      }
                    } catch (err) {
                      let message = err;
                      if (err && err == "E_CHARGE_FAILED") {
                        message = "Payment Charge Failed!";
                        let orderUpdated = await Order.update(
                          { id: order.id },
                          {
                            status_id: Constants.HyprOrderStates.REJECTED,
                          }
                        );
                        OrderService.sendCustomerNotification(
                          order.customer_id,
                          Constants.HyprNotificationType
                            .REJECTED_ON_PAYMENT_FAILURE,
                          order,
                          0
                        );
                      }
                      return reject(message);
                    }
                  }
                  OrderService.sendDeliveryNotification(loc.id, order.id);
                  resolve();
                }
                resolve();
              }
            } catch (err) {
              sails.log("LOCATION ERROR", err);
            }
          } else {
            sails.log("NO LOCATION REF TO CHECK EVENT CONFIG");
          }
        } else {
          sails.log("EMPTY PARAMS FOR EVENT CHECK");
        }
      } catch (err) {
        sails.log.error(err);
      }
    });
  },

  // [NOTE]: DEPRECATED SERVICE FUNCTION
  checkForAppType: async location_id => {
    // checking for app type
    let response = await new Promise(async (resolve, reject) => {
      try {
        const location = await locationExtractionService.findOne({ id: location_id });
        if (location) {
          const company = await companiesExtractionService.findOne({
            id: location.company_id,
          });
          company.settings = accountSettingsExtractionService.findOne({ company_id: location.company_id });
          if (company.settings.app_type == Constants.APP_TYPES.CLIENT) {
            resolve({
              success: false,
            });
          } else {
            resolve({
              success: true,
            });
          }
        } else {
          resolve({
            success: true,
          });
        }
      } catch (err) {
        reject(err);
      }
    });

    return response;
  },

  // [NOTE]: DEPRECATED SERVICE FUNCTION
  buildCriteria: async (params, findCriteria) => {
    let response = await new Promise(async (resolve) => {
      findCriteria["or"] = [];
      try {
        const customers = await customerExtractionService.find({
          searchOnAttributes: ["name", "phone"],
          searchValue: params.search,
        });
        var customerIds = [];
        for (var customer of customers) {
          customerIds.push(customer.id);
        }
        if (customerIds.length > 0) {
          findCriteria["or"].push({ customer_id: customerIds });
        }
        // let users = await User.find({
        //   name: { contains: params.search },
        // });
        const users = await userExtractionService.getAll({ name: params.search });

        var userIds = [];
        for (var user of users) {
          userIds.push(user.id);
        }
        if (userIds.length > 0) {
          findCriteria["or"].push({ sales_agent_id: userIds });
        }

        let locations = await locationExtractionService.find({
          searchOnAttributes: ["name"],
          searchValue: params.search,
        });

        var locationIds = [];
        locations.forEach(function (location) {
          locationIds.push(location.id);
        });
        findCriteria["or"].push({ location_id: locationIds });

        // CONTEXT: This was the slowest query according to RDS performance insights
        // We added temporary tables to make the query faster
        // Sails/Waterline does not allow multiple queries to run in same session
        // As this opens us up for SQL injections
        // We added a store procedure to circumvent this limitation
        //
        // Stored procedure path: hypr_backend/stored_procedures/getOrders.sql
        //
        // Any changes in this query needs to reviewed by DBA before deployment
        const query = "CALL GetOrders ($1)";

        let result = await sails.sendNativeQuery(query, [params.search]);
        let skuOrders = result.rows[0];
        if (skuOrders.length > 0) {
          var orderIds = [];
          for (var id of skuOrders) {
            orderIds.push(id.id);
          }
          findCriteria["or"].push({ id: orderIds });
        }

        resolve({
          success: true,
          findCriteria: findCriteria,
        });
      } catch (err) {
        resolve({
          message: "ERROR WHILE BUILDING CRITERIA",
          trace: err,
          type: ErrorTypes.SERVER_ERROR,
          success: false,
        });
      }
    });
    return response;
  },

  // [NOTE]: DEPRECATED SERVICE FUNCTION
  getOrderById: async function (orderId) {
    let response = await new Promise(async (resolve, reject) => {
      Order.findOne({ id: orderId }).exec((err, order) => {
        if (err) {
          reject(err);
        } else {
          let orderResponse = order ? order : {};
          resolve(orderResponse);
        }
      });
    });
    return response;
  },

  // [NOTE]: DEPRECATED SERVICE FUNCTION
  getOrders: async function (criteria) {
    return new Promise(async (resolve, reject) => {
      if (!_.isEmpty(criteria)) {
        Order.find(criteria).exec((err, orders) => {
          if (!err) {
            resolve(orders);
          } else {
            reject(err);
          }
        });
      }
      else {
        resolve({});
      }
    });
  },

  getOrderItems: async function (criteria) {
    return new Promise(async (resolve, reject) => {
      try {
        let orderItems = (await OrderItems.find(criteria)).map(item => {

          item.price = parseFloat(item.price) + parseFloat(item.tax);

          if (item.volume_based_price > 0) {
            item.basePrice = item.price; // actual price/tier one price
            item.price = parseFloat(item.volume_based_price) + parseFloat(item.volume_based_price_tax); // volume based price
          }
         
          return item;
        });
        resolve(orderItems);
      }
      catch (err) {
        reject(err);
      }
    });
  },
  // [NOTE]: DEPRECATED SERVICE FUNCTION
  getOrderTip: function (order) {
    let tip = 0;
    if (order.tip_type) {
      if (!order.tip_type || order.tip_type === Constants.TipTypes.FLAT)
        tip = parseFloat(order.tip_amount).toFixed(2);
      else
        tip = parseFloat(order.grand_total * (order.tip_amount / 100)).toFixed(
          2
        );
    }
    return tip;
  },

  // [NOTE]: DEPRECATED SERVICE FUNCTION
  runStripePaymentFlow: async function (params) {
    let response = await new Promise(async (resolve, reject) => {
      try {
        let order = await OrderService.getOrderById(params.order_db_Id);
        order.service_charge = GeneralHelper.getFlatOrPercent(
          order.service_charge_type,
          order.service_charge_value,
          order.total_price + parseFloat(order.tax)
        );
        order.delivery_charge = GeneralHelper.getFlatOrPercent(
          order.delivery_charge_type,
          order.delivery_charge_value,
          order.total_price + parseFloat(order.tax)
        );
        order["grand_total"] = order.total_price ? order.total_price : 0.0;
        order.grand_total =
          parseFloat(order.total_price) +
          order.service_charge +
          order.delivery_charge +
          parseFloat(order.tax) -
          parseFloat(order.coupon_discount || 0.0);
        let orderTip = OrderService.getOrderTip(order);
        let paymentResponse;

        let orderTotal = parseFloat(order.grand_total) + parseFloat(orderTip);
        // orderTotal = Math.ceil(orderTotal);

        if (!order.is_updated && params.totalAmount != 0)
          try {
            paymentResponse = await StripeService.confirmPayment(
              order.location_id,
              params.payment_reference
            );
          } catch (err) {
            return reject("E_CHARGE_FAILED");
          }
        else {
          let paymentCard = await StripeService.cancelPayment(
            order.location_id,
            params.payment_reference
          );
          try {
            paymentResponse = await StripeService.createPayment(
              order.location_id,
              paymentCard.customerId,
              parseFloat((parseFloat(orderTotal.toFixed(2)) * 100).toFixed(2)), //  Because Stripe charge in smallest unit, so if 10$ = 1000cent
              order.customer_id,
              true
            );
          } catch (err) {
            return reject("E_CHARGE_FAILED");
          }
        }
        try {
          let updatedOrder = await Order.updateAndCreateHistory(
            { id: params.order_db_Id },
            {
              payment_reference: paymentResponse.confirmPayment,
              payment_reference: paymentResponse.chargeId,
              cash_received: orderTotal * 100,
            }
          );
          resolve(updatedOrder);
        } catch (err) {
          reject(err);
        }
      } catch (err) {
        reject(err);
      }
    });

    return response;
  },

  // [NOTE]: DEPRECATED SERVICE FUNCTION
  refundOrder: async (orderId, location_id) => {
    let response = await new Promise(async (resolve, reject) => {
      try {
        if (!orderId) {
          reject("ORDER ID REQUIRED");
        }
        let order = await OrderService.getOrderById(orderId);
        if (
          order.status_id === Constants.HyprOrderStates.REJECTED &&
          !order.refund_id
        ) {
          try {
            let refundResponse = await StripeService.refundPayment(
              location_id,
              order.payment_reference
            );

            Order.updateAndCreateHistory(
              { id: order.id },
              { refund_id: refundResponse.refundId }
            ).exec((err, updated) => {
              if (err) {
                reject("ORDER NOT UPDATED");
              } else {
                resolve();
              }
            });
          } catch (err) {
            reject(err);
          }
        } else {
          reject(
            "CAN NOT REJECT FROM STATE " +
            Constants.HyprOrderStates.getKeyFromValue(order.status_id)
          );
        }
      } catch (err) {
        reject(err);
      }
    });

    return response;
  },
  // [NOTE]: DEPRECATED SERVICE FUNCTION
  rejectOrder: async (orderId) => {
    let response = await new Promise(async (resolve, reject) => {
      try {
        if (!orderId) {
          reject("ORDER ID REQUIRED");
        }
        let order = await OrderService.getOrderById(orderId);
        if (order.status_id === Constants.HyprOrderStates.IN_TRANSIT) {
          Order.updateAndCreateHistory(
            { id: order.id },
            { status_id: Constants.HyprOrderStates.REJECTED }
          ).exec((err, updated) => {
            if (err) {
              reject("UNABLE TO UPDATE");
            } else {
              resolve();
            }
          });
        } else {
          reject(
            "CAN NOT REJECT FROM STATE" +
            Constants.HyprOrderStates.getKeyFromValue(order.status_id)
          );
        }
      } catch (err) {
        reject(err);
      }
    });

    return response;
  },

  // [NOTE]: DEPRECATED SERVICE FUNCTION
  getOrdersCount: async function (params, user) {
    let response = await new Promise(async (resolve, reject) => {
      var orderStatuses = [];
      var findCriteria = {};
      if (!GeneralHelper.emptyOrAllParam(params.orderStatuses, true)) {
        orderStatuses = JSON.parse(params.orderStatuses);
      }
      async.eachSeries(
        orderStatuses,
        async (status, callback) => {
          findCriteria = {};
          findCriteria = {
            status_id: status.id,
            location_id: user.accessHierarchy.locations[0],
          };
          if (status.checkUser) {
            if (
              params.hasOwnProperty("fromPackerApp") &&
              params.fromPackerApp
            ) {
              findCriteria.packer_id = user.id;
            } else if (
              params.hasOwnProperty("fromDeliveryApp") &&
              params.fromDeliveryApp
            ) {
              findCriteria.delivery_boy_id = user.id;
            }
          }
          try {
            let response = await OrderService.getStatusSpecificOrderCount(
              findCriteria
            );
            status.count = response && response > 0 ? response : 0;
            callback();
          } catch (err) {
            callback(err);
          }
        },
        function (err, result) {
          if (err) reject(err);
          resolve({ orderCount: orderStatuses });
        }
      );
    });
    return response;
  },
  
  // [NOTE]: DEPRECATED SERVICE FUNCTION
  getStatusSpecificOrderCount: async function (findCriteria) {
    let response = await new Promise(async (resolve, reject) => {
      try {
        let num = await Order.count(findCriteria);
        resolve(num);
      } catch (err) {
        reject(err);
      }
    });

    return response;
  },

  assignAndPackBulkOrders: async function (order, userId, roleId) {
    let response = new Promise(async (resolve, reject) => {
      let paramsToUpdate = {
        packing_time: new Date(),
        status_id: Constants.HyprOrderStates.PACKED,
      };
      try {
        if (order.status_id == Constants.HyprOrderStates.RESERVED ||
          order.status_id == Constants.HyprOrderStates.ON_HOLD) {
          paramsToUpdate.packer_id = userId;
        }
        //NOTE: updateAndCreateHistory takes order items from db to put in history obj. So item update should be done after order update, send old items as thrid param otherwise
        let orderUpdated = await Order.updateAndCreateHistory(
          { id: order.id },
          paramsToUpdate,
          userId,
					Constants.HyprRoles.getKeyFromValue(roleId)
        );
        async.each(
          order.order_items,
          async function (item, callback) {
            try {
              let updatedItem = await OrderItems.update(
                { id: item.id },
                { packed_quantity: item.quantity }
              );
              // let updatedInventory = await OrderService.updateInventory(
              //   updatedItem[0],
              //   order.location_id
              // );
              callback();
            } catch (err) {
              callback(err);
            }
          },
          function (err, result) {
            if (err) reject(err);
            else resolve();
          }
        );
      } catch (err) {
        reject(err);
      }
    });

    return response;
  },

  // [NOTE]: DEPRECATED SERVICE FUNCTION
  sendOrderUpdateEmail: async function (code) {
    return new Promise(async (resolve, reject) => {
      var startDate = new Date();
      // startDate.setDate(startDate.getDate() - 23);
      startDate.setHours(0, 0, 0, 0);
      var endDate = new Date();
      endDate.setHours(23, 59, 59, 59);
      let recepient = [];
      let company = await Companies.findOne({ code: code });
      recepient = JSON.parse(company.emails);
      let locations = await Location.find({
        company_id: company.id,
        disabled: false,
      }).populate("orders", {
        where: {
          created_at: { "<": endDate, ">": startDate },
          status_id: { "!=": Constants.HyprOrderStates.SALE_ORDER },
        },
      });

      var orderInfoArray = [];
      let locationIds = [];

      let orderLocationStr = "";

      async.eachSeries(
        locations,
        async function (loc, callback) {
          try {
            var data = {};

            locationIds.push(loc.id);

            let query = "SELECT COUNT(*) as dailyOrders";
            query +=
              ",COUNT(case status_id when " +
              Constants.HyprOrderStates.DELIVERED +
              " then 1 else null end) completedOrders";
            query +=
              ",COUNT(case status_id when " +
              Constants.HyprOrderStates.PACKER_ASSIGNED +
              " then 1 else null end) pendingOrders";
            query +=
              ",COUNT(case status_id when " +
              Constants.HyprOrderStates.REJECTED +
              " then 1 else null end) rejectedOrders";
            query +=
              ",COUNT(case status_id when " +
              Constants.HyprOrderStates.PARTIAL_DELIVERED +
              " then 1 else null end) partialDeliverOrders";
            query +=
              ",SUM(CASE When status_id in (" +
              Constants.HyprOrderStates.DELIVERED +
              "," +
              Constants.HyprOrderStates.PARTIAL_DELIVERED +
              ") Then total_price Else 0 End) actualSales";
            query +=
              ",SUM(CASE When status_id in (" +
              Constants.HyprOrderStates.CANCELLED +
              "," +
              Constants.HyprOrderStates.PACKER_CANCELLED +
              ") Then total_price Else 0 End) cancelledSales";
            query +=
              ",SUM(CASE When status_id in (" +
              Constants.HyprOrderStates.IN_TRANSIT +
              ") Then total_price Else 0 End) inTransitSales";
            query +=
              ",SUM(CASE When status_id in (" +
              Constants.HyprOrderStates.PACKED +
              ") Then total_price Else 0 End) packedSales";
            query +=
              ",SUM(CASE When status_id in (" +
              Constants.HyprOrderStates.RESERVED +
              "," +
              Constants.HyprOrderStates.PACKER_ASSIGNED +
              ") Then total_price Else 0 End) notPackedSales";
            query +=
              ",SUM(CASE When status_id in (" +
              Constants.HyprOrderStates.REJECTED +
              "," +
              Constants.HyprOrderStates.RETURNED +
              ") Then total_price Else 0 End) returnedSales";
            query += ",avg(total_price) averageOrderPrice";
            query += ",COUNT(DISTINCT customer_id) as totalCustomers";
            query +=
              " FROM `orders` o WHERE  o.disabled=false AND o.created_at > $1 AND o.created_at < $2 AND o.location_id=$3 AND o.status_id not in (1) ";
            let result = await sails.sendNativeQuery(query, [
              startDate,
              endDate,
              loc.id,
            ]);

            let Orders = result.rows;
            if (Orders && Orders.length > 0) {
              data["dailyOrders"] = Orders[0].dailyOrders || 0;
              data["completedOrders"] = Orders[0].completedOrders || 0;
              data["pendingOrders"] = Orders[0].pendingOrders || 0;
              data["rejectedOrders"] = Orders[0].rejectedOrders || 0;
              data["partialDeliverOrders"] =
                Orders[0].partialDeliverOrders || 0;
              data["actualSales"] = Orders[0].actualSales || 0;
              data["actualSales"] = data["actualSales"].toFixed(2);
              data["cancelledSales"] = Orders[0].cancelledSales || 0;
              data["cancelledSales"] = data["cancelledSales"].toFixed(2);
              data["inTransitSales"] = Orders[0].inTransitSales || 0;
              data["inTransitSales"] = data["inTransitSales"].toFixed(2);
              data["packedSales"] = Orders[0].packedSales || 0;
              data["packedSales"] = data["packedSales"].toFixed(2);
              data["notPackedSales"] = Orders[0].notPackedSales || 0;
              data["notPackedSales"] = data["notPackedSales"].toFixed(2);
              data["returnedSales"] = Orders[0].returnedSales || 0;
              data["returnedSales"] = data["returnedSales"].toFixed(2);
              // data["totalSales"] = Orders[0].totalSales || 0;
              // data["totalSales"] = data["totalSales"].toFixed(2);
              data["averageOrderPrice"] = Orders[0].averageOrderPrice || 0;
              data["averageOrderPrice"] = data["averageOrderPrice"].toFixed(2);
              data["totalCustomers"] = Orders[0].totalCustomers || 0;
            } else {
              data["dailyOrders"] = 0;
              data["completedOrders"] = 0;
              data["pendingOrders"] = 0;
              data["rejectedOrders"] = 0;
              data["partialDeliverOrders"] = 0;
              data["actualSales"] = "0.00";
              data["cancelledSales"] = "0.00";
              data["inTransitSales"] = "0.00";
              data["packedSales"] = "0.00";
              data["notPackedSales"] = "0.00";
              // data["totalSales"] = "0.00";
              data.averageOrderPrice = "0.00";
              data.totalCustomers = 0;
            }

            orderInfoArray.push({
              locationName: loc.name,
              ordersLength: loc.orders.length,

              data: data,
            });
            callback();
          } catch (err) {
            callback(err);
          }
        },

        async function (err, result) {
          if (err) sails.log.error("ERROR ", err);
          orderLocationStr = " and o.location_id IN (" + locationIds + ")";
          let allLocData = await DashboardService.dashboardData(
            "",
            startDate,
            endDate,
            "",
            orderLocationStr,
            ""
          );

          orderInfo = {
            companyName: company.name,
            allLocData: allLocData,
            items: orderInfoArray.filter((order) => order.ordersLength !== 0),
          };
          ejs.renderFile(
            __dirname + "/../templates/order_email_update.ejs",
            orderInfo,
            {},
            function (err, str) {
              if (err) {
                sails.log.error(err);
              } else {
                // MailerService.sendMailThroughAmazon({
                //   email: recepient,
                //   htmlpart: str,
                //   subject: "Daily Orders Report - " + new Date(),
                //   destination: "operations@hypr.pk",
                // });
              }
            }
          );
          resolve(orderInfo);
        }
      );
    });
  },
};
