const AWSService = require("./AWSService");

const AWS = AWSService.getAWSConfig();
const s3 = new AWS.S3();

module.exports = {
  dumpEventsData: async function (code) {
    await sails.getDatastore("readReplica").transaction(async (db) => {
      let appEvents = await AppEvents.find().usingConnection(db);
      let csvData = "name,phone,longitude,latitude,address,address_line_1";
      async.eachSeries(
        appEvents,
        async (event, _callback) => {
          let customer = null;
          if (event.device_id) {
            let customerId = await UserNotifications.find({
              player_id: event.device_id,
            })
              .select("customer_id")
              .limit(1);
            if (customerId.length) {
              let query = `SELECT c.name, c.phone, ca.address, ca.address_line_1
              from customers c join customer_addresses ca on c.id = ca.customer_id
              where c.id = $1`;
              let result = await sails.sendNativeQuery(query, [customerId[0].customer_id]);
              customer = result.rows[0];
            }
          }
          obj = [
            customer ? '"' + customer.name + '"' : "",
            customer ? '"' + customer.phone + '"' : "",
            event.longitude ? '"' + event.longitude + '"' : "",
            event.latitude ? '"' + event.latitude + '"' : "",
            customer ? '"' + customer.address + '"' : "",
            customer ? '"' + customer.address_line_1 + '"' : "",
          ];
          csvData += "\n";
          csvData += obj.join(",");
          _callback();
        },

        async function (err, result) {
          if (err) console.log(err);
          else {
            var amazonfileName =
              process.env.NODE_ENV + "/" + code + "/" + "-customer-info";
            amazonfileName = amazonfileName + ".csv";
            var params = {
              Bucket: sails.config.globalConf.AWS_BUCKET,
              Key: amazonfileName,
            };
            s3.deleteObject(params, async (err, data) => {
              if (!err) {
                s3.getObject(params, async (err, data) => {
                  if (err.code == "NoSuchKey") {
                    params["Body"] = csvData;
                    params["ContentType"] = "application/octet-stream";
                    params["CacheControl"] = "public";
                    s3.putObject(params, async function (err, data) {
                      if (err) {
                        console.log(
                          "Error at uploadCSVFileOnS3Bucket function",
                          err
                        );
                      } else {
                        let fileUrl = `https://${sails.config.globalConf.AWS_BUCKET}.s3.${sails.config.globalConf.AWS_REGION}.amazonaws.com/${amazonfileName}`;
                        sails.log(`${fileUrl} uploaded successfully!`);
                      }
                    });
                  } else {
                    console.log("ERROR OCCURED WHILE GETTING OBJECT");
                  }
                });
              } else {
                console.log("ERROR OCCURED WHILE DELETING OBJECT");
              }
            });
          }
        }
      );
    });
  },
};
