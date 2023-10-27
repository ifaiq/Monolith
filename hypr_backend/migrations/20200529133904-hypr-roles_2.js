'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency FROM dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function (db) {
  return db.runSql("INSERT INTO roles (id, name) SELECT 5, 'PACKER' WHERE not exists(SELECT * FROM roles WHERE id=5)", [],
    function (err) {
      if (err)
        console.log(err)
      return db.runSql("INSERT INTO roles (id, name) SELECT 6, 'DELIVERY' WHERE not exists(SELECT * FROM roles WHERE id=6)", [],
        function (err) {
          if (err)
            console.log(err)
          return db.runSql("INSERT INTO roles (id, name) SELECT 7, 'STORE MANAGER' WHERE not exists(SELECT * FROM roles WHERE id=7)", [],
            function (err) {
              if (err)
                console.log(err)
              return db.runSql("INSERT INTO roles (id, name) SELECT 8, 'CONSUMER' WHERE not exists(SELECT * FROM roles WHERE id=8)", [],
                function (err) {
                  if (err)
                    console.log(err)
                });
            });
        });
    });
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  "version": 1
};
