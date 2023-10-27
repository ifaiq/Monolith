/**
 * This function changes the format of a date object and returns date
 *
 * @param {Object} date
 * @returns {*} date
 */
function getISODateWithoutTimezone(date) {
  const options = {
    year: "numeric",
    month: "2-digit",
    day: "numeric",
  };
  return date.toLocaleDateString("en-CA", options);
}

module.exports = {
  getISODateWithoutTimezone,
};
