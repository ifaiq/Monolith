// TODO Need to create constants for table.
let tableName = 'elastic_app_search_synonyms_tags';

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
    synonyms_id: {
      type: "string",
      columnType: "varchar(255)",
      required: true,
    },
  }
};
