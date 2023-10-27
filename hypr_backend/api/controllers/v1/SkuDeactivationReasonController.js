const {
  skuDeactivationReasonService,
} = require("../../modules/v1/SkuDeactivationReason");
const {
  constants: {
    request: {
      VERSIONING: { v1 },
    },
  },
} = require("../../constants/http");

const createSkuDeactivationReason = async (req, res) => {
  const logIdentifier = `API version: ${v1}, context:SkuDeactivationReasonController.createSkuDeactivationReason()`;
  const { reason, type } = req.body;
  const {
    userId,
  } = req;
  sails.log(
    `${logIdentifier} called with params -> ${JSON.stringify(req.body)}`,
  );
  try {
    const result =
      await skuDeactivationReasonService.createSkuDeactivationReason({
        reason,
        type,
        userId,
      });
    sails.log(
      `${logIdentifier} Sku Deactivation Successfully Created -> ${JSON.stringify(
        result,
      )}`,
    );
    res.ok(result);
  } catch (error) {
    sails.log.error(
      `${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`,
    );
    res.serverError(error);
  }
};

const getSkuDeactivationReason = async (req, res) => {
  const logIdentifier = `API version: ${v1}, context:SkuDeactivationReasonController.getSkuDeactivationReason()`;
  const { type } = req.query;
  sails.log(
    `${logIdentifier} called with params -> ${JSON.stringify(req.query)}`,
  );
  try {
    const result = await skuDeactivationReasonService.getSkuDeactivationReason({
      type,
    });
    sails.log(
      `${logIdentifier} Sku Deactivation Fetched Successfully -> ${JSON.stringify(
        result,
      )}`,
    );
    res.ok(result);
  } catch (error) {
    sails.log.error(
      `${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`,
    );
    res.serverError(error);
  }
};

const updateSkuDeactivationReason = async (req, res) => {
  const logIdentifier = `API version: ${v1}, context:SkuDeactivationReasonController.updateSkuDeactivationReason()`;
  const { id, reason, type } = req.body;
  sails.log(
    `${logIdentifier} called with params -> ${JSON.stringify(req.body)}`,
  );
  try {
    const result =
      await skuDeactivationReasonService.updateSkuDeactivationReason({
        id,
        reason,
        type,
      });
    sails.log(
      `${logIdentifier} Sku Deactivation Updated Successfully -> ${JSON.stringify(
        result,
      )}`,
    );
    res.ok(result);
  } catch (error) {
    sails.log.error(
      `${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`,
    );
    res.serverError(error);
  }
};

const deleteSkuDeactivationReason = async (req, res) => {
  const logIdentifier = `API version: ${v1}, context:SkuDeactivationReasonController.deleteSkuDeactivationReason()`;
  const { id } = req.body;
  sails.log(
    `${logIdentifier} called with params -> ${JSON.stringify(req.body)}`,
  );
  try {
    await skuDeactivationReasonService.deleteSkuDeactivationReason(id);
    sails.log(
      `${logIdentifier} Sku Deactivation Deleted Successfully`,
    );
    res.ok();
  } catch (error) {
    sails.log.error(
      `${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`,
    );
    res.serverError(error);
  }
};

module.exports = {
  createSkuDeactivationReason,
  getSkuDeactivationReason,
  updateSkuDeactivationReason,
  deleteSkuDeactivationReason,
};
