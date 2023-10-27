const RedisService = require("./RedisService");
const customerExtractionService = require('../user_service_extraction/customerService');

module.exports = {
  updateCustomerAddressById: async function (customer_address_id, params) {
    let response = await new Promise(async (resolve, reject) => {
      try {
        let address_data = {
          address_line_1: params.address,
          address: params.address,
        };
        if (params.city_area && params.city_area != "") {
          address_data["city_area"] = params.city_area;
        }
        try {
          if (params.customer_location_id.location.length > 0) {
            address_data["location_cordinates"] =
              params.customer_location_id.location;
          }
        } catch (e) { }
        let address = await CustomerAddress.update(
          { id: customer_address_id },
          address_data
        );
        resolve({
          success: true,
          address: address,
        });
      } catch (e) {
        resolve({
          success: false,
        });
      }
    });
    return response;
  },
  placeOrderForCustomer: async function (orderId, orderObj, clientTimeOffset) {
    let response = await new Promise(async (resolve, reject) => {
      try {
        let orderUpdated = await Order.updateAndCreateHistory(
          { id: orderId },
          orderObj
        );

        let order = orderUpdated[0];
        order.service_charge = 0.0;
        order.delivery_charge = 0.0;
        order.service_charge = GeneralHelper.getFlatOrPercent(
          order.service_charge_type,
          order.service_charge_value,
          orderObj.total_price + parseFloat(orderObj.tax)
        );
        order.delivery_charge = GeneralHelper.getFlatOrPercent(
          order.delivery_charge_type,
          order.delivery_charge_value,
          orderObj.total_price + parseFloat(orderObj.tax)
        );
        resolve(order);
      } catch (err) {
        reject(err);
      }
    });

    return response;
  },

  buildCustomerCriteria: async function (params) {
    let response = await new Promise(async (resolve, reject) => {
      var findCriteria = {};
      findCriteria["or"] = [];
      var customer_data = _.pick(params.customerData, [
        "id",
        "name",
        "address",
        "phone",
        "email",
        "country",
        "post_code",
        "cnic",
        "verification_code",
        "verified_at",
        "pin_code",
        "cnic_picture",
        "customer_location_id",
        "location_id",
        "player_id",
        "security_token",
        "block",
        "role",
        "block_date",
        "DOB",
        "company_id",
      ]);
      var customer_address_data = _.pick(params.customerData, [
        "address",
        "address_line_1",
        "address_line_2",
        "post_code",
        "city_area",
        "location_cordinates",
      ]);
      customer_address_data.location_cordinates = JSON.stringify(
        customer_address_data.location_cordinates
      );
      var customer_criteria = {
        // select: ["id"], /* NOTE: aint working */
        or: [
          {
            phone: { contains: params.customerData.customer_reference },
          },
          {
            email: { contains: params.customerData.customer_reference },
          },
        ],
      };
      if (params.customerData.phone) {
        customer_criteria.phone = params.customerData.phone;
      }
      if (params.customerData.email) {
        customer_criteria.email = params.customerData.email;
      }
      if (params.customerData.company_id) {
        customer_criteria.company_id = params.customerData.company_id;
      }
      if (params.customerData.customer_reference_type == "phone") {
        customer_data.phone = params.customerData.customer_reference;
      } else if (params.customerData.customer_reference_type == "email") {
        customer_data.email = params.customerData.customer_reference;
      }
      try {
        let createCustomerAndAddr = await CustomerService.createCustomerAndAddresses(
          params,
          customer_criteria,
          customer_data,
          customer_address_data
        );
        if (createCustomerAndAddr) {
          resolve({ success: true, customer: createCustomerAndAddr });
        } else {
          reject("Could Not Create Customer Or Addresses");
        }
      } catch (err) {
        reject(err);
      }
    });

    return response;
  },

  createCustomerAndAddresses: async function (
    params,
    customer_criteria,
    customer_data,
    customer_address_data
  ) {
    let response = await new Promise(async (resolve, reject) => {
      try {
        Customer.findOrCreate(customer_criteria, customer_data).exec(
          async function (err, customer, wasCreated) {
            if (err) {
              reject(err);
            } else if (!wasCreated) {
              let toUpdate = _.pick(customer_data, [
                "name",
                "address",
                "email",
                "cnic",
              ]);
              try {
                if (!GeneralHelper.emptyOrAllParam(params.player_id, true)) {
                  let notification = await UserNotifications.find({
                    customer_id: customer.id,
                    player_id: params.player_id,
                  });
                  notification && notification.length > 0
                    ? null
                    : await UserNotifications.create({
                      customer_id: customer.id,
                      player_id: params.player_id,
                    });
                }
                // TODO: Replace Customer.update() with CustomerService.updateCustomer()
                let updatedCustomer = await Customer.update(
                  {
                    id: customer.id,
                  },
                  toUpdate
                );
              } catch (err) {
                sails.log.warn(
                  `Error in customer notification: ${JSON.stringify(err)}`
                );
                // Note: If you want to reject a promise then there is no need of try/catches
                // reject(err);
              }
            }
            customer_address_data.customer_id = customer.id;
            sails.log.debug(
              `Creating address: ${JSON.stringify(customer_address_data)}`
            );
            var customer_address;
            if (params.fromRetailo) {
              customer_address = await CustomerAddress.find({
                customer_id: customer.id,
              }).limit(1);
              customer_address = customer_address[0];
            } else {
              customer_address = await CustomerAddress.create(
                customer_address_data
              );
            }
            customer["customer_address"] = customer_address;
            resolve(customer);
          }
        );
      } catch (err) {
        reject(err);
      }
    });

    return response;
  },

  getCustomerById: async (customerId) => {
    let response = await new Promise(async (resolve, reject) => {
      Customer.findOne({ id: customerId }).exec(function (err, customer) {
        if (customer) {
          resolve(customer);
        } else {
          reject({ message: "CUSTOMER NOT FOUND" });
        }
      });
    });

    return response;
  },

  getAllCustomers: async function (criteria, populate_list) {
    let response = await new Promise(async (resolve, reject) => {
      let query = Customer.find(criteria);
      if (populate_list && populate_list.length > 0) {
        populate_list.forEach(function (pop_obj) {
          query.populate(pop_obj);
        });
      }
      await query.exec(function (err, customers) {
        if (err) {
          reject(err);
        } else {
          delete customers.verification_code;
          resolve({ customers: customers });
        }
      });
    });

    return response;
  },
  getCustomerShopDetails: async function (reqID, customer_id) {
    let response = await new Promise(async (resolve, reject) => {
      let shopDetailsQuery = `${RedisService.FILTER_NAMES.customerShopDetails}_*customer_id:${customer_id}_*`;
      sails.log.info(
        `reqID: ${reqID}, context: AuthController._onCustomerPassportAuth shopDetailsQuery: ${shopDetailsQuery}`
      );
      let shopDetailsData = await RedisService.client.get(shopDetailsQuery);
      if (shopDetailsData) {
        sails.log.info(
          `reqID: ${reqID}, context: AuthController._onCustomerPassportAuth Redis shopDetailsData: ${shopDetailsData}`
        );
        shopDetailsData = JSON.parse(shopDetailsData);
      } else {
        shopDetailsData = await CustomerRetailerShopDetails.find({
          customer_id: customer_id,
        }).limit(1);
        if (shopDetailsData.length > 0) {
          shopDetailsData = shopDetailsData[0];
          sails.log.info(
            `reqID: ${reqID}, context: AuthController._onCustomerPassportAuth Database shopDetailsData: ${JSON.stringify(
              shopDetailsData
            )}`
          );
          try {
            RedisService.client.set(
              shopDetailsQuery,
              JSON.stringify(shopDetailsData)
            );
          } catch (err) {
            sails.log.error(
              `reqID: ${reqID}, context: AuthController._onCustomerPassportAuth Error in setting shopDetailsData in Redis: ${JSON.stringify(
                err
              )}`
            );
          }
        }
      }
      if (shopDetailsData) {
        resolve(shopDetailsData);
      } else {
        resolve("Customer shop details not found");
      }
    });
    return response;
  },
  shopPreferredDeliveryTimeToString(deliveryTimes) {
    var TimesEnum = {
      1: "Morning",
      2: "Afternoon",
      3: "Evening",
      4: "Night",
    };
    sails.log.info(
      `shopPreferredDeliveryTimeToString Delivery Times: ${deliveryTimes}`
    );
    try {
      let deliveryTimesJson = JSON.parse(deliveryTimes);
      let parsedTimes;
      for (let time in deliveryTimesJson) {
        if (parsedTimes) {
          parsedTimes = `${parsedTimes}-${TimesEnum[deliveryTimesJson[time]]}`;
        } else {
          parsedTimes = `${TimesEnum[deliveryTimesJson[time]]}`;
        }
      }
      let response = JSON.stringify(parsedTimes);
      sails.log.info(`shopPreferredDeliveryTimeToString Response: ${response}`);
      return response;
    } catch (e) {
      sails.log.warn(
        `shopPreferredDeliveryTimeToString Failed to parse ${deliveryTimes} Error: ${JSON.stringify(
          e
        )}`
      );
      return `Failed to parse shop preferred delivery time`;
    }
  },
  shopClosedDaysToString(closedDays) {
    var DaysEnum = {
      1: "Monday",
      2: "Tuesday",
      3: "Wednesday",
      4: "Thursday",
      5: "Friday Morning",
      6: "Friday Evening",
      7: "Saturday",
      8: "Sunday",
    };
    sails.log.info(`shopClosedDaysToString Closed days: ${closedDays}`);
    try {
      let closedDaysJson = JSON.parse(closedDays);
      let parsedDays;
      for (let day in closedDaysJson) {
        if (parsedDays) {
          parsedDays = `${parsedDays}-${DaysEnum[closedDaysJson[day]]}`;
        } else {
          parsedDays = `${DaysEnum[closedDaysJson[day]]}`;
        }
      }
      let response = JSON.stringify(parsedDays);
      sails.log.info(`shopClosedDaysToString Response: ${response}`);
      return response;
    } catch (e) {
      sails.log.warn(
        `shopClosedDaysToString Failed to parse ${closedDays} Error: ${JSON.stringify(
          e
        )}`
      );
      return `Failed to parse shop closed days`;
    }
  },
  /**
   *
   * @param {object} customer
   * @param {string} id
   */
  updateCustomer: async (id, customer) => await customerExtractionService.update({ id }, customer),
};