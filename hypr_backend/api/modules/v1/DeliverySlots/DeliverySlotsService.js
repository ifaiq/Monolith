const moment = require("moment");

const { dayjs } = require("../../v1/JIT/days");
const { TIMEZONES } = require("../../../services/Constants.js");

const deliverySlotsDao = require("./DeliverySlotsDao");
const deliverySlotsAuditHistoryService = require("./DeliverySlotsAuditHistoryService");
const { DELIVERY_SLOTS_DISPLAY_COUNT, DATE_FORMAT, DATE_TIME_24H } = require("./Constants");
const { currentDateTimeWithTimeOffSet } = require("../Utils/Utils");
const { getLocationByIdWithDTO } = require("../Location/LocationService");
const { getDeliveryDate } = require("../../v1/JIT/JITUtils");

const {
  errors: {
    DELIVERY_SLOT_NO_LONGER_AVAILABLE,
    DELIVERY_TIME_REQUIRED,
    NO_DELIVERY_SLOTS_AVAILABLE,
    INVALID_JIT_DELIVERY_SLOT,
  },
} = require("./Errors");

/**
 * This function takes the criteria and returns the found DeliverySlots
 *
 * @param {Object} criteria
 * @returns {Object} DeliverySlots
 */
const findDeliverySlots = async criteria =>
  await deliverySlotsDao.findByCriteria(criteria);

/**
 * This function takes the array of { DeliverySlots } and return new DeliverySlots
 *
 * @param {Array} DeliverySlots -> array of { DeliverySlots }
 * @returns {Object} DeliverySlots
 */
const createDeliverySlots = async deliverySlots => {
  if (!deliverySlots || !deliverySlots.length) {
    return [];
  }

  return await deliverySlotsDao.createEach(deliverySlots);
};

/**
 * This function takes the array of { DeliverySlots } and return updated DeliverySlots
 *
 * @param {Array} DeliverySlots -> array of { DeliverySlots }
 * @returns {Object} DeliverySlots
 */
const updateDeliverySlots = deliverySlots =>
  deliverySlots.map(deliverySlot =>
    deliverySlotsDao.update(deliverySlot.id, deliverySlot),
  );

/**
 * This function takes the Id of delivery slot and deletes it
 *
 * @param {Number} productId
 * @returns {Object} DeliverySlot
 */
const deleteDeliverySlots = async deliverySlotId =>
  await deliverySlotsDao.deleteById(deliverySlotId);

/**
 * Returns the array of { productId, deliveryTime } against every order item
 *
 * @param {Array} orderItems -> Array of { productId, jitDeliveryTime, orderItemDeliveryTime }
 * @param {Number} location
 * @param {Number} clientTimeOffset
 */
const getOrderItemsDeliveryTime = async (
  orderItems,
  location,
  customerId,
  deliverySlotsEnabled,
  calculateDaysOff,
) => {
  let deliveryTimeInMs;
  let deliverySlotAvailable = false;
  let jitDeliveryPossible = false;
  const productDeliveryTimeList = [];
  const { id: locationId, advanceBookableDays, businessUnit: { countryCode } } = location;

  validatePayloadDeliveryTime(orderItems, countryCode);

  const orderItemsTimeList = orderItems.map(
    orderItem => getProductDeliveryTimeDetails(
      orderItem,
      countryCode,
      deliverySlotsEnabled,
      calculateDaysOff,
    ),
  );
  const localStartDate = dayjs().tz(TIMEZONES[countryCode]).format(DATE_FORMAT);
  const localEndDate = moment(localStartDate).add(advanceBookableDays, "days").format(DATE_FORMAT);
  const availableDeliverySlotDates = await getAvailableDeliverySlotDates(
    locationId,
    localStartDate,
    localEndDate,
    customerId,
  );

  if (!availableDeliverySlotDates.length) {
    throw NO_DELIVERY_SLOTS_AVAILABLE();
  }

  const maxAvailableDeliverySlotDate = availableDeliverySlotDates[availableDeliverySlotDates.length - 1];
  const localCurrentDateTimeInMs = moment(orderItemsTimeList.localCurrenDateTime24H).unix() * 1000;

  orderItemsTimeList.forEach(product => {
    for (const availableDeliverySlot of availableDeliverySlotDates) {
      deliverySlotAvailable = false;
      jitDeliveryPossible = false;
      if (product.localJITDate) {
        if (product.localOrderItemDeliveryDate < availableDeliverySlot) {
          break;
        } else if (product.localOrderItemDeliveryDate > maxAvailableDeliverySlotDate) {
          deliverySlotAvailable = true;
          if (product.localOrderItemDeliveryDate >= product.localJITDate) {
            jitDeliveryPossible = true;
            deliveryTimeInMs = product.orderItemDeliveryTimeInMs;
          }
          break;
        } else if (product.localOrderItemDeliveryDate === availableDeliverySlot) {
          deliverySlotAvailable = true;
          if (product.localOrderItemDeliveryDate >= product.localJITDate) {
            jitDeliveryPossible = true;
            deliveryTimeInMs = product.orderItemDeliveryTimeInMs;
          }
          break;
        }
      } else {
        if (product.localOrderItemDeliveryDate === availableDeliverySlot) {
          deliverySlotAvailable = true;
          deliveryTimeInMs = product.orderItemDeliveryTimeInMs;
          break;
        }
      }
    }

    if (!deliverySlotAvailable) {
      throw DELIVERY_SLOT_NO_LONGER_AVAILABLE(product.localOrderItemDeliveryDate);
    } else {
      if (product.localJITDate && !jitDeliveryPossible) {
        throw INVALID_JIT_DELIVERY_SLOT(product.localOrderItemDeliveryDate, product.productId, product.localJITDate);
      }
    }

    const timeDifference = Math.ceil((deliveryTimeInMs - localCurrentDateTimeInMs) / (1000 * 60 * 60));
    const deliverySlotHrs = Math.abs(timeDifference > 0 ? timeDifference : 0);

    productDeliveryTimeList.push({
      productId: product.productId,
      deliveryTime: deliverySlotHrs,
    });
  });

  return productDeliveryTimeList;
};

