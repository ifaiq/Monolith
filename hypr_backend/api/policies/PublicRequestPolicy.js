const AuthenticationPolicy = require("./AuthenticationPolicy");

const PUBLIC_URL_PATTERNS = [
  '/api/v1/public'
];

/**
 * Responsible to know that request is public or not
 * @param url under test
 * @returns {boolean} result
 */
const isPublicRequest = (url) => {
  for (const pattern of PUBLIC_URL_PATTERNS) {
    if (url.startsWith(pattern)) {
      return true;
    }
  }
  return false;
};

/**
 * This policy is responsible to know that either request is public or not
 * @param req from client
 * @param res to client
 * @param next function to be executed
 * @returns {Promise<void>}
 */
module.exports = async (req, res, next) => {
  try {
    const {url} = req;
    if (isPublicRequest(url)) {
      next();
    } else {
      await AuthenticationPolicy(req, res, next);
    }
  } catch (err) {
    res.badRequest(err.message);
  }
};
