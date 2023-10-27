module.exports = {
    tableName: "delivery_batch_statuses",
    created_at: true,
    updated_at: true,
    deleted_at: true,
    attributes: {
        id: {
            type: "number",
            columnType: "integer",
            autoIncrement: true,
        },
        name: {
            type: "string",
            required: true
        }
    }
};