const getDeliverySlotsPortal = async (locationId, clientTimeOffset) => {
  /**
   * Convert into local DateTime
   */
  const localDate =
    currentDateTimeWithTimeOffSet(clientTimeOffset).format(DATE_FORMAT);
  const incrementedDate = moment(localDate)
    .add(DELIVERY_SLOTS_DISPLAY_COUNT - 1, "days")
    .format(DATE_FORMAT);

  const query = "CALL stp_get_delivery_slots_portal ($1,$2,$3)";
  let deliverySlots = (
    await sails.getDatastore("readReplica").sendNativeQuery(query, [locationId, localDate, incrementedDate])
  ).rows[0];

  const deliverySlotsToBe = [];
  let location;
  if (deliverySlots.length < DELIVERY_SLOTS_DISPLAY_COUNT) {
    location = await getLocationByIdWithDTO(locationId);
  }
  deliverySlots = deliverySlots.map(ds => {
    ds.date = ds.date.toISOString().split("T")[0];
    ds.disabled = ds.disabled ? true : false;
    return ds;
  });
  for (let index = 0; index < DELIVERY_SLOTS_DISPLAY_COUNT; index++) {
    const nextDate = moment(localDate).add(index, "days").format(DATE_FORMAT);

    let deliverySlot = deliverySlots.find(
      slots => slots.date === nextDate,
    );
    if (!deliverySlot) {
      /** *
       * Default deliverySlots
       */
      deliverySlot = {
        locationId: +locationId,
        date: nextDate,
        cutOff: moment(nextDate).add(location.defaultCutOff, "h"),
        touchpointCapacity: 0,
        disabled: false,
        manuallyOverridden: false,
        touchpointBooked: 0,
        kgBooked: 0,
      };
    }

    deliverySlotsToBe.push(deliverySlot);
  }
  return deliverySlotsToBe;
};

/**
 * This function takes the array of delivery slots objects.
 * Updates the delivery slot if record exists, inserts otherwise.
 * Bulk upsertion for selected location only.
 *
 * @param {Array} deliverySlots
 * @param {Number} locationId
 */
const upsertDeliverySlots = async (deliverySlots, locationId, userId) => {
  const toBeUpdatedDeliverySlots = [];
  const toBeCreatedDeliverySlots = [];

  const slotDates = deliverySlots.map(deliverySlot =>
    moment(deliverySlot.date).format(DATE_FORMAT),
  );

  const findCriteria = { date: slotDates, locationId };
  const existingDeliverySlots = await findDeliverySlots(findCriteria);

  deliverySlots.forEach(newDeliverySlot => {
    const recordFound = existingDeliverySlots.find(
      existingDeliverySlot =>
        moment(existingDeliverySlot.date).format(DATE_FORMAT) ===
        moment(newDeliverySlot.date).format(DATE_FORMAT),
    );

    (recordFound ? toBeUpdatedDeliverySlots : toBeCreatedDeliverySlots).push({
      ...newDeliverySlot,
      id: recordFound?.id,
      manuallyOverridden: newDeliverySlot.disabled && !recordFound?.disabled,
      locationId,
    });
  });

  const [insertedDeliverySlots, ...updatedDeliverySlots] = await Promise.all([
    createDeliverySlots(toBeCreatedDeliverySlots),
    ...updateDeliverySlots(toBeUpdatedDeliverySlots),
  ]);

  await deliverySlotsAuditHistoryService.createAuditHistory(updatedDeliverySlots, insertedDeliverySlots, userId);
};

