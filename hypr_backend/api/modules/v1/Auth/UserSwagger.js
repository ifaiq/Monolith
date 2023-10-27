const getAllUsers = {
  summary: "Get all users",
  description: "This route gets all users",
  tag: "User",
  security: [{
    Authorization: [],
  }],
  parameters: [{
    in: "query",
    name: "roleId",
    required: false,
    schema: { type: "integer" },
    description: "Role ID against which to get users",
  },
  {
    in: "query",
    name: "locationId",
    required: false,
    schema: { type: "integer" },
    description: "Location ID against which to get users",
  },
  {
    in: "query",
    name: "businessUnitId",
    required: false,
    schema: { type: "integer" },
    description: "Business Unit ID against which to get users",
  }],
};

module.exports = {
  getAllUsers,
};
