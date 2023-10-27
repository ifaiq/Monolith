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
const locationId = 13;
const currentSystemDate = moment(currentSystemDateTime).format(DATE_FORMAT);
// console.log("system date time", currentSystemDateTime); // prints locale/system date time

// create new delivery slots
const createDeliverySlots = [
  {
    date: currentSystemDate,
    cutOff: moment(currentSystemDateTime)
      .add(6, "hours")
      .format(DATE_TIME_24H_FORMAT),
    touchpointCapacity: 101,
    disabled: false,
    touchpointBooked: 0,
  },
  {
    date: moment(currentSystemDate).add(1, "day").format(DATE_FORMAT),
    cutOff: moment(currentSystemDateTime)
      .add(6, "hours")
      .format(DATE_TIME_24H_FORMAT),
    touchpointCapacity: 101,
    disabled: false,
    touchpointBooked: 11,
  },
  {
    date: moment(currentSystemDate).add(2, "day").format(DATE_FORMAT),
    cutOff: moment(currentSystemDateTime)
      .add(1, "hour")
      .format(DATE_TIME_24H_FORMAT),
    touchpointCapacity: 101,
    disabled: false,
    touchpointBooked: 12,
  },
  {
    date: moment(currentSystemDate).add(3, "day").format(DATE_FORMAT),
    cutOff: moment(currentSystemDateTime)
      .add(1, "hour")
      .format(DATE_TIME_24H_FORMAT),
    touchpointCapacity: 101,
    disabled: false,
    touchpointBooked: 12,
  },
  {
    date: moment(currentSystemDate).add(4, "day").format(DATE_FORMAT),
    cutOff: moment(currentSystemDateTime)
      .add(1, "hour")
      .format(DATE_TIME_24H_FORMAT),
    touchpointCapacity: 101,
    disabled: false,
    touchpointBooked: 12,
  },
  {
    date: moment(currentSystemDate).add(5, "day").format(DATE_FORMAT),
    cutOff: moment(currentSystemDateTime)
      .add(1, "hour")
      .format(DATE_TIME_24H_FORMAT),
    touchpointCapacity: 101,
    disabled: false,
    touchpointBooked: 12,
  },
  {
    date: moment(currentSystemDate).add(6, "day").format(DATE_FORMAT),
    cutOff: moment(currentSystemDateTime)
      .add(1, "hour")
      .format(DATE_TIME_24H_FORMAT),
    touchpointCapacity: 101,
    disabled: false,
    touchpointBooked: 12,
  },
];

const upsertDeliverySlots = [
  {
    date: currentSystemDate,
    cutOff: moment(currentSystemDateTime)
      .add(6, "hours")
      .format(DATE_TIME_24H_FORMAT),
    touchpointCapacity: 101,
    disabled: false,
    touchpointBooked: 0,
  },
  {
    date: moment(currentSystemDate).add(2, "day").format(DATE_FORMAT),
    cutOff: moment(currentSystemDateTime)
      .add(1, "hour")
      .format(DATE_TIME_24H_FORMAT),
    touchpointCapacity: 101,
    disabled: false,
    touchpointBooked: 12,
  },
  {
    date: moment(currentSystemDate).add(3, "day").format(DATE_FORMAT),
    cutOff: moment(currentSystemDateTime)
      .add(1, "hour")
      .format(DATE_TIME_24H_FORMAT),
    touchpointCapacity: 101,
    disabled: false,
    touchpointBooked: 12,
  },
  {
    date: moment(currentSystemDate).add(4, "day").format(DATE_FORMAT),
    cutOff: moment(currentSystemDateTime)
      .add(1, "hour")
      .format(DATE_TIME_24H_FORMAT),
    touchpointCapacity: 101,
    disabled: false,
    touchpointBooked: 12,
  },
  {
    date: moment(currentSystemDate).add(5, "day").format(DATE_FORMAT),
    cutOff: moment(currentSystemDateTime)
      .add(1, "hour")
      .format(DATE_TIME_24H_FORMAT),
    touchpointCapacity: 101,
    disabled: false,
    touchpointBooked: 12,
  },
  {
    date: moment(currentSystemDate).add(6, "day").format(DATE_FORMAT),
    cutOff: moment(currentSystemDateTime)
      .add(1, "hour")
      .format(DATE_TIME_24H_FORMAT),
    touchpointCapacity: 101,
    disabled: false,
    touchpointBooked: 12,
  },
];


