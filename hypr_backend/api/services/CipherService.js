var bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
const RedisService = require("../services/RedisService");
const { jwtSettings } = require('../../config/passport');

module.exports = {
  secret: jwtSettings.secret,
  issuer: jwtSettings.issuer,
  audience: jwtSettings.audience,

  /**
   * Hash the password field of the passed user.
   */
  hashPassword: async function (password) {
    if (password) {
      const salt = await bcrypt.genSalt(10);
      return await bcrypt.hash(password.toString(), salt);
    }
  },

  /**
   * Compare user password hash with unhashed password
   * @returns boolean indicating a match
   */
  comparePassword: function (password, user) {
    return bcrypt.compareSync(password, user.password);
  },

  comparePinCode: function (password, user) {
    return bcrypt.compareSync(password, user.pin_code);
  },

  /**
   * Create a token based on the passed user
   * @param user
   */
  createToken: function (user, isRegenerate) {
    let _user = user;
    if (
      _user.location_id &&
      typeof _user.location_id === "object" &&
      _user.location_id.hasOwnProperty("id")
    ) {
      _user.location_id = _user.location_id.id;
    }
    if (isRegenerate) {
      if (_user.hasOwnProperty("aud")) {
        delete _user.aud;
      }
      if (_user.hasOwnProperty("iss")) {
        delete _user.iss;
      }
      if (_user.hasOwnProperty("iat")) {
        delete _user.iat;
      }
    }
    if (_user.pin_code) delete _user.pin_code;
    if (_user.password) delete _user.password;
    // else {
    //   _user = _user.toJSON();
    // }
    return jwt.sign(_user, jwtSettings.secret, {
      algorithm: jwtSettings.algorithm,
      // expiresIn: sails.config.jwtSettings.expiresIn,
      issuer: jwtSettings.issuer,
      audience: jwtSettings.audience,
    });
  },
  verifyToken: async function (token) {
    let response = await new Promise(async (resolve, reject) => {
      jwt.verify(
        token,
        jwtSettings.secret,
        {
          algorithm: jwtSettings.algorithm,
          // expiresIn: sails.config.jwtSettings.expiresIn,
          issuer: jwtSettings.issuer,
          audience: jwtSettings.audience,
        },
        function (err, decoded) {
          if (err) reject();
          else resolve(decoded);
        }
      );
    });

    return response;
  },
};
