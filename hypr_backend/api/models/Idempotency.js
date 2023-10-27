module.exports = {
    tableName: "idempotency",
    created_at: true,
    updated_at: true,
    deleted_at: true,
    attributes: {
        id: {
            type: "number",
            columnType: "integer",
            required: false,
            autoIncrement: true,
        },
        idempotency_key: {
            type: "string",
            columnType: "string",
            required: true,
        },
        response: {
            type: "JSON",
            columnType: "json",
            required: true,
        },
        status_code: {
            type: "number",
            columnType: "integer",
            required: true,
        },
    },
};
