module.exports = {
    tableName: "batch_history",
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
        batch_id: {
            type: "number",
            columnType: "integer",
            required: true,
        },
        type: {
            type: "string",
            columnType: "string",
            required: true,
        },
        old_JSON: {
            type: "JSON",
            columnType: "json",
            required: true,
        },
        new_JSON: {
            type: "JSON",
            columnType: "json",
            required: true,
        },
        old_status_id: {
            type: "number",
            columnType: "integer",
            required: false,
        },
        new_status_id: {
            type: "number",
            columnType: "integer",
            required: false,
        },
    },
};
