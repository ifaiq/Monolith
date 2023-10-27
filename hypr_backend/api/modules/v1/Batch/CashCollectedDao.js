const camelcaseKeys = require("camelcase-keys");

const create = async result => camelcaseKeys(await CashCollected.create(result));

const findCashId = async batch_id => {
  const deliveryBatch = await CashCollected.find({ batch_id  });
  if (_.isEmpty(deliveryBatch)) {
    throw "Cash Collection not found";
  }
  return camelcaseKeys(deliveryBatch);
};

module.exports = {
  create,
  findCashId,
};
