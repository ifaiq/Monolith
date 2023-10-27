const camelcaseKeys = require("camelcase-keys");

const create = async result => camelcaseKeys(await NonCashClosing.create(result));

const createEach = async result => camelcaseKeys(await NonCashClosing.createEach(result));

const findnonCashId = async batch_id => {
  const deliveryBatch = await NonCashClosing.find({ batch_id });
  // if (_.isEmpty(deliveryBatch)) {
  //   throw "Non Cash Closing not FOUND";
  // }
  return camelcaseKeys(deliveryBatch);
};
const update = async (id, attachment, connection = null) => {
  let updatePromise = NonCashClosing.update({ id }, camelcaseKeys(attachment, { deep: true }));
  if (connection) {
    updatePromise = updatePromise.usingConnection(connection);
  }
  return await updatePromise;
};

module.exports = {
  createEach,
  create,
  findnonCashId,
  update,
};
