/**
 Copyright © 2021 Retailo, Inc.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */
const { currentDateTimeWithTimeOffSet } = require("../Utils/Utils");
/**
 * function determines if coupon is enabled
 */
const isCouponEnabled = coupon => !coupon.disabled;

/**
 * function determines if coupon is valid for a selected location
 */
const isCouponValidForLocation = (coupon, locationId) => coupon.locationId === locationId;

/**
 * function determines if coupon is passed it's expiration date
 */
const isCouponExpired = (coupon, clientTimeOffset) => {
  const currentDate =  currentDateTimeWithTimeOffSet(clientTimeOffset);
  const isExpired = !currentDate.isBefore(
    (new Date(coupon.endDate)).setDate((new Date(coupon.endDate)).getDate() + 1),
  ); // Add 1 day to date so coupon is valid for current date
  return isExpired;
};

/**
 * Function determines if coupon hasn't started yet
 */
const isCouponStarted = (coupon, clientTimeOffset) => {
  const currentDate = currentDateTimeWithTimeOffSet(clientTimeOffset);
  return currentDate.isAfter(new Date(coupon.startDate));
};

/**
 * Function determines if a coupon is with in its usage limits
 * @param {Object} coupon
 * @returns {Boolean}
 */
const isCouponWithinUsageLimits = coupon => coupon.numberOfTimesUsed < coupon.maxUsagePerCustomer;

/**
 * Function determines if only a single coupon with a particular name is valid
 */
const validateCoupons = (coupons, locationId, clientTimeOffset) =>
  // TODO see if there are more usecases for this
  coupons.map(coupon => ({
    isExpired: isCouponExpired(coupon, clientTimeOffset),
    isEnabled: isCouponEnabled(coupon),
    isStarted: isCouponStarted(coupon, clientTimeOffset),
    isValidForLocation: isCouponValidForLocation(coupon, locationId),
    coupon: coupon,
  }));

/**
 * Function determines if the user trying to apply coupon is allowed for the particular coupon or not
 */
const isCouponValidForUserType = (coupon, role) => {
  const couponValidUserTypes = JSON.parse(coupon.userType);
  return couponValidUserTypes.includes(role);
};

module.exports = {
  isCouponWithinUsageLimits,
  validateCoupons,
  isCouponValidForUserType,
  currentDateTimeWithTimeOffSet,
};