const expectedApiResponse = [
  {
    id: 1,
    locationId: 13,
    date: currentSystemDate,
    cutOff: moment(currentSystemDateTime)
      .add(6, "hours")
      .format(DATE_TIME_24_HOUR_TIMEZONE) + ".000Z",
    touchpointCapacity: 101,
    disabled: false,
    manuallyOverridden: 0,
    touchpointBooked: 0,
    kgBooked: 0,
  },
  {
    id: 2,
    locationId: 13,
    date: moment(currentSystemDate).add(1, "day").format(DATE_FORMAT),
    cutOff: moment(currentSystemDateTime)
      .add(6, "hours")
      .format(DATE_TIME_24_HOUR_TIMEZONE) + ".000Z",
    touchpointCapacity: 101,
    disabled: false,
    manuallyOverridden: 0,
    touchpointBooked: 0,
    kgBooked: 0,
  },
  {
    id: 3,
    locationId: 13,
    date: moment(currentSystemDate).add(2, "day").format(DATE_FORMAT),
    cutOff: moment(currentSystemDateTime)
      .add(1, "hour")
      .format(DATE_TIME_24_HOUR_TIMEZONE) + ".000Z",
    touchpointCapacity: 101,
    disabled: false,
    manuallyOverridden: 0,
    touchpointBooked: 0,
    kgBooked: 0,
  },
  {
    id: 4,
    locationId: 13,
    date: moment(currentSystemDate).add(3, "day").format(DATE_FORMAT),
    cutOff: moment(currentSystemDateTime)
      .add(1, "hour")
      .format(DATE_TIME_24_HOUR_TIMEZONE) + ".000Z",
    touchpointCapacity: 101,
    disabled: false,
    manuallyOverridden: 0,
    touchpointBooked: 0,
    kgBooked: 0,
  },
  {
    id: 5,
    locationId: 13,
    date: moment(currentSystemDate).add(4, "day").format(DATE_FORMAT),
    cutOff: moment(currentSystemDateTime)
      .add(1, "hour")
      .format(DATE_TIME_24_HOUR_TIMEZONE) + ".000Z",
    touchpointCapacity: 101,
    disabled: false,
    manuallyOverridden: 0,
    touchpointBooked: 0,
    kgBooked: 0,
  },
  {
    id: 6,
    locationId: 13,
    date: moment(currentSystemDate).add(5, "day").format(DATE_FORMAT),
    cutOff: moment(currentSystemDateTime)
      .add(1, "hour")
      .format(DATE_TIME_24_HOUR_TIMEZONE) + ".000Z",
    touchpointCapacity: 101,
    disabled: false,
    manuallyOverridden: 0,
    touchpointBooked: 0,
    kgBooked: 0,
  },
  {
    id: 7,
    locationId: 13,
    date: moment(currentSystemDate).add(6, "day").format(DATE_FORMAT),
    cutOff: moment(currentSystemDateTime)
      .add(1, "hour")
      .format(DATE_TIME_24_HOUR_TIMEZONE) + ".000Z",
    touchpointCapacity: 101,
    disabled: false,
    manuallyOverridden: 0,
    touchpointBooked: 0,
    kgBooked: 0,
  },
];

const expectedApiResponseWithDefault = [
  {
    id: 1,
    locationId: 13,
    date: currentSystemDate,
    cutOff: moment(currentSystemDateTime)
      .add(6, "hours")
      .format(DATE_TIME_24_HOUR_TIMEZONE) + ".000Z",
    touchpointCapacity: 101,
    disabled: false,
    manuallyOverridden: 0,
    touchpointBooked: 0,
    kgBooked: 0,
  },
  {

    locationId: 13,
    date: moment(currentSystemDate).add(1, "day").format(DATE_FORMAT),
    cutOff: moment(currentSystemDate)
      .add(1, "day")
      .subtract(0, "hours")
      .format(DATE_TIME_24_HOUR_TIMEZONE) + ".000Z",
    touchpointCapacity: 0,
    disabled: false,
    manuallyOverridden: false,
    touchpointBooked: 0,
    kgBooked: 0,
  },
  {
    id: 2,
    locationId: 13,
    date: moment(currentSystemDate).add(2, "day").format(DATE_FORMAT),
    cutOff: moment(currentSystemDateTime)
      .add(1, "hour")
      .format(DATE_TIME_24_HOUR_TIMEZONE) + ".000Z",
    touchpointCapacity: 101,
    disabled: false,
    manuallyOverridden: 0,
    touchpointBooked: 0,
    kgBooked: 0,
  },
  {
    id: 3,
    locationId: 13,
    date: moment(currentSystemDate).add(3, "day").format(DATE_FORMAT),
    cutOff: moment(currentSystemDateTime)
      .add(1, "hour")
      .format(DATE_TIME_24_HOUR_TIMEZONE) + ".000Z",
    touchpointCapacity: 101,
    disabled: false,
    manuallyOverridden: 0,
    touchpointBooked: 0,
    kgBooked: 0,
  },
  {
    id: 4,
    locationId: 13,
    date: moment(currentSystemDate).add(4, "day").format(DATE_FORMAT),
    cutOff: moment(currentSystemDateTime)
      .add(1, "hour")
      .format(DATE_TIME_24_HOUR_TIMEZONE) + ".000Z",
    touchpointCapacity: 101,
    disabled: false,
    manuallyOverridden: 0,
    touchpointBooked: 0,
    kgBooked: 0,
  },
  {
    id: 5,
    locationId: 13,
    date: moment(currentSystemDate).add(5, "day").format(DATE_FORMAT),
    cutOff: moment(currentSystemDateTime)
      .add(1, "hour")
      .format(DATE_TIME_24_HOUR_TIMEZONE) + ".000Z",
    touchpointCapacity: 101,
    disabled: false,
    manuallyOverridden: 0,
    touchpointBooked: 0,
    kgBooked: 0,
  },
  {
    id: 6,
    locationId: 13,
    date: moment(currentSystemDate).add(6, "day").format(DATE_FORMAT),
    cutOff: moment(currentSystemDateTime)
      .add(1, "hour")
      .format(DATE_TIME_24_HOUR_TIMEZONE) + ".000Z",
    touchpointCapacity: 101,
    disabled: false,
    manuallyOverridden: 0,
    touchpointBooked: 0,
    kgBooked: 0,
  },
];

// ----------------------------- end - test data for upsert case --------------------------------------------------

module.exports = {
  createDeliverySlots,
  upsertDeliverySlots,
  expectedApiResponse,
  expectedApiResponseWithDefault,
  locationId,
};
