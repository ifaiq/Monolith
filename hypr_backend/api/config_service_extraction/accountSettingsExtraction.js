const fileLogIdentifier = "Extraction Service: Account Settings";

const find = async (criteria, sortClause = null) => {
  const logIdentifier = `${fileLogIdentifier} Context: find`;
  try {
    return sortClause ? await AccountSettings.find(criteria).sort(sortClause) : await AccountSettings.find(criteria);
  } catch (e) {
    sails.log.error(`${logIdentifier} Error fetching AccountSettings. Error: ${JSON.stringify(e)}`);
    throw e;
  }
};

const findOne = async criteria => {
  const logIdentifier = `${fileLogIdentifier} Context: findOne`;
  try {
    return await AccountSettings.findOne(criteria);
  } catch (e) {
    sails.log.error(`${logIdentifier} Error finding one AccountSetting. Error: ${JSON.stringify(e)}`);
    throw e;
  }
};


module.exports = {
  find,
  findOne,
};
