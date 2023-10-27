var defer = require("node-defer");
const { LANGUAGE: { EN } } = require('../services/Constants')

module.exports = {
  sortArray: function (categories) {
    var sortedCategories = [];
    for (var index = 0; index < categories.length; index++) {
      sortedCategories.push({
        category_id: categories[index].category_id,
        category_name: categories[index].category_name,
        items: categories[index].items.sort(
          GeneralHelper.sorting("name", "asc")
        ),
      });
    }
    return sortedCategories;
  },

  sorting: function (property, order) {
    var sort_order = 1;
    if (order === "desc") {
      sort_order = -1;
    }
    return function (first, second) {
      // first should come before second in the sorted order
      if (first[property] < second[property]) {
        return -1 * sort_order;
        // first should come after second in the sorted order
      } else if (first[property] > second[property]) {
        return 1 * sort_order;
        // first and second are the same
      } else {
        return 0 * sort_order;
      }
    };
  },

  emptyOrAllParam(param, checkZero) {
    if (
      param != null &&
      param != undefined &&
      param != "" &&
      param != "all" &&
      param != "All" &&
      param != "null" &&
      param != "undefined"
    ) {
      if (checkZero) {
        if (!(param == 0)) return false;
        else {
          return true;
        }
      }
      return false;
    }
    return true;
  },

  isArray: function (input) {
    if (input.hasOwnProperty("length")) return true;
    return false;
  },

  mapToIds: function (input) {
    // if type is int, make array and send
    if (typeof input == "number" || typeof input == "string") {
      return [input];
    }
    // if type object or array (special type of object)
    else if (typeof input == "object") {
      if (this.isArray(input)) {
        // if array of integers
        if (typeof input[0] == "number" || typeof input[0] == "string") {
          return input;
        }
        // if array of objects
        else {
          return input.map(function (ele) {
            return ele.id;
          });
        }
      }
      // if single object
      else {
        return [input.id];
      }
    }
  },

  dateObjectToMySqlDateConversion: function (date) {
    let dateTime =
      date.toISOString().split("T")[0] +
      " " +
      date.toTimeString().split(" ")[0];
    return dateTime;
  },

  getFlatOrPercent: function (type, value, total) {
    return type == "FLAT" ? value : total ? (value / 100) * total : "0.00";
  },

};
