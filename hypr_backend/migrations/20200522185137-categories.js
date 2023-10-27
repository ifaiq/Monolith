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
  return db.createTable(
    "categories",
    {
      id: { type: "int", primaryKey: true, autoIncrement: true },
      parent_id: { type: "int", defaultValue: null },
      name: { type: "string", defaultValue: null },
      image_url: { type: "string", defaultValue: null },
      priority: { type: "int", defaultValue: null },
      start_date: { type: "datetime", defaultValue: null },
      end_date: { type: "datetime", defaultValue: null },
      disabled_at: { type: "datetime", defaultValue: null },
      disabled_by: { type: "int", defaultValue: null },
      location_id: { type: "int", defaultValue: null },
      created_at: { type: "datetime", defaultValue: null },
      updated_at: { type: "datetime", defaultValue: null },
      deleted_at: { type: "datetime", defaultValue: null },
    },
    (err) => {
      if (err) console.log("ERROR AT CREATING CATEGORIES", err);
      else {
        return db.addForeignKey(
          "categories",
          "categories",
          "category_id_fk",
          {
            parent_id: "id",
          },
          { onDelete: "CASCADE", onUpdate: "RESTRICT" },
          (err) => {
            if (err)
              console.log(
                "ERROR AT CREATING CATEGORIES FOREIGN KEY FOR CATEGORIES (SELF RELATION)",
                err
              );
            else {
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
