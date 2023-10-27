const { Joi } = require("../../../../utils/services");

const getLocationValidation = Joi.object()
  .keys({
    params: {
      id: Joi.number().integer().min(1).required(),
    },
  });

const getBannersValidation = Joi.object()
  .keys({
    params: {
      id: Joi.string().pattern(/^[0-9]/).required(),
    },
  });
const putBannersValidation = Joi.object()
  .keys({
    body: Joi.object({
      banners: Joi.array().items(
        Joi.object({
          id: Joi.number().integer().positive().strict(),
          image: Joi.string().strict().required(),
          /**
                     * added locationId to keep request/response structure same
                     * otherwise we have to iterate through items to add locationId from param
                     * while creating a new object in the database
                     */
          // TODO: add dynamic validator if required
          locationId: Joi.number().integer().positive().strict().required(),
          disabled: Joi.boolean().strict(),
        }).unknown(true),
      ),
    }).unknown(true),
    params: {
      id: Joi.string().pattern(/^[0-9]/).required(),
    },
  });
const removeBannersValidation = Joi.object()
  .keys({
    body: Joi.object({
      banners: Joi.array().items(Joi.number().integer().positive().strict().required()).required(),
    }).unknown(true),
    params: {
      id: Joi.string().pattern(/^[0-9]/).required(),
    },
  });

const getLocationsByBusinessUnitValidation = Joi.object()
  .keys({
    params: {
      businessUnitId: Joi.string().pattern(/^[0-9]+$/),
    },
  });

module.exports = {
  getLocationValidation,
  getBannersValidation,
  putBannersValidation,
  removeBannersValidation,
  getLocationsByBusinessUnitValidation,
};
