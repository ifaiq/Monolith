/* eslint-disable max-len */
const moment = require("moment");

const DATE_FORMAT = "YYYY-MM-DD";
const DATE_TIME_24H_FORMAT = "YYYY-MM-DD HH:mm:ss";
const DATE_TIME_24_HOUR_TIMEZONE = "YYYY-MM-DDTHH:mm:ss";

const currentDateTimeUTC = new Date();
const timezoneOffset = currentDateTimeUTC.getTimezoneOffset();
const currentSystemDateTime = (
  timezoneOffset < 0
    ? moment(currentDateTimeUTC).add(timezoneOffset, "m")
    : moment(currentDateTimeUTC).subtract(timezoneOffset, "m")
).format(DATE_TIME_24H_FORMAT);

const currentSystemDate = moment(currentSystemDateTime).format(DATE_FORMAT);
// console.log("system date time", currentSystemDateTime); // prints locale/system date time

const expiredDeliverySlot = {
  date: moment(currentSystemDate).add(3, "day").format(DATE_FORMAT),
  cutOff: moment(currentSystemDateTime)
    .subtract(1, "hour")
    .format(DATE_TIME_24H_FORMAT),
  touchpointCapacity: 4100,
  disabled: false,
  touchpointBooked: 11,
};

const disabledDeliverySlot = {
  date: moment(currentSystemDate).add(4, "day").format(DATE_FORMAT),
  cutOff: moment(currentSystemDateTime)
    .add(1, "hour")
    .format(DATE_TIME_24H_FORMAT),
  touchpointCapacity: 4100,
  disabled: true,
  touchpointBooked: 11,
};

// DS dates: current date to current date + 2 days
const activeEnabledDeliverySlots = [
  {
    date: currentSystemDate,
    cutOff: moment(currentSystemDateTime)
      .add(6, "hours")
      .format(DATE_TIME_24H_FORMAT),
    touchpointCapacity: 101,
    disabled: false,
    touchpointBooked: 0,
  },
];

const deliverySlots = [
  expiredDeliverySlot,
  disabledDeliverySlot,
  ...activeEnabledDeliverySlots,
];

// only active delivery slots are shown to the consumer
const getActiveDeliverySlotsForConsumer = activeEnabledDeliverySlots.map(
  activeDeliverySlot => ({
    date: activeDeliverySlot.date.toString().concat("T00:00:00.000Z"),
  }),
);

const expectedCreatedDeliverySlotsLogs = [
  {
    id: 1,
    delivery_slot_id: 1,
    action: "INSERTED",
    performed_by: 160,
    date: moment(currentSystemDate)
      .add(3, "day")
      .format(DATE_FORMAT)
      .concat("T00:00:00.000Z"),
    cut_off: moment(currentSystemDateTime)
      .subtract(1, "hour")
      .format(DATE_TIME_24_HOUR_TIMEZONE)
      .concat(".000Z"),
    touchpoint_capacity: 4100,
    disabled: 0,
    manually_overridden: 0,
    location_id: 194,
    deleted_at: null,
  },
  {
    id: 2,
    delivery_slot_id: 2,
    action: "INSERTED",
    performed_by: 160,
    date: moment(currentSystemDate)
      .add(4, "day")
      .format(DATE_FORMAT)
      .concat("T00:00:00.000Z"),
    cut_off: moment(currentSystemDateTime)
      .add(1, "hour")
      .format(DATE_TIME_24_HOUR_TIMEZONE)
      .concat(".000Z"),
    touchpoint_capacity: 4100,
    disabled: 1,
    manually_overridden: 1,
    location_id: 194,
    deleted_at: null,
  },
  {
    id: 3,
    delivery_slot_id: 3,
    action: "INSERTED",
    performed_by: 160,
    date: currentSystemDate.concat("T00:00:00.000Z"),
    cut_off: moment(currentSystemDateTime)
      .add(6, "hours")
      .format(DATE_TIME_24_HOUR_TIMEZONE)
      .concat(".000Z"),
    touchpoint_capacity: 101,
    disabled: 0,
    manually_overridden: 0,
    location_id: 194,
    deleted_at: null,
  },
];

// ----------------------------- start - test data for upsert case --------------------------------------------------

// create new delivery slots
const createDeliverySlots = [
  {
    date: currentSystemDate,
    cutOff: moment(currentSystemDateTime)
      .add(6, "hours")
      .format(DATE_TIME_24H_FORMAT),
    touchpointCapacity: 101,
    disabled: false,
  },
  {
    date: moment(currentSystemDate).add(1, "day").format(DATE_FORMAT),
    cutOff: moment(currentSystemDateTime)
      .add(6, "hours")
      .format(DATE_TIME_24H_FORMAT),
    touchpointCapacity: 200,
    disabled: false,
  },
  {
    date: moment(currentSystemDate).add(2, "day").format(DATE_FORMAT),
    cutOff: moment(currentSystemDateTime)
      .add(1, "hour")
      .format(DATE_TIME_24H_FORMAT),
    touchpointCapacity: 3000,
    disabled: false,
  },
];

