const { validate } = require('../../utils/services');
const productValidation = require('../modules/v1/Product/ProductJoiValidations');
const { findShopByCustomerId } = require("../modules/v1/Auth/CustomerShopDao");
const {
    getStoresForLocation
} = require("../services/LocationService");
const {
    findCompanyByCodeChecked
} = require("../modules/v1/Auth/CompanyDao");
const {
    constants: { COMPANY_CODE }
} = require('../modules/v1/Auth/Constants');
/**
 * Validates params from the request object using JOI validations 
 * 
 * @param {Object} req 
 * @param {Object} res 
 * @param {Function} next 
 */
module.exports = async (req, res, next) => {
    try {
        const schema = req.options.validate;
        await validate(productValidation[schema], req);
        /**
         * The if statement is added for the specific validation because now I am adding
         * location for only some specific routes
         * It will handle in tech debt.
         * TODO
         * this check will be removed from here.
         */
        if (schema === 'getLikeProductsValidation') {
            const { query: { customerId, locationId } } = req;
            const {id:companyId} = await findCompanyByCodeChecked(COMPANY_CODE);

            // If locationId is provided in query parmas, we need not make  service calls
            if (locationId) {
              req.user.location = { location_id: locationId };
            } else {
              const customerShop = await findShopByCustomerId(customerId);
              if (customerShop) {
                let coords = JSON.parse(customerShop.shop_location);
                let locations = await getStoresForLocation(
                  "",
                  {
                    lat: coords.latitude,
                    lng: coords.longitude,
                  },
                  companyId
                );
                if (locations && locations.length > 0) {
                  req.user.location = locations[0];
                }
              }
            }

        }
        next();
    }
    catch (err) {
        res.badRequest(err.message);
    }
};