const getDeliverySlots = async (locationId, clientTimeOffset, customerId) => {
  const location = await getLocationByIdWithDTO(locationId);
  let currentDate = new Date(currentDateTimeWithTimeOffSet(clientTimeOffset));
  currentDate = moment(currentDate).format(DATE_FORMAT);
  const incrementedDate = moment(currentDate)
    .add(location.advanceBookableDays, "days")
    .format(DATE_FORMAT);
  const query = "CALL stp_get_delivery_slots_v1 ($1,$2,$3,$4)";
  const deliverySlots = (
    await sails.getDatastore("readReplica").sendNativeQuery(query, [
      locationId,
      currentDate,
      incrementedDate,
      customerId,
    ])
  ).rows[0].sort((deliverySlot1, deliverySlot2) => new Date(deliverySlot1.date) - new Date(deliverySlot2.date));

  return { deliverySlots };
};

const validatePayloadDeliveryTime = (orderItems, countryCode) => {
  const missingDeliveryTimeOrderItems = [];
  const localCurrenDate = dayjs().tz(TIMEZONES[countryCode]).format(DATE_FORMAT);

  for (orderItem of orderItems) {
    const localOrderItemDeliveryDate = moment.unix(orderItem.orderItemDeliveryTime / 1000).format(DATE_FORMAT);

    if (!orderItem.orderItemDeliveryTime) {
      missingDeliveryTimeOrderItems.push(orderItem.productId);
    } else if (localOrderItemDeliveryDate < localCurrenDate) {
      throw DELIVERY_SLOT_NO_LONGER_AVAILABLE(localOrderItemDeliveryDate);
    }
  }

  if (missingDeliveryTimeOrderItems && missingDeliveryTimeOrderItems.length) {
    throw DELIVERY_TIME_REQUIRED(missingDeliveryTimeOrderItems.join(", "));
  }
};

/**
 * This function returns the array of available delivery slots (YYYY-MM-DD)
 * in asc order against the provided criteria
 *
 */
const getAvailableDeliverySlotDates = async (locationId, startDate, endDate, customerId) => {
  const result = await deliverySlotsDao.getAvailableDeliverySlots(locationId, startDate, endDate, customerId);
  result.sort((slot1, slot2) => slot1.date - slot2.date);
  return result.map(availableDeliverySlot => moment(availableDeliverySlot.date).format(DATE_FORMAT));
};

const getProductDeliveryTimeDetails = (
  orderItem,
  countryCode,
  deliverySlotsEnabled,
  calculateDaysOff,
) => {
  const localCurrenDateTime24H = dayjs().tz(TIMEZONES[countryCode]).format(DATE_TIME_24H);

  const orderItemDeliveryTimeInMs = orderItem.orderItemDeliveryTime;
  const jitDeliveryTimeInMs =
    orderItem.jitDeliveryTime ? getDeliveryDate(
      orderItem.jitDeliveryTime,
      countryCode,
      deliverySlotsEnabled,
      calculateDaysOff,
    ).timeInMilliSeconds : null;

  const localOrderItemDeliveryDateTime24H =
    moment.unix(orderItemDeliveryTimeInMs / 1000).tz(TIMEZONES[countryCode]).format(DATE_TIME_24H);

  const localJITDeliveryDateTime24H =
    jitDeliveryTimeInMs ? moment.unix(jitDeliveryTimeInMs / 1000).format(DATE_TIME_24H) : null;

  const localOrderItemDeliveryDate = localOrderItemDeliveryDateTime24H.split(" ")[0];
  const localJITDate = localJITDeliveryDateTime24H ? localJITDeliveryDateTime24H.split(" ")[0] : null;
  const localCurrentDate = localCurrenDateTime24H.split(" ")[0];

  return {
    productId: orderItem.productId,
    orderItemDeliveryTimeInMs,
    jitDeliveryTimeInMs,
    localOrderItemDeliveryDateTime24H,
    localJITDeliveryDateTime24H,
    localCurrenDateTime24H,
    localOrderItemDeliveryDate,
    localJITDate,
    localCurrentDate,
  };
};

module.exports = {
  findDeliverySlots,
  createDeliverySlots,
  updateDeliverySlots,
  deleteDeliverySlots,
  getDeliverySlotsPortal,
  upsertDeliverySlots,
  getDeliverySlots,
  getOrderItemsDeliveryTime,
};
