// Auth Library Import
const { verifyServiceToken } = require('@development-team20/auth-library/dist');

module.exports = async function(req, res, next) {
  const token = req.header("Authorization");
  if (!token) return res.unauthorized(null);
  try {
    await verifyServiceToken(token);
    sails.log.info("Token verified successfully!");
    next();
  } catch (err) {
    sails.log.error("Invalid token", err);
    return res.unauthorized(null);
  }
};
