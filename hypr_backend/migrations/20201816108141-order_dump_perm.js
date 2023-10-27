"use strict";

var dbm;
var type;
var seed;

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */
exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function (db) {
  return db.runSql(
    "INSERT INTO `permissions` (`id`,`code`, `api`, `method`, `created_at`, `updated_at`) VALUES (124,'R_ORDER_DUMP', '/order/dump', 'GET', now(), now())",
    [],
    function (err) {
      if (err) {
        console.log("ERROR AT ADDING PERMISSION");
        console.log(err);
      } else {
        return db.runSql(
          "INSERT INTO `role_permissions` (`role_id`, `permission_id`, `created_at`, `updated_at`) VALUES ('9', '124',now(), now());",
          [],
          function (err) {
            if (err) {
              console.log("ERROR AT ADDINGROLE PERMISSION FOR 9");
              console.log(err);
            } else {
              return db.runSql(
                "INSERT INTO `role_permissions` (`role_id`, `permission_id`, `created_at`, `updated_at`) VALUES ('15', '124',now(), now());",
                [],
                function (err) {
                  if (err) {
                    console.log("ERROR AT ADDINGROLE PERMISSION FOR 15");
                    console.log(err);
                  } else {
                    return db.runSql(
                      "INSERT INTO `role_permissions` (`role_id`, `permission_id`, `created_at`, `updated_at`) VALUES ('7', '124',now(), now());",
                      [],
                      function (err) {
                        if (err) {
                          console.log("ERROR AT ADDINGROLE PERMISSION FOR 7");
                          console.log(err);
                        }
                      }
                    );
                  }
                }
              );
            }
          }
        );
      }
    }
  );
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  version: 1,
};
