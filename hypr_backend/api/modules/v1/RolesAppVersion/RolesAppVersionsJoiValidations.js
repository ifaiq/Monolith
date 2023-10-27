const { Joi } = require("../../../../utils/services");

/**
 * Defines Schema to perform JOI validations
 * - GET /api/v1/rolesAppVersion
 */
const createRolesAppVersionValidation = Joi.object().keys({
  body: Joi.object({
    role_id: Joi.number().integer().positive().required(),
    os: Joi.string().valid("android", "ios").required(),
    minimum_version: Joi.string().required(),
    general_app_version: Joi.number().integer().positive().required(),
  }).unknown(true),
});

const deleteRolesAppVersionValidation = Joi.object().keys({
  body: Joi.object({
    id: Joi.number().integer().positive().required(),
  }).unknown(true),
});

const updateRolesAppVersionValidation = Joi.object().keys({
  body: Joi.object({
    id: Joi.number().integer().positive().required(),
    os: Joi.string().valid("android", "ios"),
    role_id: Joi.number().integer().positive(),
    minimum_version: Joi.string(),
    general_app_version: Joi.number().integer().positive(),
  }).unknown(true),
});

module.exports = {
  createRolesAppVersionValidation,
  deleteRolesAppVersionValidation,
  updateRolesAppVersionValidation,
};
