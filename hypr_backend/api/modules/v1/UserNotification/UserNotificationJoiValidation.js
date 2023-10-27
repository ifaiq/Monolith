const { Joi } = require("../../../../utils/services");

/**
 * Define validation for create notification
 * - POST api/v1/userNotification
 */

const upsertNotificationValidation = Joi.object()
  .keys({
    body: Joi.object({
      playerId: Joi.string().required().label("PlayerId"),
      version: Joi.string().required().label("Version"),
    }).unknown(true),
  });

module.exports = {
  upsertNotificationValidation,
};
