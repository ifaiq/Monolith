// TODO Need to create constants for table.
let tableName = 'tags';

module.exports = {
  tableName,
  attributes: {
    id: {
      type: "number",
      columnType: "integer",
      autoIncrement: true,
    },
    name: {
      type: "string",
      columnType: "varchar(255)",
      required: true,
      unique: true,
    },
    status: {
      type: "boolean",
      defaultsTo: true,
    }
  }
};
