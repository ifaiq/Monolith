const locationBannerExtractionService = require("../../../config_service_extraction/locationBannersExtraction");

/**
 * This function takes the id, location banners and return updated banner.
 *
 * @param {Number} id
 * @param {Object} location banner
 * @returns {Object} location banner
 */
const update = async (id, banner) => await locationBannerExtractionService.updateOne(id, banner);

/**
 * This function takes the location banner and return new location banner.
 *
 * @param {Object} location banner
 * @returns {Object} location banner
 */
const create = async banner => await (locationBannerExtractionService.create(banner));

/**
 * This function takes the object and return location banners.
 *
 * @param {Object{}} criteria
 * @returns {Banners[]} location banners
 */
const findLocationBanners = async criteria => await locationBannerExtractionService.find(criteria);

/**
 * This function takes the ids, and destroy banners
 *
 * @param {Array[]} ids
 * @returns {Array[]} banners
 */
const destroy = async ids => await locationBannerExtractionService.destroy(ids);

module.exports = {
  create,
  update,
  findLocationBanners,
  destroy,
};
