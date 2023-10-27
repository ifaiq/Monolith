const snakecaseKeys = require("snakecase-keys");
const camelcaseKeys = require("camelcase-keys");
const fileLogIdentifier = "Extraction Service: locationBanner";

const find = async criteria => {
  const logIdentifier = `${fileLogIdentifier} Context: find`;
  try {
    return camelcaseKeys((await LocationBanners.find(snakecaseKeys(criteria))).map(banner => banner.toJSON()));
  } catch (e) {
    sails.log.error(`${logIdentifier} Error fetching LocationBanners. Error: ${JSON.stringify(e)}`);
    throw e;
  }
};

const destroy = async ids => {
  const logIdentifier = `${fileLogIdentifier} Context: destroy`;
  try {
    return camelcaseKeys((await LocationBanners.destroy({ id: ids })).map(banner => banner.toJSON()));
  } catch (e) {
    sails.log.error(`${logIdentifier} Error deleting LocationBanners. Error: ${JSON.stringify(e)}`);
    throw e;
  }
};

const create = async banner => {
  const logIdentifier = `${fileLogIdentifier} Context: create`;
  try {
    return await camelcaseKeys((await LocationBanners.create(snakecaseKeys(banner))).toJSON());
  } catch (e) {
    sails.log.error(`${logIdentifier} Error creating LocationBanner. Error: ${JSON.stringify(e)}`);
    throw e;
  }
};

const updateOne = async (id, bannerData) => {
  const logIdentifier = `${fileLogIdentifier} Context: updateOne`;
  try {
    return await camelcaseKeys((await LocationBanners.updateOne({ id }, snakecaseKeys(bannerData))).toJSON());
  } catch (e) {
    sails.log.error(`${logIdentifier} Error updating LocationBanner. Error: ${JSON.stringify(e)}`);
    throw e;
  }
};

module.exports = {
  find,
  destroy,
  create,
  updateOne,
};
