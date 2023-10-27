const CategoryService = require("../services/CategoryService");
const { CategoryTypes } = require('../constants/enums');

const getAllCategories = async function (req, res, next) {
  try {
    var params = req.allParams();
    if (GeneralHelper.emptyOrAllParam(params.location_id)) {
      return res.badRequest("Missing Required Param");
    }
    if (params.search || params.id) {
      let findCriteria = {
        parent: null,
        type: CategoryTypes[params.type] || CategoryTypes.CATEGORY
      };
      if (params.search) {
        findCriteria["or"] = [{ name: { contains: params.search } }];
      }
      if (params.location_id) {
        findCriteria["location_id"] = params.location_id;
      }
      let countCriteria = { ...findCriteria };
      if (params.id && params.id > 0) {
        findCriteria.id = params.id;
        countCriteria = { ...findCriteria };
      }
      findCriteria = { where: findCriteria };
      let result = await CategoryService.getAllCategories(
        findCriteria,
        countCriteria
      );
      sails.log.info(
        `reqID: ${params.reqID
        }, context: CategoriesController.getAllCategories result: ${JSON.stringify(
          result
        )}`
      );
      res.ok(result.categories, {
        totalCount: result.totalCount,
        totalwithoutSearch: result.totalwithoutSearch,
      });
    } else {
      if (params.isAdmin) {
        params.showDisabled = true;
      }
      sails.log(
        `reqID: ${params.reqID
        }, context: CategoriesController.getAllCategories params: ${JSON.stringify(
          params
        )}`
      );
      let result = await CategoryService.getCategoriesForStore(
        params.reqID,
        params
      );
      sails.log.info(
        `reqID: ${params.reqID
        }, context: CategoriesController.getAllCategories result: ${JSON.stringify(
          result
        )}`
      );
      res.ok(result.categories, {
        totalCount: result.totalCount,
        totalwithoutSearch: result.totalwithoutSearch,
      });
    }
  } catch (err) {
    sails.log.error(
      `reqID: ${params.reqID
      }, context: CategoriesController.getAllCategories Error: ${JSON.stringify(
        err.stack
      )}`
    );
    res.serverError(err, {
      message: "Error occurred while getting all categories",
    });
  }
};

module.exports = {
  getAllCategories: getAllCategories,
  getAllAdminCategories: async function (req, res, next) {
    await getAllCategories(req, res, next);
  },
  createProductCategory: async function (req, res, next) {
    try {
      var params = req.allParams();
      await CategoryService.checkDuplicateCategories(params);
      await CategoryService.createCategories(params);
      res.ok();
    } catch (err) {
      err.type == ErrorTypes.SERVER_ERROR
        ? res.serverError(err.trace, {
          message: err.message,
        })
        : err.type == ErrorTypes.BAD_REQUEST
          ? res.badRequest(err.message)
          : null;
    }
  },
  updateCategory: async function (req, res, next) {
    var params = req.allParams();
    try {
      let updated = await CategoryService.findAndUpdateCategory(params, null);
      updated.success
        ? res.ok("CATEGORY/SUB-CATEGORY UPDATED SUCCESSFULLY")
        : res.badRequest(
          updated.message ? updated.message : "ERROR WHILE UPDATING CATEGORY"
        );
    } catch (err) {
      res.serverError(err);
    }
  },

  updateSubCategoryPriority: async function (req, res, next) {
    var params = req.allParams();
    let updated = await CategoryService.findAndUpdateSubCategoryPriority(
      params,
      params.parent
    );
    try {
      updated.success
        ? res.ok("SUB CATEGORY PRIORITY UPDATED SUCCESSFULLY")
        : res.badRequest(
          updated.message ? updated.message : "ERROR WHILE UPDATING CATEGORY"
        );
    } catch (err) {
      res.serverError(err);
    }
  },
};
