const companyExtractionService = require("../config_service_extraction/companiesExtraction");
module.exports = {
  getCityAreas: async (req, res, next) => {
    const params = req.allParams();
    let findCriteria = { disabled: false };
    try {
      if (params.location_id) findCriteria["location_id"] = params.location_id;
      else {
        let company = (await companyExtractionService.find({
          code: Constants.COMPANIES.RETAILO,
        }))[0];
        findCriteria["company_id"] = company.id;
      }
      let city_areas = await CityAreas.find(findCriteria);
      return res.ok(city_areas);
    } catch (err) {
      res.serverError(err);
    }
  },
};
