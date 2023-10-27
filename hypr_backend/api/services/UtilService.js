const AWSService = require("./AWSService");
const AWS = AWSService.getAWSConfig();
const s3 = new AWS.S3();

function getEmails(emailString){
  let emails = [];
  try{
    if(emailString && emailString.length)
      emails = JSON.parse(emailString)
  }
  catch(e){
  }
  return emails;
}

module.exports = {
  // [DEPRECATED CALL]: need to remove this call
  getMasterCatalogDump: async function (params, user) {
    let response = new Promise(async (resolve, reject) => {
      let totalProducts = await CatalogueProducts.count({
        catalogue_id: params.catalogue_id,
      });
      var productDump = [];
      let i = 1;
      let comp_name = "";
      let catalog;
      if (totalProducts) {
        let query = "SELECT * from catalogue_products";
        if (params.catalogue_id) {
          query += " where catalogue_id = " + params.catalogue_id;
        }
        catalog = await Catalog.findOne({
          id: params.catalogue_id,
        }).populate("company_id");
        comp_name = catalog.company_id.name;
        let products = await sails.sendNativeQuery(query);
        products = products.rows;
        var csv =
          "urdu_name,name,urdu_size,size,urdu_brand,brand,price,category_id,configurable,urdu_unit,unit,disabled,mrp,cost_price,barcode,stock_quantity,company_id,customSku,description,tax_percent,tax_inclusive,consent_required,category_name,image_url,catalogueName";
        async.each(
          products,
          async (product, _callback) => {
            var productObj;
            let sku = params.forUpdate == "true" ? product.sku : "";
            productObj = [
              product.urdu_name ? '"' + product.name + '"' : "",
              product.name ? '"' + product.name + '"' : "",
              product.urdu_size ? '"' + product.urdu_size + '"' : "",
              product.size ? '"' + product.size + '"' : "",
              product.urdu_brand ? '"' + product.urdu_brand + '"' : "",
              product.brand ? '"' + product.brand + '"' : "",
              product.price,
              product.category_id ? product.category_id : null,
              product.configurable ? product.configurable : 0,
              product.urdu_unit,
              product.unit,
              product.disabled ? product.disabled : 0,
              product.mrp,
              product.cost_price,
              product.barcode,
              "",
              catalog.company_id.id,
              sku,
              product.description ? '"' + product.description + '"' : "",
              product.tax_percent,
              product.tax_inclusive,
              product.consent_required,
              product.category_level_one + "-" + product.category_level_two,
              product.image_url ? product.image_url : "",
              catalog.name,
            ];

            csv += "\n";
            csv += productObj.join(",");
            productDump.push(productObj);
            i++;
            _callback();
          },
          async () => {
            var amazonfileName =
              new Date() + comp_name + "-" + catalog.name + "-dump";
            amazonfileName = amazonfileName.replace(/[^a-zA-Z0-9]/g, "-");
            amazonfileName = amazonfileName + ".csv";

            var s3 = new AWS.S3();
            var params = {
              Bucket: sails.config.globalConf.AWS_BUCKET,
              Key: amazonfileName,
              Body: csv,
              ContentType: "application/octet-stream",
              CacheControl: "public",
            };
            s3.putObject(params, async function (err, data) {
              if (err) {
                console.log("Error at uploadCSVFileOnS3Bucket function", err);
              } else {
                console.log("File uploaded Successfully");
                user = await AuthStoreService.populateHierarchyAccess(
                  user
                );
                let recipients = await UtilService.getAccountEmails(user);
                if (user && user.email && user.email != "")
                {
                  recipients.push(user.email);
                }
                let fileUrl = `https://${sails.config.globalConf.AWS_BUCKET}.s3.${sails.config.globalConf.AWS_REGION}.amazonaws.com/${amazonfileName}`;
                // MailerService.sendMailThroughAmazon({
                //   email: recipients,
                //   htmlpart: fileUrl,
                //   subject:
                //     comp_name +
                //     " Master Catalogue Dump Report - Catalogue Name - " +
                //     catalog.name +
                //     new Date(),
                //   destination: "operations@hypr.pk",
                // });
                resolve(fileUrl);
              }
            });
          }
        );
      } else {
        resolve([], { message: "no products found" });
      }
    });

    return response;
  },
  createOrderStatuses: async function (status, orderId) {
    let response = new Promise(async (resolve, reject) => {
      try {
        let loopTill = 6;
        let status_id = 0;
        for (var i = 1; i <= loopTill; i++) {
          status_id = i;
          if (i == 6) {
            if (status == "Delivered") status_id = 9;
            else status_id = 10;
          }
          let created = await OrderStatusHistory.create({
            order_id: orderId,
            status_id: status_id,
          });
        }
        resolve();
      } catch (err) {
        reject(err);
      }
    });
    return response;
  },
  getAccountEmails: async function (user) {
    let recipients = [];
    if (
      user.accessHierarchy.companies &&
      user.accessHierarchy.companies.length > 0
    ) {
      user.accessHierarchy.companies.forEach(function (comp) {
        let emails = getEmails(comp.emails);
        recipients = recipients.concat(emails);
      });
    } else if (
      user.accessHierarchy.business_units &&
      user.accessHierarchy.business_units.length > 0
    ) {
      user.accessHierarchy.business_units.forEach(function (bu) {
        let emails = getEmails(bu.company_id.emails);
        recipients = recipients.concat(emails);
      });
    } else if (
      user.accessHierarchy.locations &&
      user.accessHierarchy.locations.length > 0
    ) {
      user.accessHierarchy.locations.forEach(function (loc) {
        let emails = getEmails(loc.company_id.emails);
        recipients = recipients.concat(emails);
      });
    }
    return recipients;
  },
};
