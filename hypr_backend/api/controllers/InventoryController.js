const AWS = AWSService.getAWSConfig();

module.exports = {
  stockIn: async (req, res, next) => {
    var params = req.allParams();
    const { user: { id, role } } = req;
    let result = await InventoryService.preStockInCall(
      params,
      res.locals.userData.id,
      role
    );
    if (!result.success)
      return res.serverError(result.trace, {
        message: result.message,
      });
    res.ok();
  },

  getAllInventory: async (req, res, next) => {
    const params = req.allParams();
    var findCriteria = {};
    let per_page = params.per_page ? params.per_page : 10;
    let page = params.page && params.page > 1 ? params.page : 1;
    findCriteria = {};
    if (params.search) {
      findCriteria["or"] = [
        { sku: { contains: params.search } },
        { name: { contains: params.search } },
        { brand: { contains: params.search } },
      ];
    }
    if (params.disabled == 0 || params.disabled == 1) {
      findCriteria["disabled"] = params.disabled;
    }
    if (!GeneralHelper.emptyOrAllParam(params.location_id)) {
      findCriteria["location_id"] = params.location_id;
    }

    if (!GeneralHelper.emptyOrAllParam(params.quantity)) {
      if (params.quantity == 0) {
        findCriteria["stock_quantity"] = 0;
      } else if (params.quantity == 1) {
        findCriteria["stock_quantity"] = { ">": 0, "<=": 50 };
      } else if (params.quantity == 2) {
        findCriteria["stock_quantity"] = { ">": 50, "<=": 100 };
      } else {
        findCriteria["stock_quantity"] = { ">": 0 };
      }
    }

    let countCriteria = { ...findCriteria };
    /* NOTE: replacement of .paginate as it wont work with sails v1 */

    findCriteria = { where: findCriteria };
    findCriteria.skip = (page <= 1 ? 0 : page - 1) * per_page;
    findCriteria.limit = per_page;

    try {
      let totalCount = await Product.count(countCriteria);
      let result = await Product.find(findCriteria);
      if (result) {
        res.ok({ inventory: result, totalCount: totalCount ? totalCount : 0 });
      } else {
        res.ok(
          {},
          {
            totalCount: 0,
          }
        );
      }
    } catch (err) {
      res.serverError(err, {
        message: "ERROR OCCURED WHILE COUNTING INVENTORY",
      });
    }
  },
  CSVStockIn: (req, res, next) => {
    var params = req.allParams();
    InventoryService.parseCSV_createStock(
      params.file_name,
      res.locals.userData,
      params.file_url
    );
    res.ok();
  },

  getInventoryHistory: async (req, res, next) => {
    const params = req.allParams();
    try {
      sails.log.info(`ReqId: ${params.reqID}, userID: ${res.locals.userData.id}, context: "${req.url}", In getInventoryHistory()`);
      sails.log(`ReqId: ${params.reqID}, userID: ${res.locals.userData.id}, context: "${req.url}", Params received: ${JSON.stringify(params)}`);
      const inventoryHistory = await InventoryService.inventoryHistory(params, res.locals.userData, req.url);
      res.ok(inventoryHistory);
    } catch (err) {
      sails.log.error(`ReqId: ${params.reqID}, userID: ${res.locals.userData.id}, context: "${req.url}", ERROR: [${err}]`);
      res.serverError(err, {
        message: 'Error occoured while getting inventory history'
      });
    }
  },
};
