/**
 * This file is responsible for communication between service
 * and database table users.
 */
const {
  errors: {
    USER_ALREADY_EXIST_WITH_SAME_NUMBER,
  },
} = require("./Errors");

const userExtractionService = require("../../../user_service_extraction/userService");

/**
 * This method verifies that user does not exist with same number
 * If exists, it will throw exception USER_ALREADY_EXIST_WITH_SAME_NUMBER
 * @param phone to be checked
 * @returns {Promise<void>} nothing
 */
const verifyUserNotExistWithSamePhone = async phone => {
  try {
    // since users can have same numbers,
    // we only need to check if there is even a single record against the phone customer trying to sign up with
    const user = await userExtractionService.getAll({ phone, limit: 1 });
    if (user.length > 0) {
      throw USER_ALREADY_EXIST_WITH_SAME_NUMBER();
    }
  } catch (err) {
    throw err;
  }
};

const findAll = async (criteria, attributesSelection) => User.find(criteria).select(attributesSelection);
const findOne = async (criteria, attributesSelection) => User.findOne(criteria).select(attributesSelection);
const update = async (criteria, params) => User.update(criteria, params);
const create = async params => User.create(params);

module.exports = {
  verifyUserNotExistWithSamePhone,
  findAll,
  findOne,
  update,
  create,
};
