const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone"); // dependent on utc plugin
const advancedFormat = require("dayjs/plugin/advancedFormat");
const dayjs = require("dayjs");

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(advancedFormat);

const getDayName = date => date.format("dddd");

module.exports = {
  dayjs,
  getDayName,
};
