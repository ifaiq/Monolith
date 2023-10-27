const { Joi: JoiImport, JoiDate } = require("../../../../utils/services");
const Joi = JoiImport.extend(JoiDate);
const { DATE_FORMAT, DATE_TIME_24H } = require("./Constants");

const getDeliverySlotsValidation = Joi.object()
  .keys({
    query: Joi.object({
      locationId: Joi.number().integer().positive().required(),
    }).unknown(true),
  });

const upsertDeliverySlotsForPortal = Joi.object().keys({
  body: Joi.object({
    deliverySlots: Joi.array()
      .min(1)
      .items(
        Joi.object({
          date: Joi.date()
            .format(DATE_FORMAT)
            .options({ convert: true })
            .required(),
          cutOff: Joi.date()
            .format(DATE_TIME_24H)
            .options({ convert: true })
            .required(),
          touchpointCapacity: Joi.number().integer().min(0).strict().required(),
          disabled: Joi.boolean().default("false"),
        })
          .unknown(true),
      )
      .strict()
      .required(),
    locationId: Joi.number().integer().min(1).strict().required(),
  }).unknown(true),
});

module.exports = {
  getDeliverySlotsValidation,
  upsertDeliverySlotsForPortal,
};
