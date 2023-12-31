'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  return db.runSql(
          "INSERT INTO delivery_batch_statuses( name, created_at, updated_at ) VALUES ('PENDING', now(), now() ), ('ACCEPTED', now(), now() ), ('ONBOARDED', now(), now() ), ('IN TRANSIT', now(), now() ), ('COMPLETED', now(), now() )"
        );
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  "version": 1
};
