module.exports = {
    tableName: "multilingual_attributes",
    created_at: true,
    updated_at: true,
    deleted_at: true,
    attributes: {
        id: {
            type: "number",
            columnType: 'int',
            required: false,
            autoIncrement: true,
            columnName: "id"
        },
        name: {
            type: "string",
            allowNull: false,
            columnType: "varchar(30)",
            columnName: "name"
        }
    },
};
