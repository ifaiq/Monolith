const camelcaseKeys = require("camelcase-keys");


const create = async result => camelcaseKeys(await CashDenomination.create(result));

const findDenominationId = async id => {
  const denomination = await CashDenomination.findOne({ id });
  if (_.isEmpty(denomination)) {
    throw BATCH_NOT_FOUND();
  }
  return camelcaseKeys(deliveryBatch);
};

module.exports = {
  create,
  findDenominationId,
};
