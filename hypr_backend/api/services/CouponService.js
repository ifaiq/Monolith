const { constant } = require("async");
const AWSService = require("./AWSService");
const AWS = AWSService.getAWSConfig();
const csv = require("fast-csv");

const couponUsageHistoryDao = require("../modules/v1/Coupon/CouponUsageHistoryDao");
const customerExtractionService = require('../user_service_extraction/customerService');

function getFormattedDate(date) {
  var time = new Date(date);
  var curr_date = time.getDate();
  var curr_month = time.getMonth();
  curr_month++;
  var curr_year = time.getFullYear();
  return curr_date + "/" + curr_month + "/" + curr_year;
}

function getSqlDateObject(date) {
  let start_date = new Date(date);
  let full_year = start_date.getFullYear();
  /* NOTE: added brackets back to avoid any issue */
  let full_month = start_date.getMonth() + 1 + "";
  if (full_month.length == 1) {
    full_month = "0" + (start_date.getMonth() + 1);
  }
  let full_day = start_date.getDate() + "";
  if (full_day.length == 1) {
    full_day = "0" + start_date.getDate();
  }
  return full_year + "-" + full_month + "-" + full_day;
}

function isCouponChanged(old_coupon, new_coupon) {
  if (
    old_coupon.name != new_coupon.name ||
    old_coupon.discount_type != new_coupon.discount_type ||
    old_coupon.discount_value != new_coupon.discount_value ||
    getFormattedDate(old_coupon.start_date) !=
    getFormattedDate(new_coupon.start_date) ||
    getFormattedDate(old_coupon.end_date) !=
    getFormattedDate(new_coupon.end_date)
  ) {
    return true;
  }
  return false;
}

verifyCouponForCustomerData = async function verifyCouponForCustomer(params) {
  let response = await new Promise(async (resolve, reject) => {
    try {
      let today = new Date();
      let todayDateString = getSqlDateObject(today);
      let query =
        "SELECT distinct coupons.id, coupons.name, coupons.discount_value, coupons.min_coupon_limit, coupons.max_discount_value, coupons.max_usage_per_customer, coupons.disabled, coupons.discount_type, " +
        "CASE WHEN coupons.end_date < '" +
        todayDateString +
        "' THEN 1 ELSE 0 END as 'expired', " +
        "CASE WHEN (select count(*) from coupon_usage_history where coupon_usage_history.customer_id = $4 " +
        "and coupon_usage_history.coupon_id = coupons.id and coupon_usage_history.date >= coupons.start_date and coupon_usage_history.date <= coupons.end_date ) >= coupons.max_usage_per_customer " +
        "THEN 1 ELSE 0 END as 'already_used', CASE WHEN coupons.coupon_customer_option_id = " +
        Constants.CouponCustomerOptions.EVERYONE +
        " " +
        "THEN 0 ELSE ( CASE WHEN (select count(*) from coupon_customers where coupon_customers.coupon_id = coupons.id and coupon_customers.customer_id = $4 ) > 0 " +
        "THEN 0 ELSE 1 END ) END as 'not_available' FROM coupons where coupons.location_id = $1 and (coupons.name = $2 or coupons.id =  $3 ) and coupons.disabled = 0 " +
        "and coupons.start_date <= '" +
        todayDateString +
        "'";
      let result = await sails.sendNativeQuery(query, [
        params.location_id,
        params.coupon_name,
        params.coupon_id,
        params.customer_id,
      ]);
      let coupons = result.rows;
      if (coupons.length == 0) {
        resolve(null);
      } else {
        resolve(coupons[0]);
      }
    } catch (ex) {
      reject(ex);
    }
  });
  return response;
};

