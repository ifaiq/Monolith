const WAIVER = "Waiver";
const AUTHORIZATION = [{
  Authorization: [],
}];

const postCreateWaiver = {
  summary: "Creates waiver against the provided order Id [Admin Portal]",
  description: `**Role(s) allowed:** 
  - Company Owner (9)
  - Super Admin (1)
  
   This API takes accepts the following parameters and creates a new waiver:
  - Order Id
  - Waiver amount
  - Waiver reason
  
  **Workflow from Admin Portal:**
  Orders > In Transit Orders > Select Order > Create Waiver`,
  tags: [WAIVER],
  security: AUTHORIZATION,
  requestBody: {
    content: {
      "application/json": {
        schema: {
          properties: {
            orderId: { type: "integer" },
            waiverAmount: { type: "integer" },
            waiverReasonId: { type: "integer" },
          },
          required: ["orderId", "waiverAmount", "waiverReasonId"],
        },
      },
    },
  },
};

const putUpdateWaiver = {
  summary: "Updates waiver against the provided order Id [Admin Portal]",
  description: `**Role(s) allowed:** 
  - Company Owner (9)
  - Super Admin (1)
    
  This API takes accepts the following parameters and updates the waiver:
  - Order Id
  - Waiver amount
  - Waiver reason
   
  **Workflow from Admin Portal:**
  Orders > In Transit Orders > Select Order > Edit Waiver`,
  tags: [WAIVER],
  security: AUTHORIZATION,
  requestBody: {
    content: {
      "application/json": {
        schema: {
          properties: {
            orderId: { type: "integer" },
            waiverAmount: { type: "integer" },
            waiverReasonId: { type: "integer" },
          },
          required: ["orderId", "waiverAmount", "waiverReasonId"],
        },
      },
    },
  },
};

const postRemoveWaiver = {
  summary: "Removes already created waiver against the provided order Id [Admin Portal]",
  description: `**Role(s) allowed:** 
  - Company Owner (9)
  - Super Admin (1)
    
  This API removes the already created waiver against the provided order Id
  
  **Workflow from Admin Portal:**
  Orders > In Transit Orders > Select Order > Edit Waiver > Remove Waiver`,
  tags: [WAIVER],
  security: AUTHORIZATION,
  requestBody: {
    content: {
      "application/json": {
        schema: {
          properties: {
            orderId: { type: "integer" },
          },
          required: ["orderId"],
        },
      },
    },
  },
};

module.exports = {
  postCreateWaiver,
  putUpdateWaiver,
  postRemoveWaiver,
};
