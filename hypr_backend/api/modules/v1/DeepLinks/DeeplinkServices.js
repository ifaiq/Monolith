const deeplinkDao = require("./DeeplinkDao");

/**
 * This function takes the order and return new order.
 *
 * @param {Object} order
 * @returns {Object} order
 */
const createDeeplinkEvent = async deeplinkParams => await deeplinkDao.create(deeplinkParams);


const deeplinkEvent = async (sessionId, source, medium, campaign, screen, categoryId, subcategoryId) => {
  const deeplinkParams = {
    session_id: sessionId,
    source,
    medium,
    campaign,
    screen,
    category_id: categoryId || null,
    subcategory_id: subcategoryId || null,
  };

  const response = await createDeeplinkEvent(deeplinkParams);
  return response;
};

module.exports =  { deeplinkEvent };
