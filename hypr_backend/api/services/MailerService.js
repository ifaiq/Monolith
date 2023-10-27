const AWSService = require("./AWSService");
const AWS = AWSService.getAWSConfig();
const { StringDecoder } = require('string_decoder');

var ses = new AWS.SES({ apiVersion: "2010-12-01" });
module.exports = {
  sendMailThroughAmazon: function (obj) {
    head =
      "<head><style>table {font-family: arial, sans-serif;border-collapse: collapse;width: 100%;}td, th {border: 1px solid black;text-align: left;padding: 8px;}tr:nth-child(even) {background-color: #dddddd;}</style></head>";
    if (process.env.NODE_ENV != "production")
      obj.htmlpart =
        '<p style="color:grey;">' +
        process.env.NODE_ENV +
        "</p>" +
        obj.htmlpart;
    obj.htmlpart = head + "<body>" + obj.htmlpart + "</body>";
    sails.log.info(`Sending email through amazon: ${obj.htmlpart}`);
    var to = obj.email;
    to == null || to == undefined || to.length <= 0
      ? (to = ["manal.fatima@shopdev.co"])
      : null;
    var from = obj.destination;
    sails.log.info(`Sending email to address: ${JSON.stringify(to)}`);
    if (process.env.NODE_ENV != "local") {
      try {
        ses.sendEmail(
          {
            Source: sails.config.globalConf.AWS_SES_EMAIL,
            Destination: {
              ToAddresses: to,
              BccAddresses: [],
            },
            Message: {
              Subject: {
                Data: obj.subject,
              },
              Body: {
                Html: {
                  Charset: "UTF-8",
                  Data: obj.htmlpart,
                },
              },
            },
          },
          function (err, data) {
            if (err) {
              sails.log.warn(`ReqID: reqId, UserID: userId, Error in sending email: ${JSON.stringify(err.stack)}`);
              // throw err;
            }
            sails.log.info(`Email sent to: ${JSON.stringify(data)}`);
          }
        );
      } catch (err) {
        sails.log.error(`Error in sending email: ${JSON.stringify(err)}`);
      }
    }
  },
  /* NOTE: Standardized Mailer Function from AWS SES docs */
  sendEmailThroughAwsSes: function (destinationsArray, subject, bodyHtml) {
    let params = {
      Source: sails.config.globalConf.AWS_SES_EMAIL,
      Destination: {
        ToAddresses: destinationsArray,
      },
      Message: {
        Subject: {
          Data: subject,
        },
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: bodyHtml,
          },
        },
      },
    };
    return new Promise ((resolve,reject) => {
      ses.sendEmail(params, function(err, data) {
        if (err) {
          sails.log.error(`Error in MailerService.sendEmailThroughAwsSes: ${JSON.stringify(err)}, ${JSON.stringify(err.stack)}`);
          reject(err);
        }
        else {
          sails.log.info(`Successful response in MailerService.sendEmailThroughAwsSes: ${JSON.stringify(data)}`)
          sails.log.info(`Email sent to: ${JSON.stringify(destinationsArray)}`)
          resolve(data);
        }
      });
    });
  },
  /* NOTE: Function to read request object file stream and return as string */
  htmlFileStreamToString: async (stream) => {
    try {
      const decoder = new StringDecoder('utf8');
      const chunks = [];
      return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(Buffer.from(decoder.write(chunk))));
        stream.on('error', (err) => reject(err));
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      })
    } catch (err) {
      sails.log.error(`Error in MailerService.htmlFileStreamToString: ${JSON.stringify(err)}`);
    }
  },
};
