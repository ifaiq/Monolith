/**
*
* @param {string} name
*/
const fetchAppVersion = async ({name, os}) => {
  const appVersion = await AppVersion.find({ name, os }).limit(1);
  return appVersion[0];
};
module.exports = {
  fetchAppVersion,
};
