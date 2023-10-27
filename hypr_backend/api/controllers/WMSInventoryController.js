// WMS INVENTORY CONTROLLER
const { findByIdempotencyKey } = require("../modules/v1/Idempotency");
const { syncProductsQuantityWMS, validateProductQuantityWMS } = require("../services/WMSService");

module.exports = {
  /**
   * controller to bulk update physical stock - products
   * @param {*} req
   * @param {*} res
   * @param {*} next
   * @returns {Promise<{}>}
   */

  // NOTE: we will use this data migration code later in the future
  updateInventoryWMS: async function (req, res, next) {
    sails.log(`Update inventory wms called with params: ${JSON.stringify(req.body)}`);
    const { idempotency_key } = req.body;
    try {
      let result = await findByIdempotencyKey(idempotency_key);
      if (result) {
        if (result.statusCode === 200) {
          result = JSON.parse(result.response);
          result.message = 'Inventory already updated for this Idempotency key';
          return res.ok(result);
        }
        result = {...result, data:JSON.parse(result.response)}; //data property is required for error middleware
        return res.error(result);
      }
      result = await syncProductsQuantityWMS(req.body);
      return res.ok(result);
    } catch (error) {
      sails.log.error(`ERR: Update inventory wms called error: ${JSON.stringify(error)}`);
      res.error(error);
    }
  },

  validateProductInventoryWMS: async function (req, res, next) {
    const { products, warehouseId } = req.body;
    sails.log(`Validate inventory wms called with params: ${JSON.stringify(products)}`);
    try {
      const result = await validateProductQuantityWMS(products, warehouseId);
      return res.ok(result);
    } catch (error) {
      sails.log.error(`ERR: Update inventory wms called error: ${JSON.stringify(error)}`);
      res.error(error);
    }
  },
};
