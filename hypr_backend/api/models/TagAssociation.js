// TODO Need to create constants for table.
let tableName = 'tag_associations';

module.exports = {
  tableName,
  attributes: {
    id: {
      type: "number",
      columnType: "integer",
      autoIncrement: true,
    },
    tag_id: {
      model: "Tag"
    },
    context_name: {
      type: "string",
      columnType: "varchar(255)",
      required: true,
    },
    context_id: {
      type: "number",
      columnType: "integer",
      required: true,
    },
    disabled: {
      type: "boolean",
      defaultsTo: false,
    },
  }
};
