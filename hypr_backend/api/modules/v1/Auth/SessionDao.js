/**
 * This file is responsible for communication between service
 * and database table sessions.
 */

const { errors: { SESSION_NOT_FOUND } } = require("./Errors");

/**
 * This method is responsible to delete session by sessionUuId
 * @param sessionUuId to be deleted
 * @returns {Promise<*>} nothing
 */
const deleteSessionBySessionUuId = async sessionUuId => await Sessions.destroy({session_uuid: sessionUuId});

/**
 * This method is responsible to delete session by customerId
 * @param customerId whom session to be deleted
 * @returns {Promise<*>} nothing
 */
const deleteSessionByCustomerId = async customerId => await Sessions.destroy({customer_id: customerId});

/**
 * This method is responsible to find a session by session_uuid
 * @param sessionUuId to be found
 * @returns session if found else throw exception
 */
const findSessionBySessionUuIdChecked = async sessionUuId => {
  const session = await Sessions.findOne({session_uuid: sessionUuId});

  if(_.isEmpty(session)) {
    throw SESSION_NOT_FOUND;
  }
  return session;
};

module.exports = {
  deleteSessionBySessionUuId,
  deleteSessionByCustomerId,
  findSessionBySessionUuIdChecked,
};
