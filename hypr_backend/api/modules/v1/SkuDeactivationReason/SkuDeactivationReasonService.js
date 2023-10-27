const skuDeactivationReasonDao = require("./SkuDeactivationReasonDao");
const {
  constants: {
    request: {
      VERSIONING: { v1 },
    },
  },
} = require("../../../constants/http");
const { slugifyString } = require("../../../../utils/removeSpaces");

const createSkuDeactivationReason = async ({ reason, type, userId }) => {
  const logIdentifier = `API version: ${v1}, context:SkuDeactivationReasonService.createSkuDeactivationReason()`;
  const slug = slugifyString(reason);
  sails.log(
    `${logIdentifier} called with params -> ${JSON.stringify({
      reason,
      type,
      slug,
      userId,
    })}`,
  );
  try {
    const result = await skuDeactivationReasonDao.create({
      reason,
      type,
      slug,
      created_by: userId,
    });
    sails.log(
      `${logIdentifier} Sku Deactivation Created Successfully -> ${JSON.stringify(
        result,
      )}`,
    );
    return result;
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error)}`);
    throw new Error(error.message);
  }
};

const updateSkuDeactivationReason = async ({ id, reason, type }) => {
  const logIdentifier = `API version: ${v1}, context:SkuDeactivationReasonService.updateSkuDeactivationReason()`;
  const query = {};

  if(reason) {
    query.reason = reason;
    query.slug = slugifyString(reason);
  }

  type && (query.type = type);
  sails.log(`${logIdentifier} called with params -> ${JSON.stringify(query)}`);
  try {
    const result = await skuDeactivationReasonDao.updateOne(id, query);
    sails.log(
      `${logIdentifier} Sku Deactivation Updated Successfully -> ${JSON.stringify(
        result,
      )}`,
    );
    return result;
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error)}`);
    throw new Error(error.message);
  }
};

const deleteSkuDeactivationReason = async id => {
  const logIdentifier = `API version: ${v1}, context:SkuDeactivationReasonService.deleteSkuDeactivationReason()`;
  sails.log(`${logIdentifier} called with params -> ${JSON.stringify({ id })}`);
  try {
    const result = await skuDeactivationReasonDao.softDelete(id);
    sails.log(
      `${logIdentifier} Sku Deactivation Deleted Successfully -> ${JSON.stringify(
        result,
      )}`,
    );
    return result;
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error)}`);
    throw new Error(error.message);
  }
};

const getSkuDeactivationReason = async data => {
  const logIdentifier = `API version: ${v1}, context:SkuDeactivationReasonService.getSkuDeactivationReason()`;
  sails.log(`${logIdentifier} called with params -> ${JSON.stringify(data)}`);
  try {
    const result = await skuDeactivationReasonDao.findAll(data);
    sails.log(
      `${logIdentifier} Sku Deactivation Fetched Successfully -> ${JSON.stringify(
        result,
      )}`,
    );
    return result;
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error)}`);
    throw new Error(error.message);
  }
};

module.exports = {
  createSkuDeactivationReason,
  updateSkuDeactivationReason,
  deleteSkuDeactivationReason,
  getSkuDeactivationReason,
};
