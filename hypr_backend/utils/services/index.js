const Joi = require('joi');
const JoiDate = require("@joi/date");

const { HyprOrderStates: { DELIVERED, PARTIAL_DELIVERED, PACKED, PACKER_CANCELLED, CANCELLED, REJECTED }, HyprNotificationType: { DELIVERED: DELIVERED_NOTIFICATION, ORDER_MODIFIED, DELIVERY_REJECTED, PACKED: PACKED_NOTIFICATION } } = require('../../api/services/Constants');
// this order state import needs to be replaced with order module constants, export from order module index.js and import here

const getPagination = (page = 1, per_page = 10) => { // TODO get page and per_page value from constants
    page = parseInt(page);
    per_page = parseInt(per_page);
    let skip = (Math.abs(page) - 1) * Math.abs(per_page);
    let limit = Math.abs(per_page);
    return { skip, limit };
};

const getPaginationForRedis = (page = 1, per_page = 10) => { // TODO get page and per_page value from constants
    page = parseInt(page);
    per_page = parseInt(per_page);
    let redisSkip = (Math.abs(page) - 1) * Math.abs(per_page);
    let redisLimit = Math.abs(per_page) + redisSkip - 1; // redis index starts with 0
    return { redisSkip, redisLimit };
};


const validate = async (schema, req) => {
    try {
        await schema
            .unknown(true)
            .validateAsync(req, { abortEarly: false });
    }
    catch (err) {
        throw err
    }
};

const sortArrayAscendingNullsToEnd = (arr, sortingKey) => {
    arr.sort(function (a, b) {
        if (a[sortingKey] === null) {
            return 1;
        }
        else if (b[sortingKey] === null) {
            return -1;
        } else {
            return a[sortingKey] - b[sortingKey];
        }
    });
    return arr;
}

// NOTE: Zero represents false, so we can check whether to send notification or not
// TODO: add other notification types as well e.g place order which will be added when order flow gets completed
const getNotificationType = (statusId) => {
    let notificationType = 0;
    switch (statusId) {
        case DELIVERED:
            notificationType = DELIVERED_NOTIFICATION;
            break;
        case PARTIAL_DELIVERED:
            notificationType = DELIVERED_NOTIFICATION;
            break;
        case PACKED:
            notificationType = PACKED_NOTIFICATION;
            break;
        case PACKER_CANCELLED:
            notificationType = ORDER_MODIFIED;
            break;
        case CANCELLED:
            notificationType = ORDER_MODIFIED;
            break;
        case REJECTED:
            notificationType = DELIVERY_REJECTED;
            break;
    }
    return notificationType;
}

const monthDiff = (dateFrom, dateTo) => dateTo.getMonth() - dateFrom.getMonth() + (12 * (dateTo.getFullYear() - dateFrom.getFullYear()))

const getSqlDateObject = (date) => {
    let start_date = new Date(date);
    let full_year = start_date.getFullYear();
    /* NOTE: added brackets back to avoid any issue */
    let full_month = start_date.getMonth() + 1 + "";
    if (full_month.length == 1) {
        full_month = "0" + (start_date.getMonth() + 1);
    }
    let full_day = start_date.getDate() + "";
    if (full_day.length == 1) {
        full_day = "0" + start_date.getDate();
    }
    return full_year + "-" + full_month + "-" + full_day;
}

const removeDashesFromCnic = (cnicWithDashes) => cnicWithDashes.split("-").join("");

const convertDayToSec = (day = 1) => day * 24 * 60 * 60;

module.exports = {
    Joi,
    validate,
    getPagination,
    getPaginationForRedis,
    sortArrayAscendingNullsToEnd,
    getNotificationType,
    monthDiff,
    getSqlDateObject,
    removeDashesFromCnic,
    convertDayToSec,
    JoiDate,
};