// upsert delivery slots
const upsertDeliverySlots = [
  {
    date: currentSystemDate,
    cutOff: moment(currentSystemDateTime)
      .add(2, "hours")
      .format(DATE_TIME_24H_FORMAT),
    touchpointCapacity: 100,
    disabled: false,
  },
  {
    date: moment(currentSystemDate).add(1, "day").format(DATE_FORMAT),
    cutOff: moment(currentSystemDateTime)
      .add(6, "hours")
      .format(DATE_TIME_24H_FORMAT),
    touchpointCapacity: 200,
    disabled: false,
  },
  {
    date: moment(currentSystemDate).add(2, "day").format(DATE_FORMAT),
    cutOff: moment(currentSystemDateTime)
      .add(1, "hour")
      .format(DATE_TIME_24H_FORMAT),
    touchpointCapacity: 222,
    disabled: true,
  },
  {
    date: moment(currentSystemDate).add(3, "day").format(DATE_FORMAT), // new DS
    cutOff: moment(currentSystemDateTime)
      .add(1, "hour")
      .format(DATE_TIME_24H_FORMAT),
    touchpointCapacity: 222,
    disabled: true,
  },
  {
    date: moment(currentSystemDate).add(5, "day").format(DATE_FORMAT), // new DS
    cutOff: moment(currentSystemDateTime)
      .add(1, "hour")
      .format(DATE_TIME_24H_FORMAT),
    touchpointCapacity: 222,
    disabled: true,
  },
];

// upsert case
const expectedUpsertApiResponse = [
  {
    id: 1,
    locationId: 13,
    date: currentSystemDate,
    cutOff:
      moment(currentSystemDateTime)
        .add(2, "hours")
        .format(DATE_TIME_24_HOUR_TIMEZONE) + ".000Z",
    touchpointCapacity: 100,
    disabled: false,
    manuallyOverridden: 0,
    touchpointBooked: 0,
    kgBooked: 0,
  },
  {
    id: 2,
    locationId: 13,
    date: moment(currentSystemDate).add(1, "day").format(DATE_FORMAT),
    cutOff:
      moment(currentSystemDateTime)
        .add(6, "hours")
        .format(DATE_TIME_24_HOUR_TIMEZONE) + ".000Z",
    touchpointCapacity: 200,
    disabled: false,
    manuallyOverridden: 0,
    touchpointBooked: 0,
    kgBooked: 0,
  },
  {
    id: 3,
    locationId: 13,
    date: moment(currentSystemDate).add(2, "day").format(DATE_FORMAT),
    cutOff:
      moment(currentSystemDateTime)
        .add(1, "hour")
        .format(DATE_TIME_24_HOUR_TIMEZONE) + ".000Z",
    touchpointCapacity: 222,
    disabled: true,
    manuallyOverridden: 1,
    touchpointBooked: 0,
    kgBooked: 0,
  },
  {
    id: 4,
    locationId: 13,
    date: moment(currentSystemDate).add(3, "day").format(DATE_FORMAT),
    cutOff:
      moment(currentSystemDateTime)
        .add(1, "hour")
        .format(DATE_TIME_24_HOUR_TIMEZONE) + ".000Z",
    touchpointCapacity: 222,
    disabled: true,
    manuallyOverridden: 1,
    touchpointBooked: 0,
    kgBooked: 0,
  },
  {
    // doesn't exist in the DB
    locationId: 13,
    date: moment(currentSystemDate).add(4, "day").format(DATE_FORMAT),
    cutOff:
      moment(currentSystemDate)
        .add(4, "day")
        .subtract(0, "hours")
        .format(DATE_TIME_24_HOUR_TIMEZONE) + ".000Z",
    touchpointCapacity: 0,
    disabled: false,
    manuallyOverridden: false,
    touchpointBooked: 0,
    kgBooked: 0,
  },
  {
    id: 5,
    locationId: 13,
    date: moment(currentSystemDate).add(5, "day").format(DATE_FORMAT),
    cutOff:
      moment(currentSystemDateTime)
        .add(1, "hour")
        .format(DATE_TIME_24_HOUR_TIMEZONE) + ".000Z",
    touchpointCapacity: 222,
    disabled: true,
    manuallyOverridden: 1,
    touchpointBooked: 0,
    kgBooked: 0,
  },
  {
    locationId: 13, // doesn't exist in the DB
    date: moment(currentSystemDate).add(6, "day").format(DATE_FORMAT),
    cutOff:
      moment(currentSystemDate)
        .add(6, "day")
        .subtract(0, "hours")
        .format(DATE_TIME_24_HOUR_TIMEZONE) + ".000Z",
    touchpointCapacity: 0,
    disabled: false,
    manuallyOverridden: false,
    touchpointBooked: 0,
    kgBooked: 0,
  },
];

