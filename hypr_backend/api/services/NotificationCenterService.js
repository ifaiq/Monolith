const customerExtractionService = require('../user_service_extraction/customerService');
const userExtractionService = require('../user_service_extraction/userService');
const UserService = require("../modules/v1/Auth/UserService");
const companyExtractionService = require("../config_service_extraction/companiesExtraction");
const { COMPANIES } = require("./Constants");
const { Notifications } = require("@development-team20/notification-library");

function isCustomer(params) {
  if (
    params.is_customer == "true" ||
    params.is_customer == true ||
    params.is_customer == 1
  ) {
    return true;
  }
  return false;
}
async function getAppByIdData(app_id) {
  let response = await new Promise(async (resolve, reject) => {
    try {
      let query = "SELECT * FROM app_versions where id = $1 ;";
      let query_result = await sails.sendNativeQuery(query, [app_id]);
      let app = query_result.rows[0];
      resolve({
        success: true,
        app: app,
      });
    } catch (e) {
      reject({
        success: false,
      });
    }
  });
  return response;
}
async function getNotificationsByIdData(notification_ids) {
  let response = await new Promise(async (resolve, reject) => {
    try {
      let query = `SELECT * FROM notification_messages where id in ($1)`;
      let query_result = await sails.sendNativeQuery(query, [notification_ids]);
      let notifications = query_result.rows;
      resolve({
        success: true,
        notifications: notifications,
      });
    } catch (e) {
      reject({
        success: false,
      });
    }
  });
  return response;
}
async function sendNotificationToRetailersData(params, app, notifications) {
  let response = await new Promise(async (resolve, reject) => {
    try {
      let query = "";
      if (isCustomer(params)) {
        query = `SELECT user_notifications.player_id FROM user_notifications
        where customer_id in ($1) and player_id is not null and player_id != '' `;
      } else {
        query = `SELECT user_notifications.player_id FROM user_notifications
        where user_id in ($1) and player_id is not null and player_id != '' `;
      }
      let result_player_ids = await sails.sendNativeQuery(query, [params.retailers]);
      let notification_ids = result_player_ids.rows;
      if (notification_ids && notification_ids.length) {
        let player_ids = notification_ids.map(function (not) {
          return not.player_id;
        });
        for (var index = 0; index < notifications.length; index++) {
          try {
            let launchUrl = notifications[index].launch_url;
            NotificationService.sendNotification(
              player_ids,
              notifications[index].text,
              launchUrl,
              app.app_id,
              app.app_key,
              {
                headings: {
                  en: notifications[index].title,
                },
                image: notifications[index].image_url,
              }
            );
          } catch (e) {
            console.log(e);
            continue;
          }
        }
      }
      resolve({
        success: true,
      });
    } catch (e) {
      resolve({
        success: false,
      });
    }
  });
  return response;
}
module.exports = {
  getNotificationsById: getNotificationsByIdData,
  getAppById: getAppByIdData,
  sendNotificationToRetailers: sendNotificationToRetailersData,
  getCustomersAsRetailers: async function (params, companyIds) {
    return new Promise(async (resolve, reject) => {
      try {
        const { id: companyId } = await UserService.getRetailoCompany();
        const criteria = {
          companyId,
          select: ["id", "name", "phone", "email"],
        };
        const totalCount = await customerExtractionService.getCountByCriteria({ companyId });
        criteria.pageNo = parseInt(params.page) + 1;
        criteria.limit = parseInt(params.per_page);
        if (params.phone) {
          criteria.searchOnAttributes = "phone";
          criteria.searchValue = params.phone;
        }
        const retailers = await customerExtractionService.find(criteria);
        const companyName = (await companyExtractionService.find({ code: COMPANIES.RETAILO }))[0].name;
        retailers.forEach(retailer => retailer['company_name'] = companyName);

        resolve({
          success: true,
          totalCount: totalCount,
          retailers: retailers,
        });
      } catch (e) {
        reject({
          success: false,
          totalCount: 0,
          retailers: [],
        });
      }
    });
  },
  // [REVISIT REQUIRED]: query optimization needed
  sendBulkNotifications: async function (params, phone_numbers) {
    return await new Promise(async resolve => {
      try {
        if (params.notifications.length > 0) {
          let retailers = [];
          const retailerIds = [];
          if (isCustomer(params)) {
            const { id: companyId } = await UserService.getRetailoCompany();
            const criteria = { companyId, select: ["id"], allData: true };
            retailers = await customerExtractionService.findAll(criteria, { phone: phone_numbers.join(',') });
          } else {
            // [REDUNDANT BLOCK]: not used in our code flows
            const query =
              `SELECT distinct user_roles.user_id as id FROM user_roles inner join app_roles \
            on app_roles.role_id =  user_roles.role_id where app_roles.app_id = ${params.app_id}`;
            const query_result = await sails.sendNativeQuery(query, []);
            const userIds = query_result.rows.map(user => user.id);
            const criteria = { id: userIds, phone: phone_numbers, select: ["id"], allData: true };
            retailers = await userExtractionService.getAll(criteria);
          }
          if (retailers.length > 0) {
            retailers.forEach(retailer => {
              retailerIds.push(retailer.id);
            });

            const messagePushPromises = params.notifications.map(
              templateName => Notifications.sendMessage({
                templateName,
                ...(isCustomer(params) && {
                  customerId: retailerIds,
                }),
                ...(!isCustomer(params) && {
                  userId: retailerIds,
                }),
                sender: "monolith",
              }),
            );
            await Promise.allSettled(messagePushPromises);
            resolve({
              success: true,
            });
          } else {
            resolve({
              success: false,
              message: "No retailer found for given data",
            });
          }
        }
      } catch (e) {
        sails.log.error("inside capture error....");
        sails.log.error(e);
        resolve({
          success: false,
        });
      }
    });
  },
};
