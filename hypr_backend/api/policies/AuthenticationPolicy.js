/**
 * This policy is responsible to verify that token exists in the request
 * and is a valid token
 */
const {
  errors: {
    TOKEN_ERROR
  }
} = require("../modules/v1/Auth/Errors");

const {
  constants: {
    request: {
      HEADER: {
        AUTH: {AUTHORIZATION},
      }
    }
  },
} = require('../constants/http');

const {verifyToken} = require("../modules/v1/Auth/CipherService");

const {findSessionBySessionUuIdChecked} = require("../modules/v1/Auth/SessionDao");

module.exports = async (req, res, next) => {

  const accessToken = req.header(AUTHORIZATION);

  if (_.isEmpty(accessToken) || accessToken.length < 800) {
    throw TOKEN_ERROR();
  }

  const tokenFeedback = await verifyToken(accessToken);

  if (tokenFeedback.isNotValid) {
    throw TOKEN_ERROR();
  }

  const {tokenInfo} = tokenFeedback;

  if (_.isEmpty(tokenInfo.session_uuid)) {
    throw TOKEN_ERROR();
  }

  await findSessionBySessionUuIdChecked(tokenInfo.session_uuid);

  //TODO: Invoke authorized policy
};
