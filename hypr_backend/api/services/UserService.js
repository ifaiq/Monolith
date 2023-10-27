var request = require("request");
var defer = require("node-defer");
var https = require("https");
const {
  destroyByCriteria: destoryNotificationByCriteria,
} = require("../modules/v1/UserNotification/UserNotificationDao");

module.exports = {
  destroyNotificationId: async function (params) {
    var deferred = new defer();
    let user_key = params.isCustomer ? "customer_id" : "user_id";
    let criteria = {};
    criteria["session_uuid"] = params.session_uuid
    criteria[user_key] = params.user_id;
    criteria.player_id = params.player_id;
    try {
      await destoryNotificationByCriteria(criteria);
      deferred.resolve();
    } catch (err) {
      deferred.reject();
    }
    return deferred.promise();
  },

  saveNotificationId: async function (params) {
    var deferred = new defer();
    try {
      let user_key = params.isCustomer ? "customer_id" : "user_id";
      let criteria = {};
      criteria["session_uuid"] = params.session_uuid
      criteria[user_key] = params.user_id;
      criteria.player_id = params.player_id;
      console.log("FIND OR CREATE CRITERIA", criteria);
      if (!GeneralHelper.emptyOrAllParam(criteria.player_id)) {
        let notification_record = await UserNotifications.find(criteria);
        notification_record && notification_record.length > 0
          ? null
          : (notification_record = await UserNotifications.create(criteria));
      }
      deferred.resolve();
    } catch (err) {
      deferred.reject(err);
    }
    return deferred.promise();
  },
};
