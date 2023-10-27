const skuDeactivationReasonJunctionDao = require("./SkuDeactivationReasonJunctionDao");
const {
  constants: {
    request: {
      VERSIONING: { v1 },
    },
  },
} = require("../../../constants/http");
const { slugifyString } = require("../../../../utils/removeSpaces");

const createSkuDeactivationRecord = async ({
  productId,
  reason,
  isDeactivated,
  userId,
}) => {
  const logIdentifier = `API version:${v1}, context:skuDeactivationReasonJunctionService.createSkuDeactivationRecord()`;
  const slug = slugifyString(reason);
  sails.log(
    `${logIdentifier} called with params -> ${JSON.stringify({
      productId,
      reason,
      slug,
      isDeactivated,
      userId,
    })}`,
  );
  try {
    const result = await skuDeactivationReasonJunctionDao.create({
      product_id: productId,
      reason,
      slug,
      is_deactivated: isDeactivated,
      created_by: userId,
    });
    sails.log(
      `${logIdentifier} Sku Deactivation Junction Data Created Successfully -> ${JSON.stringify(
        result,
      )}`,
    );
    return result;
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error)}`);
    throw new Error(error.message);
  }
};

const findLatestReasonOfProduct = async productId => {
  const logIdentifier = `API version:${v1}, context:skuDeactivationReasonJunctionService.findLatestReasonOfProduct()`;
  const criteria = { product_id: productId };
  sails.log(
    `${logIdentifier} called with params -> ${JSON.stringify({
      productId,
    })}`,
  );
  try {
    const result = await skuDeactivationReasonJunctionDao.findLatest(criteria);
    sails.log(
      `${logIdentifier} Sku Deactivation Junction Data Fetched Successfully -> ${JSON.stringify(
        result,
      )}`,
    );
    return result;
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error)}`);
    throw new Error(error.message);
  }
};

module.exports = { createSkuDeactivationRecord, findLatestReasonOfProduct };
