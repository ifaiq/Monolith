const { Joi } = require("../../../../utils/services");
const { LANGUAGES } = require("./Constants");
const {
  errors: {
    INVALID_LANGUAGE_SELECTION,
    TAX_ID_SHOULD_BE_15_CH,
  },
} = require("./Errors");

const signUpValidation = Joi.object()
  .keys({
    body: Joi.object({
      phone: Joi.string().strict().label("Phone").required(),
      name: Joi.string().strict().label("Name"), // need to remove required to support hisaab app signups
      taxId: Joi.number().integer().positive().custom(number => {
        if (String(number).length !== 15) {
          throw new Error(TAX_ID_SHOULD_BE_15_CH().message);
        }
        return number;
      }).strict(),
      customer: Joi.object({
        language: Joi.string().strict().custom(language => {
          const isValidValue =
            Object.prototype.hasOwnProperty.call(LANGUAGES, language);
          if (!isValidValue) {
            throw new Error(INVALID_LANGUAGE_SELECTION().message);
          }
          return language;
        }).strict().required(),
      }).unknown(true),
    }).unknown(true),
  });

const signInValidation = Joi.object()
  .keys({
    body: Joi.object({
      username: Joi.string().strict().label("Username").required().pattern(/^[0-9]+$/),
      password: Joi.string().strict().label("Password").required(),
    }).unknown(true),
  });

const forgotPasswordValidation = Joi.object()
  .keys({
    body: Joi.object({
      username: Joi.string().strict().label("Username").required(),
    }).unknown(true),
  });

const customerByPhoneValidation = Joi.object()
  .keys({
    query: Joi.object({
      phone: Joi.string().strict(), // have to keep it optional since we are catering to two different use cases now
    }).unknown(true),
  });

const customerProfileUpdateValidation = Joi.object()
  .keys({
    body: Joi.object({
      // TODO: needs to be uncommented once app side changes are finalized
      // phone: Joi.string().strict().label("Phone").required(),
      // name: Joi.string().strict().label("Name").required(),
      language: Joi.string().strict().custom(language => {
        const isValidValue =
          Object.prototype.hasOwnProperty.call(LANGUAGES, language);
        if (!isValidValue) {
          throw new Error(INVALID_LANGUAGE_SELECTION().message);
        }
        return language;
      }).strict(),
      taxId: Joi.number().integer().positive().custom(number => {
        if (String(number).length !== 15) {
          throw new Error(TAX_ID_SHOULD_BE_15_CH().message);
        }
        return number;
      }).strict(),
    }).unknown(true),
  });

const signOutValidation = Joi.object()
  .keys({
    body: Joi.object({
      playerId: Joi.string().strict().label("PlayerId"), // have to keep it optional
    }).unknown(true),
  });

const generateCustomerProfileValidation = Joi.object()
  .keys({
    body: Joi.object({
      answers: Joi.array().items(
        Joi.object({
          questionid: Joi.number().integer().positive().strict().required(),
          questioninenglish: Joi.string().strict().required(),
          answertype: Joi.string().strict().required(),
        }).unknown(true),
      ),
    }).unknown(true),
  });

const getCustomerIdFromPhoneValidation = Joi.object()
  .keys({
    query: Joi.object({
      phone: Joi.string().strict().required().pattern(/^[0-9]+$/),
    }).unknown(true),
  });

const sendSignupEmailValidation = Joi.object()
  .keys({
    body: Joi.object({
      customer: Joi.object().required(),
      company: Joi.object().required(),
      hisaab: Joi.boolean(),
    }).unknown(true),
  });

const sendOTPValidation = Joi.object()
  .keys({
    body: Joi.object({
      customerId: Joi.number().positive().strict().required(),
      resend: Joi.boolean(),
    }).unknown(true),
  });
const verifyOTPValidation = Joi.object()
  .keys({
    body: Joi.object({
      customerId: Joi.number().positive().strict().required(),
      otpCode: Joi.string().strict().required(),
    }).unknown(true),
  });

module.exports = {
  signUpValidation,
  signInValidation,
  forgotPasswordValidation,
  customerByPhoneValidation,
  customerProfileUpdateValidation,
  signOutValidation,
  generateCustomerProfileValidation,
  getCustomerIdFromPhoneValidation,
  sendSignupEmailValidation,
  sendOTPValidation,
  verifyOTPValidation,
};