module.exports = {
  couponNotificationsAndSMS: async function (
    coupon,
    coupon_id,
    old_coupon,
    customers
  ) {
    if (coupon.disabled) {
      return;
    }
    try {
      let query =
        "SELECT distinct coupon_customers.id,coupon_customers.coupon_id,coupon_customers.customer_id FROM coupon_customers where coupon_customers.coupon_id = $1 ";

      let history_part =
        " and (select count(*) from coupon_usage_history where coupon_usage_history.customer_id = coupon_customers.customer_id " +
        "and coupon_usage_history.coupon_id = coupon_customers.coupon_id and coupon_usage_history.date >= '" +
        getSqlDateObject(coupon.start_date) +
        "'  and " +
        "coupon_usage_history.date <= '" +
        getSqlDateObject(coupon.end_date) +
        "' ) = 0";
      let coupon_customers = [];
      if (old_coupon) {
        if (isCouponChanged(old_coupon, coupon)) {
          query += history_part;
        } else {
          let newly_added_customer_ids = [];
          for (var index = 0; index < customers.length; index++) {
            if (customers[index].newly_added === 1) {
              newly_added_customer_ids.push(customers[index].id);
            }
          }
          if (newly_added_customer_ids.length == 0) {
            return;
          }
          query +=
            " and coupon_customers.id in (" +
            newly_added_customer_ids +
            ")" +
            history_part;
        }
      }
      let result = await sails.sendNativeQuery(query, [coupon_id]);
      coupon_customers = result.rows;

      try {
        const rawCustomers = await customerExtractionService.findAll({
          select: ["id", "name", "phone", "companyId"],
          allData: true
        }, { id: (coupon_customers.map(customer => customer.customer_id)).join(',') });
        async.each(
          coupon_customers,
          async (customer, _callback) => {
            const rawCustomer = rawCustomers.find(rawCustomer => rawCustomer.id === customer.customer_id);
            customer['customer_name'] = rawCustomer.name
            customer['customer_phone'] = rawCustomer.phone
            customer['company_id'] = rawCustomer['companyId']
            _callback();
          },
        );
      } catch (error) { }

      let store_name = "";
      if (coupon_customers.length > 0) {
        let store_query =
          "select locations.name as store_name from coupons inner join locations on \
        coupons.location_id = locations.id where coupons.id = $1 ";
        let store_result = await sails.sendNativeQuery(store_query, [
          coupon_id,
        ]);
        store_name =
          store_result.rows.length > 0 ? store_result.rows[0].store_name : "";
      }
      for (var index = 0; index < coupon_customers.length; index++) {
        try {
          let smsData = {
            company_id: coupon_customers[0].company_id,
            phone: coupon_customers[0].customer_phone,
          };
          let message = "";
          let args = [];
          if (coupon.discount_type == Constants.CouponDiscountTypes.PERCENT) {
            message = sails.__("coupon_create_percent_discount_message");
          } else if (
            coupon.discount_type == Constants.CouponDiscountTypes.FIXED
          ) {
            message = sails.__("coupon_create_fixed_discount_message");
          }
          args = [
            coupon.name,
            store_name,
            coupon.discount_value,
            getFormattedDate(coupon.start_date),
            getFormattedDate(coupon.end_date),
          ];
          let final_message = SmsService.__(message, args);
          console.log(final_message);
          // try {
          //   SmsService.sendClientMessage(
          //     {
          //       company_id: coupon_customers[0].company_id,
          //       phone: coupon_customers[0].customer_phone,
          //     },
          //     {
          //       message: message,
          //       args: args,
          //     }
          //   );
          // } catch (e) {
          //   console.log(e);
          //   continue;
          // }
          let player_id_query =
            "SELECT * FROM user_notifications where customer_id = $1 ";
          let result_player_ids = await sails.sendNativeQuery(player_id_query, [
            coupon_customers[0].customer_id,
          ]);
          let notification_ids = result_player_ids.rows;
          if (notification_ids && notification_ids.length) {
            let customer_player_ids = notification_ids.map(function (not) {
              return not.player_id;
            });
            console.log(customer_player_ids);
            try {
              NotificationService.sendCustomerNotification(
                final_message,
                customer_player_ids,
                {},
                coupon.company_id
              );
            } catch (e) {
              console.log(e);
              continue;
            }
          } else {
            console.log("Unable to send Notification");
          }
        } catch (e) {
          console.log(e);
          continue;
        }
      }
    } catch (ex) {
      console.log(ex);
    }
  },
  verifyCouponForCustomer: verifyCouponForCustomerData,
  isValidCoupon: async function (params) {
    let response = await new Promise(async (resolve, reject) => {
      try {
        let coupon = await verifyCouponForCustomerData(params);
        let message = "Coupon Applied Successfully";
        if (coupon == null) {
          message = "Invalid Coupon";
        } else if (coupon.expired) {
          message = "Expired Coupon";
        } else if (coupon.already_used) {
          message = "Coupon allowed limit reached!";
        } else if (coupon.not_available) {
          message = "Coupon not applicable";
        }
        if (
          coupon == null ||
          coupon.expired == 1 ||
          coupon.already_used == 1 ||
          coupon.not_available == 1
        ) {
          resolve({
            coupon: null,
            message: message,
            success: false,
          });
        } else {
          resolve({
            coupon: coupon,
            message: message,
            success: true,
          });
        }
      } catch (e) {
        resolve({
          coupon: null,
          message: "Invalid Coupon",
          success: false,
        });
      }
    });
    return response;
  },
  calculateCouponDiscount: function (coupon, orderTotal) {
    let coupon_discount = 0;
    if (coupon.discount_type == Constants.CouponDiscountTypes.PERCENT) {
      if (coupon.discount_value < 100 && coupon.discount_value > 0) {
        coupon_discount = parseFloat(
          (orderTotal * (coupon.discount_value / 100)).toFixed(2)
        );
        if (
          coupon.max_discount_value &&
          coupon_discount > coupon.max_discount_value
        )
          coupon_discount = coupon.max_discount_value;
      } else if (coupon.discount_value <= 0) {
        coupon_discount = 0;
      } else {
        coupon_discount = orderTotal;
      }
    } else if (coupon.discount_type == Constants.CouponDiscountTypes.FIXED) {
      if (coupon.discount_value < orderTotal) {
        coupon_discount = coupon.discount_value;
      } else {
        coupon_discount = orderTotal;
      }
    }
    return coupon_discount;
  },
  createCouponUsageHistory: async function (order_id, customer_id, coupon) {
    let response = await new Promise(async (resolve, reject) => {
      try {
        let coupon_usage_history = await couponUsageHistoryDao.create(coupon.id, {
          customer_id: customer_id,
          order_id: order_id,
          discount_value: coupon.discount_value,
          discount_type_id: coupon.discount_type,
          date: getSqlDateObject(new Date()),
        });
        console.log(
          "coupon usage history created - ",
          JSON.stringify(coupon_usage_history)
        );
        resolve(coupon_usage_history);
      } catch (e) {
        reject(e);
      }
    });
    return response;
  },
  getCustomersByFile: async function (file_params, company_id) {
    let response = await new Promise(async (resolve, reject) => {
      try {
        var s3 = new AWS.S3();
        var s3Options = {
          Bucket: sails.config.globalConf.AWS_BUCKET,
          Key: file_params.file_name,
        };
        const stream = s3.getObject(s3Options).createReadStream();
        var i = 0;
        var allCSVData = [];
        stream.pipe(
          csv()
            .on("data", async (data) => {
              if (!i) {
                i++;
              } else {
                if (Array.isArray(data)) {
                  allCSVData = allCSVData.concat(data);
                }
              }
            })
            .on("end", async () => {
              if (allCSVData.length == 0) {
                resolve({ customers: [], success: true });
              } else {
                console.log(`COUPON SERVICE: customers phone ${JSON.stringify(allCSVData)}`)
                let result = [];
                try {
                  result = (await customerExtractionService.findAll({
                    companyId: company_id,
                    select: ["id"],
                    allData: true
                  }, { phone: allCSVData.join(',') })).map(customer => ({ customer_id: customer.id }));
                } catch (err) {
                  console.log(`COUPON SERVICE: error occured while connecting user service - ${JSON.stringify(err)}`)
                }
                console.log(`COUPON SERVICE: customers returned ${JSON.stringify(result)}`)
                resolve({ customers: result, success: true });
              }
            })
        );
      } catch (e) {
        console.log(`COUPON SERVICE: error occured while fetch customers from file`)
        resolve({
          success: false,
        });
      }
    });
    return response;
  },
  validateCouponSkus: async (coupon_skus, location_id) => {
    let error_sku = null;
    let promiseList = [];
    for (const sku of coupon_skus) {
      promiseList.push(Promise.resolve(Product.findOne({ sku: sku, location_id: location_id })));
    }
    const product_list = await Promise.all(promiseList);
    await product_list.map(async (product, index) => {
      if (!product) {
        error_sku = coupon_skus[index];
      }
    })
    return { error_sku, product_list };
  },
};
