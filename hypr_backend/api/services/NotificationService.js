var https = require("https");
const locationExtractionService = require("../config_service_extraction/locationsExtraction")
async function sendNotificationByRoleAndLocation(
  text,
  notification_ids,
  data,
  role_id,
  location_id
) {
  sails.log.info(`sending notification order flow ${role_id}, ${location_id}`);
  try {
    let location = await locationExtractionService.findOne({
      id: location_id,
    });
    let app_res = await AppVersionService.getAppByRoleAndCompany(
      role_id,
      location.company_id
    );
    if (app_res.success) {
      let app = app_res.app;
      if (app) {
        NotificationService.sendNotification(
          notification_ids,
          text,
          '', // TODO: check if launchUrl required here too
          app.app_id,
          app.app_key,
          data
        );
      } else {
        sails.log.info(`notification not sent: ${location_id}`);
      }
    } else {
      sails.log.info(`App not found by AppName: ${app_name}`);
    }
  } catch (e) {
    console.log(e);
    console.log("Error inside find company by location");
  }
}

module.exports = {
  sendNotification: function (
    notification_ids,
    text,
    launchUrl,
    app_id,
    app_key,
    req_data
  ) {
    sails.log.debug(
      `OrderID: ${req_data.order_id} Sending notification: ${JSON.stringify(
        notification_ids
      )} text: ${JSON.stringify(text)}`
    );

    let headings = null;
    let image = null;
    if (req_data && req_data.image) {
      image = JSON.parse(JSON.stringify(req_data.image));
      delete req_data.image;
    }
    if (req_data && req_data.headings) {
      headings = JSON.parse(JSON.stringify(req_data.headings));
      delete req_data.headings;
    }
    var data = {
      app_id: app_id,
      contents: { en: text, url: launchUrl },
      data: { ...req_data, url: launchUrl },
      url: launchUrl,
    };
    if (headings) {
      data["headings"] = headings;
    }
    if (image) {
      data["ios_attachments"] = { id1: image };
      data["big_picture"] = image;
      data["huawei_big_picture"] = image;
      data["chrome_web_image"] = image;
      data["adm_big_picture"] = image;
    }
    if (notification_ids == "All") {
      sails.log.info(
        `OrderID: ${
          data.order_id
        } Sending notification to segment: ${JSON.stringify(notification_ids)}`
      );
      data.included_segments = notification_ids;
    } else {
      sails.log.info(
        `OrderID: ${
          data.order_id
        } Sending notification to players: ${JSON.stringify(notification_ids)}`
      );
      data.include_player_ids = notification_ids;
    }
    var headers = {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: "Basic " + app_key,
    };

    var options = {
      host: "onesignal.com",
      port: 443,
      path: "/api/v1/notifications",
      method: "POST",
      headers: headers,
    };

    var req = https.request(options, function (res) {
      res.on("data", function (data) {
        sails.log.info(
          `OrderID: ${data.order_id} Response: ${JSON.stringify(data)}`
        );
      });
    });

    req.on("error", function (e) {
      sails.log.info(`OrderID: ${data.order_id} Error: ${JSON.stringify(e)}`);
    });

    req.write(JSON.stringify(data));
    req.end();
  },

  sendPackerNotification: function (text, notification_ids, data, location_id) {
    sails.log.debug(
      `OrderID: ${
        data.order_id
      } Sending notification to packer Notification ids: ${JSON.stringify(
        notification_ids
      )} Text: ${text} Data: ${JSON.stringify(data)}`
    );
    sendNotificationByRoleAndLocation(
      text,
      notification_ids,
      data,
      Constants.HyprRoles.PACKER,
      location_id
    );
  },

  sendCustomerNotification: async function (
    text,
    notification_ids,
    data,
    company_id
  ) {
    let message = typeof text === "string" ? text : text.message;
    let args = typeof text === "object" ? text.args : [];

    if (args !== undefined && args.length > 0) {
      message = SmsService.__(message, args);
    }
    sails.log.debug(
      `OrderID: ${
        data.order_id
      } Sending notification to customer Notification ids: ${JSON.stringify(
        notification_ids
      )} Text: ${text} Data: ${JSON.stringify(data)}`
    );
    let app_res = await AppVersionService.getCustomerAppByCompanyId(company_id);
    if (app_res.success) {
      let app = app_res.app;
      if (app) {
        NotificationService.sendNotification(
          notification_ids,
          message,
          "", // TODO: need to check what this launch url is by respective squad
          app.app_id,
          app.app_key,
          data
        );
      } else {
        sails.log.info(`notification not sent: ${company_id}`);
      }
    } else {
      sails.log.info(`App not found by AppName: ${app_name}`);
    }
  },

  sendDeliveryNotification: function (
    text,
    notification_ids,
    data,
    location_id
  ) {
    sails.log.debug(
      `OrderID: ${
        data.order_id
      } Sending notification to delivery Notification ids: ${JSON.stringify(
        notification_ids
      )} Text: ${text} Data: ${JSON.stringify(data)}`
    );
    sendNotificationByRoleAndLocation(
      text,
      notification_ids,
      data,
      Constants.HyprRoles.DELIVERY,
      location_id
    );
  },
};
