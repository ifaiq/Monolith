const AWS = AWSService.getAWSConfig();
const s3 = new AWS.S3();
const csv = require("fast-csv");
const { Notifications } = require("@development-team20/notification-library");

module.exports = {
  sendNotificationsToRetailers: async function(req, res, next) {
    try{
      const params = req.allParams();
      if(
        !params.app_id ||
        !params.retailers ||
        params.retailers.length === 0 ||
        !params.notifications ||
        params.notifications.length === 0
      ) {
        return res.badRequest({
          message: "Missing parameters",
        });
      }
      const messagePushPromises = params.notifications.map(
        templateName => Notifications.sendMessage({
          templateName,
          ...(params.is_customer && {
            customerId: params.retailers,
          }),
          ...(!params.is_customer && {
            userId: params.retailers,
          }),
          sender: "monolith",
        }),
      );
      await Promise.allSettled(messagePushPromises);
      return res.ok({message: "Notifications sent successfully"});
    } catch(e) {
      sails.log.error(e);
      return res.serverError(e, {
        message: "Something went wrong",
      });
    }
  },
    getRetailersByAppId: async function (req, res, next) {
        try{
            let params = req.allParams();
            if (!params.per_page) {
                params.per_page = 10;
            }
            if (!params.page) {
                params.page = 0;
            }
            else{
                params.page = params.page - 1;
            }
            let companyIds = [];
            if (
                res.locals.userData &&
                res.locals.userData.role.id != Constants.HyprRoles.ADMIN
              ) {
                if (
                  res.locals.userData.accessHierarchy &&
                  res.locals.userData.accessHierarchy.companies.length > 0
                ) {
                    companyIds =
                    res.locals.userData.accessHierarchy.companies;
                } else{
                    companyIds = [0]
                }
            }
            let page_index = params.page * params.per_page;
            params.page_index = page_index;
            let response;
            if(params.is_customer == "true" || params.is_customer == true || params.is_customer==1){
                response = await NotificationCenterService.getCustomersAsRetailers(params, companyIds);
            }
            else {
                // [REDUNDANT BLOCK]: not used in our code flows
                response = await NotificationCenterService.getUsersAsRetailers(params)
            }
            if(response.success){
                return res.ok({
                    totalCount: response.totalCount,
                    retailers: response.retailers
                });
            }
            else{
                return res.badRequest({
                    message: "Something went wrong"
                });
            }
        }
        catch(e){
            return res.serverError(e, {
                message: "Something went wrong"
            });
        }
    },
    bulkSendNotifications: async function (req, res, next) {
        try{
            let params = req.allParams();
            if(
                !params.app_id ||
                !params.notifications ||
                params.notifications.length==0
            ){
                return res.badRequest({
                    message: "Missing parameters"
                });
            }
            var s3Options = { Bucket: sails.config.globalConf.AWS_BUCKET, Key: req.param("file_name") };
            const stream = s3.getObject(s3Options).createReadStream();
            var i = 0;
            var allCSVData = [];
            stream.pipe(
              csv()
                .on("data", async (data) => {
                  if (!i) {
                    i++;
                  } else {
                    if(Array.isArray(data)){
                        allCSVData = allCSVData.concat(data);
                    }
                  }
                })
                .on("end", async () => {
                    if(allCSVData.length==0){
                        return res.badRequest({
                            message: "Missing Retailers"
                        });
                    }
                    else{
                        let final_response = await NotificationCenterService.sendBulkNotifications(
                            JSON.parse(JSON.stringify(params)),
                            JSON.parse(JSON.stringify(allCSVData))
                        );
                        if(final_response.success){
                            res.ok();
                        }
                        else{
                            let message = "Something went wrong";
                            if(final_response.message){
                                message = final_response.message;
                            }
                            res.serverError(message);
                        }
                    }
                })
            );
        }
        catch(e){
            res.serverError("something went wrong");
        }
    }
};