const expectedUpsertDeliverySlotsLogs = [
  {
    id: 1,
    delivery_slot_id: 1,
    action: "INSERTED",
    performed_by: 160,
    date: moment(currentSystemDate)
      .format(DATE_FORMAT)
      .concat("T00:00:00.000Z"),
    cut_off: moment(currentSystemDateTime)
      .add(6, "hours")
      .format(DATE_TIME_24_HOUR_TIMEZONE)
      .concat(".000Z"),
    touchpoint_capacity: 101,
    disabled: 0,
    manually_overridden: 0,
    location_id: 13,
    deleted_at: null,
  },
  {
    id: 2,
    delivery_slot_id: 2,
    action: "INSERTED",
    performed_by: 160,
    date: moment(currentSystemDate)
      .add(1, "day")
      .format(DATE_FORMAT)
      .concat("T00:00:00.000Z"),
    cut_off: moment(currentSystemDateTime)
      .add(6, "hour")
      .format(DATE_TIME_24_HOUR_TIMEZONE)
      .concat(".000Z"),
    touchpoint_capacity: 200,
    disabled: 0,
    manually_overridden: 0,
    location_id: 13,
    deleted_at: null,
  },
  {
    id: 3,
    delivery_slot_id: 3,
    action: "INSERTED",
    performed_by: 160,
    date: moment(currentSystemDate)
      .add(2, "day")
      .format(DATE_FORMAT)
      .concat("T00:00:00.000Z"),
    cut_off: moment(currentSystemDateTime)
      .add(1, "hour")
      .format(DATE_TIME_24_HOUR_TIMEZONE)
      .concat(".000Z"),
    touchpoint_capacity: 3000,
    disabled: 0,
    manually_overridden: 0,
    location_id: 13,
    deleted_at: null,
  },
  {
    id: 4,
    delivery_slot_id: 1,
    action: "UPDATED",
    performed_by: 160,
    date: moment(currentSystemDate)
      .format(DATE_FORMAT)
      .concat("T00:00:00.000Z"),
    cut_off: moment(currentSystemDateTime)
      .add(2, "hours")
      .format(DATE_TIME_24_HOUR_TIMEZONE)
      .concat(".000Z"),
    touchpoint_capacity: 100,
    disabled: 0,
    manually_overridden: 0,
    location_id: 13,
    deleted_at: null,
  },
  {
    id: 5,
    delivery_slot_id: 2,
    action: "UPDATED",
    performed_by: 160,
    date: moment(currentSystemDate)
      .add(1, "day")
      .format(DATE_FORMAT)
      .concat("T00:00:00.000Z"),
    cut_off: moment(currentSystemDateTime)
      .add(6, "hour")
      .format(DATE_TIME_24_HOUR_TIMEZONE)
      .concat(".000Z"),
    touchpoint_capacity: 200,
    disabled: 0,
    manually_overridden: 0,
    location_id: 13,
    deleted_at: null,
  },
  {
    id: 6,
    delivery_slot_id: 3,
    action: "UPDATED",
    performed_by: 160,
    date: moment(currentSystemDate)
      .add(2, "days")
      .format(DATE_FORMAT)
      .concat("T00:00:00.000Z"),
    cut_off: moment(currentSystemDateTime)
      .add(1, "hour")
      .format(DATE_TIME_24_HOUR_TIMEZONE)
      .concat(".000Z"),
    touchpoint_capacity: 222,
    disabled: 1,
    manually_overridden: 1,
    location_id: 13,
    deleted_at: null,
  },
  {
    id: 7,
    delivery_slot_id: 4,
    action: "INSERTED",
    performed_by: 160,
    date: moment(currentSystemDate)
      .add(3, "days")
      .format(DATE_FORMAT)
      .concat("T00:00:00.000Z"),
    cut_off: moment(currentSystemDateTime)
      .add(1, "hour")
      .format(DATE_TIME_24_HOUR_TIMEZONE)
      .concat(".000Z"),
    touchpoint_capacity: 222,
    disabled: 1,
    manually_overridden: 1,
    location_id: 13,
    deleted_at: null,
  },
  {
    id: 8,
    delivery_slot_id: 5,
    action: "INSERTED",
    performed_by: 160,
    date: moment(currentSystemDate)
      .add(5, "days")
      .format(DATE_FORMAT)
      .concat("T00:00:00.000Z"),
    cut_off: moment(currentSystemDateTime)
      .add(1, "hour")
      .format(DATE_TIME_24_HOUR_TIMEZONE)
      .concat(".000Z"),
    touchpoint_capacity: 222,
    disabled: 1,
    manually_overridden: 1,
    location_id: 13,
    deleted_at: null,
  },
];

// ----------------------------- end - test data for upsert case --------------------------------------------------

const deliverySlotsAuditHistoryColumns = "`id`, `delivery_slot_id`, `action`, `performed_by`, `location_id`, `date`, `cut_off`, `touchpoint_capacity`, `manually_overridden`, `disabled`, `deleted_at`";

module.exports = {
  deliverySlots,
  activeEnabledDeliverySlots,
  getActiveDeliverySlotsForConsumer,
  createDeliverySlots,
  upsertDeliverySlots,
  expectedUpsertApiResponse,
  expectedCreatedDeliverySlotsLogs,
  expectedUpsertDeliverySlotsLogs,
  deliverySlotsAuditHistoryColumns,
};
