var dbm;
var type;
var fs = require("fs");
var path = require("path");

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */
exports.setup = function (options) {
  dbm = options.dbmigrate;
  type = dbm.datatype;
};

exports.up = function (db, callback) {
  var filePath = path.join(
    __dirname + "/sqls/20200814100210-order_service_delivery_charges-up.sql"
  );
  fs.readFile(filePath, { encoding: "utf-8" }, function (err, data) {
    if (err) {
      return console.log(err);
    }
    db.runSql(data, function (err) {
      if (err) {
        return console.log(err);
      } else {
        db.runSql(
          "UPDATE orders SET service_charge_type=(SELECT service_charge_type FROM locations WHERE orders.location_id=locations.id), service_charge_value=(SELECT service_charge_value FROM locations WHERE orders.location_id=locations.id), delivery_charge_type=(SELECT delivery_charge_type FROM locations WHERE orders.location_id=locations.id), delivery_charge_value=(SELECT delivery_charge_value FROM locations WHERE orders.location_id=locations.id);",
          function (err) {
            if (err) {
              return console.log(err);
            } else {
              callback();
            }
          }
        );
      }
    });
  });
};

exports.down = function (db, callback) {
  var filePath = path.join(
    __dirname + "/sqls/20200814100210-order_service_delivery_charges-down.sql"
  );
  fs.readFile(filePath, { encoding: "utf-8" }, function (err, data) {
    if (err) return console.log(err);
    db.runSql(data, function (err) {
      if (err) return console.log(err);
      callback();
    });
  });
};
