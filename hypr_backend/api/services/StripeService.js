const stripe = require("stripe")("sk_test_7K1LCUZGYW00FkcesRL2DJiX");

module.exports = {
  // [NOTE]: DEPRECATED SERVICE FUNCTION
  getCustomerPaymentMethods: async (customerId, location_id) => {
    let response = await new Promise(async (resolve, reject) => {
      try {
        let responseData = {
          key: "test",
          cards: [],
        };

        let customerFindResponse = await CustomerService.getCustomerById(
          customerId
        );
        let location = await Location.findOne({ where: { id: location_id } });
        let companyDetails = await AccountSettings.findOne({
          where: { company_id: location.company_id },
        });
        responseData.key = companyDetails.stripe_key;

        if (companyDetails.stripe_secret) {
          try {
            customerFindResponse.customer_stripe_id =
              !customerFindResponse.customer_stripe_id ||
              customerFindResponse.customer_stripe_id == "NULL"
                ? "12312" /* NOTE: whats this @habib ? */
                : customerFindResponse.customer_stripe_id;
            let stripeCustomer = await StripeService.getStripeCustomer(
              companyDetails.stripe_secret,
              customerFindResponse.customer_stripe_id
            );
            responseData.cards = stripeCustomer.customer.sources.data;
            resolve(responseData);
          } catch (stripeCustomerError) {
            if (stripeCustomerError.message) {
              if (stripeCustomerError.message.includes("No such customer")) {
                let customerCreateResponse = await StripeService.createStipeCustomer(
                  companyDetails.stripe_secret,
                  {
                    name: customerFindResponse.name,
                  }
                );

                customerFindResponse.customer_stripe_id =
                  customerCreateResponse.customerId;
                // TODO: Replace Customer.update() with CustomerService.updateCustomer()
                let customerStripId = await Customer.update(
                  {
                    id: customerFindResponse.id,
                  },
                  { customer_stripe_id: customerCreateResponse.customerId }
                );
                resolve(responseData);
              } else {
                reject(stripeCustomerError);
              }
            } else {
              reject(stripeCustomerError);
            }
          }
        } else {
          reject({
            Error: "No stripe secret found",
          });
        }
      } catch (err) {
        reject(err);
      }
    });
    return response;
  },
  // [NOTE]: DEPRECATED SERVICE FUNCTION
  createStipeCustomer: async (key, customerData) => {
    let response = await new Promise(async (resolve, reject) => {
      stripe.customers.create(
        customerData,
        {
          apiKey: key,
        },
        function (err, customer) {
          if (err) {
            reject({
              status: "error",
              message: err.raw.message,
            });
          } else {
            resolve({
              status: "success",
              message: "customer created",
              customerId: customer.id,
            });
          }
        }
      );
    });

    return response;
  },
  // [NOTE]: DEPRECATED SERVICE FUNCTION
  cancelPayment: async (locationId, paymentId) => {
    let response = await new Promise(async (resolve, reject) => {
      if (!locationId) {
        return reject({
          Error: "locationId not found",
        });
      }
      if (!paymentId) {
        return reject({
          Error: "paymentId not found",
        });
      }

      let location = await Location.findOne({ where: { id: locationId } });
      let companyDetails = await AccountSettings.findOne({
        where: { company_id: location.company_id },
      });

      stripe.paymentIntents.cancel(
        paymentId,
        {
          apiKey: companyDetails.stripe_secret,
        },
        function (err, paymentCancel) {
          if (err) {
            reject({
              status: "error",
              message: err.raw.message,
            });
          } else {
            resolve({
              status: "success",
              message: "Payment canceled",
              customerId: paymentCancel.payment_method,
            });
          }
        }
      );
    });

    return response;
  },
  // [NOTE]: DEPRECATED SERVICE FUNCTION
  refundPayment: async (locationId, paymentId) => {
    let response = await new Promise(async (resolve, reject) => {
      if (!locationId) {
        return reject({
          status: "error",
          message: "locationId not found",
        });
      }
      if (!paymentId) {
        return reject({
          status: "error",
          message: "paymentId not found",
        });
      }

      let location = await Location.findOne({ where: { id: locationId } });
      let companyDetails = await AccountSettings.findOne({
        where: { company_id: location.company_id },
      });

      stripe.refunds.create(
        { payment_intent: paymentId },
        {
          apiKey: companyDetails.stripe_secret,
        },
        function (err, refund) {
          if (err) {
            reject({
              status: "error",
              message: err.raw.message,
            });
          } else {
            resolve({
              status: "success",
              message: "Payment refund",
              refundId: refund.id,
            });
          }
        }
      );
    });

    return response;
  },
  // [NOTE]: DEPRECATED SERVICE FUNCTION
  getStripeCustomer: async (key, customerId) => {
    let response = await new Promise(async (resolve, reject) => {
      stripe.customers.retrieve(
        customerId,
        {
          apiKey: key,
        },
        function (err, customer) {
          if (err) {
            reject({
              status: "error",
              message: err.raw.message,
            });
          } else {
            resolve({
              status: "success",
              message: "customer fetched",
              customer: customer,
            });
          }
        }
      );
    });
    return response;
  },
  // [NOTE]: DEPRECATED SERVICE FUNCTION
  createPaymentMethod: (key, cardInfo) => {
    return new Promise((resolve, reject) => {
      stripe.paymentMethods.create(
        {
          type: "card",
          card: cardInfo,
        },
        {
          apiKey: key,
        },
        function (err, paymentMethod) {
          if (err) {
            reject({
              status: "error",
              message: err.raw.message,
            });
          } else {
            resolve({
              status: "success",
              message: "paymentMethod created",
              paymentMethod: paymentMethod.id,
            });
          }
        }
      );
    });
  },
  // [NOTE]: DEPRECATED SERVICE FUNCTION
  deletePaymentMethodFromCustomer: (key, cardInfo, customerId) => {
    return new Promise((resolve, reject) => {
      stripe.customers.deleteSource(
        customerId,
        cardInfo,
        {
          apiKey: key,
        },
        function (err, confirmation) {
          if (err) {
            reject({
              status: "error",
              message: err.raw.message,
            });
          } else {
            resolve({
              status: "success",
              message: "paymentMethod deleted",
              paymentMethodAttached: confirmation.id,
            });
          }
        }
      );
    });
  },
  // [NOTE]: DEPRECATED SERVICE FUNCTION
  attachPaymentMethodToCustomer: async (
    currentUserId,
    cardInfo,
    locationId
  ) => {
    let response = await new Promise(async (resolve, reject) => {
      try {
        let customerFindResponse = await CustomerService.getCustomerById(
          currentUserId
        );
        let location = await Location.findOne({ where: { id: locationId } });
        let companyDetails = await AccountSettings.findOne({
          where: { company_id: location.company_id },
        });

        if (companyDetails.stripe_secret) {
          stripe.customers.createSource(
            customerFindResponse.customer_stripe_id,

            {
              source: cardInfo,
            },
            {
              apiKey: companyDetails.stripe_secret,
            },

            function (err, paymentMethodAttached) {
              if (err) {
                reject({
                  status: "error",
                  message: err.raw.message,
                });
              } else {
                resolve({
                  status: "success",
                  message: "paymentMethod attached",
                  paymentMethodAttached: paymentMethodAttached.id,
                });
              }
            }
          );
        } else {
          reject({ Error: "No stripe key found " });
        }
      } catch (err) {
        reject(err);
      }
    });

    return response;
  },
  // [NOTE]: DEPRECATED SERVICE FUNCTION
  createPayment: async (
    locationId,
    cardInfo,
    amount,
    currentUserId,
    confirm
  ) => {
    let response = await new Promise(async (resolve, reject) => {
      try {
        let customerFindResponse = await CustomerService.getCustomerById(
          currentUserId
        );
        let location = await Location.findOne({ where: { id: locationId } });
        let companyDetails = await AccountSettings.findOne({
          where: { company_id: location.company_id },
        });
        if (!companyDetails.currency) {
          return reject({
            Error: "Currency not configured",
          });
        }
        if (!locationId) {
          return reject({
            Error: "locationId required",
          });
        }
        if (!customerFindResponse.customer_stripe_id) {
          return reject({
            Error: "Customer account not created in stripe",
          });
        }
        if (!companyDetails.stripe_secret) {
          return reject({
            Error: "Company stripe token not found",
          });
        }

        stripe.paymentIntents.create(
          {
            payment_method: cardInfo,
            amount: amount,
            currency: companyDetails.currency,
            confirm: confirm,
            customer: customerFindResponse.customer_stripe_id,
          },
          {
            apiKey: companyDetails.stripe_secret,
          },
          function (err, paymentIntent) {
            if (err) {
              return reject({
                status: "error",
                message: err.raw.message,
              });
            } else {
              return resolve({
                status: "success",
                message: "charge made ",
                chargeId: paymentIntent.id,
              });
            }
          }
        );
      } catch (err) {
        return reject(err);
      }
    });

    return response;
  },
  // [NOTE]: DEPRECATED SERVICE FUNCTION
  confirmPayment: async (locationId, paymentId) => {
    let response = await new Promise(async (resolve, reject) => {
      if (!locationId) {
        return reject({
          Error: "locationId not found",
        });
      }
      if (!paymentId) {
        return reject({
          Error: "paymentId not found",
        });
      }

      let location = await Location.findOne({ where: { id: locationId } });
      let companyDetails = await AccountSettings.findOne({
        where: { company_id: location.company_id },
      });

      stripe.paymentIntents.confirm(
        paymentId,
        {
          apiKey: companyDetails.stripe_secret,
        },

        function (err, confirmPayment) {
          if (err) {
            reject({
              status: "error",
              message: err.raw.message,
            });
          } else {
            resolve({
              status: "success",
              message: "charge made ",
              chargeId: confirmPayment.id,
            });
          }
        }
      );
    });

    return response;
  },
  // [NOTE]: DEPRECATED SERVICE FUNCTION
  removeCard: async (customerId, cardId, key) => {
    stripe.customers.deleteSource(
      customerId,
      cardId,
      {
        apiKey: key,
      },
      function (err, cardDeleted) {
        if (err) {
          sails.log.error(`Error while deleting card ${JSON.stringify(err)}`);
        } else {
          sails.log.info(`Card Deleted ${JSON.stringify(cardDeleted)}`);
        }
      }
    );
  },
};
