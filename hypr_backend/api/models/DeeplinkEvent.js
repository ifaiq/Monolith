module.exports = {
    tableName: "deeplink_events",
    created_at: true,
    updated_at: true,
    deleted_at: true,
    attributes: {
        id: {
                  type: "number",
                  columnType: "integer",
                  autoIncrement: true,
                },
        session_id: {
            type: "string",
            allowNull: false,
        },
        source: {
            type: "string",
            allowNull: true
        },
        medium: {
            type: "string",
            allowNull: true
        },
        campaign: {
            type: "string",
            allowNull: true
        },
        screen: {
            type: "string",
        },
        category_id: {
            type: "string",
            allowNull: true,
        },
        subcategory_id: {
            type: "string",
            allowNull: true,
        },
    },
  };
  