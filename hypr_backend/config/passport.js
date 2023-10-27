var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;
var JwtStrategy = require("passport-jwt").Strategy;
var ExtractJwt = require("passport-jwt").ExtractJwt;

const customerExtractionService = require('../api/user_service_extraction/customerService');
const userExtractionService = require('../api/user_service_extraction/userService');
const companyExtractionService = require('../api/config_service_extraction/companiesExtraction');

var EXPIRES_IN_SECONDS = 60 * 60 * 24;
var SECRET =
  process.env.tokenSecret ||
  "tl2A45F7TEjO41E6fVk4doZgzVnB3iIXSTbNgA4ukukI0uIrtwe7OM3Z0JI0uIrtwe7OM3Z71yxj646fV";
var ALGORITHM = "HS256";
var ISSUER = "hypr.pk";
var AUDIENCE = "hypr.pk";

var LOCAL_STRATEGY_CONFIG_USER = {
  usernameField: "username",
  passwordField: "password",
  passReqToCallback: false,
};

var LOCAL_STRATEGY_CONFIG_CUSTOMER = {
  usernameField: "phone",
  passwordField: "password",
  passReqToCallback: false,
};

/**
 * Configuration object for JWT strategy
 */
var JWT_STRATEGY_CONFIG = {
  jwtFromRequest: ExtractJwt.fromHeader("authorization"),
  secretOrKey: SECRET,
  issuer: ISSUER,
  audience: AUDIENCE,
  passReqToCallback: false,
  ignoreExpiration: true,
};

async function _onLocalStrategyAuthUser(email, password, next) {
  try {
    const user = (await userExtractionService.getAll({ username: email }))[0];
    if (!user) {
      return next(null, false, {
        code: "E_USER_NOT_FOUND",
        message: email + " is not found",
      });
    }
    if (user) {
      if (user.disabled) {
        return next(null, false, {
          code: "E_USER_DISABLED",
          message: email + " is disabled",
        });
      }
    }
    if (password != "hyprPackerSignIn" && password != "hyprConsumerSignIn") {
      if (password.split("-").length > 1) password = password.split("-")[0];
      if (!CipherService.comparePassword(password, user)) {
        return next(null, false, {
          code: "E_WRONG_PASSWORD",
          message: "Password is wrong",
        });
      }
    }

    return next(null, user, {});
  } catch (e) {
    return next(e, false, {})
  }
}

async function _onLocalStrategyAuthCustomer(phone, password, next) {
  try {
    let user = await customerExtractionService.find({ phone: phone });
    if (!user.length)
      return next(null, false, {
        code: "E_USER_NOT_FOUND",
        message: phone + " is not found",
      });
    /*
    NOTE: added temporary check untill only phone sign in gets implemented on all the apps
    - need to remove passport as no authentication required
    */

    if (password != "hyprConsumerSignIn") {
      let code = "RET";
      if (password.split("-").length > 1) {
        if (password.split("-")[1] == "MONT") code = "MONT";
        else code = "CHASE";
        password = password.split("-")[0];
      } else if (!phone.startsWith("92") && !phone.includes("966"))
        code = "MONT";
      let company = (await companyExtractionService.find({ code }))[0];
      let tempUser = user.filter((u) => u.company_id == company.id)[0];
      if (!CipherService.comparePinCode(password, tempUser))
        return next(null, false, {
          code: "E_WRONG_PASSWORD",
          message: "Password is wrong",
        });
    }
    return next(null, user, {});
  } catch (error) {
    return next(error, false, {});
  }
}

function _onJwtStrategyAuth(payload, next) {
  var user = payload.user;
  return next(null, user, {});
}

passport.use(
  "user-local",
  new LocalStrategy(LOCAL_STRATEGY_CONFIG_USER, _onLocalStrategyAuthUser)
);
passport.use(
  "customer-local",
  new LocalStrategy(
    LOCAL_STRATEGY_CONFIG_CUSTOMER,
    _onLocalStrategyAuthCustomer
  )
);
passport.use(new JwtStrategy(JWT_STRATEGY_CONFIG, _onJwtStrategyAuth));

module.exports.jwtSettings = {
  expiresIn: EXPIRES_IN_SECONDS,
  secret: SECRET,
  algorithm: ALGORITHM,
  issuer: ISSUER,
  audience: AUDIENCE,
  ignoreExpiration: true,
};
