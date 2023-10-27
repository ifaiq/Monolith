const jwt = require("jsonwebtoken");
const {jwtSettings} = require("../../../../config/passport");
const {
  algorithm,
  secret,
  issuer,
  audience,
} = jwtSettings;

const tokenSignature = {algorithm, issuer, audience};

/**
 * Responsible to handle response from jwt.verify
 * @param err if token is not verified
 * @param decoded information stored in token
 * @returns {{data: *, isValid: boolean}|{isValid: boolean, message: *}}
 */
const verifyTokenCallback = (err, decoded) => {
  if (err) {
    return {isNotValid: true, message: err.message};
  }
  return {isNotValid: false, tokenInfo: decoded};
};

/**
 * Responsible to verify the token
 * @param token to be verified
 * @returns {Promise<*>}
 */
const verifyToken = async token => await jwt.verify(token, secret, tokenSignature, verifyTokenCallback);

module.exports = {verifyToken};
