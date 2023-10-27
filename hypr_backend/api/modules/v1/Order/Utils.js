const { ORDER_STATES, ORDER_STATUS_REASONS } = require("./Constants");
const ejs = require("ejs");

/**
 * method to return validated statusId against order
 * @param {Number} statusId
 * @returns {Boolean}
 */
const validateOrderStatusId = statusId => Object.keys(ORDER_STATES).find(key => ORDER_STATES[key] === statusId);

/**
 * method to return validated statusReasonId against order
 * @param {Number} statusReasonId
 * @returns {Boolean}
 */
const validateOrderStatusReason = statusReasonId =>
  Object.keys(ORDER_STATUS_REASONS).find(
    key => ORDER_STATUS_REASONS[key] === statusReasonId,
  );

/**
 * method to return currentDate with custom hours
 * @param {Number} hour
 * @param {Number} min
 * @param {Number} sec
 * @param {Number} ms
 * @returns {Date} currentDate
 */

const getCurrentDateWithCustomHours = (hour = 23, min = 59, sec = 59, ms = 59) => {
  const currentDate = new Date();
  currentDate.setDate(new Date().getDate());
  return currentDate.setHours(hour, min, sec, ms);
};

/**
 * method takes order information and returns email body as an HTML string
 *
 * @param {Object} orderInfoForEmail
 * @returns {String} emailBodyHtml
 */
const renderOrderPlacementEmail = orderInfoForEmail => new Promise((resolve, reject) => {
  ejs.renderFile(
    __dirname + "/../../../templates/order_placed.ejs",
    orderInfoForEmail,
    {},
    (err, emailBodyHtml) => {
      if (err) {
        reject(err);
      } else {
        resolve(emailBodyHtml);
      }
    },
  );
});

module.exports = {
  validateOrderStatusId,
  validateOrderStatusReason,
  getCurrentDateWithCustomHours,
  renderOrderPlacementEmail,
};
