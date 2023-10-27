const getAllMessages = {
  summary: "Get all notification messages",
  description: "This route gets all notification messages",
  tags: ["Notification Messages"],
  security: [{
    Authorization: [],
  }],
  parameters: [{
    in: "query",
    name: "company_id",
    required: true,
    schema: { type: "integer" },
    description: "Company ID against which to get notification messages",
  }],
};

const createMessage = {
  summary: "Create notification message",
  description: "This route create a notification messages",
  tags: ["Notification Messages"],
  security: [{
    Authorization: [],
  }],
  requestBody: {
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            title: {
              type: "string",
            },
            company_id: {
              type: "integer",
              format: "int64",
            },
          },
        },
      },
    },
  },
};

module.exports = {
  getAllMessages,
  createMessage,
};
