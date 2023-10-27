module.exports = {
    tableName: "cash_denominations",
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
        country_code: {
            type: "string",
            columnType: "string",
            required: true,
        },
        denomination_value: {
            type: "number",
            columnType: "integer",
            required: true,
        },
    },
};
