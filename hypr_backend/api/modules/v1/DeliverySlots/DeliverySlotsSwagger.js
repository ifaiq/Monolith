/* eslint-disable max-len */
const joiToSwagger = require("joi-to-swagger");
const validationSchema = require("./DeliverySlotsJoiValidation");
const { getSwaggerSchema } = require("../../../../swagger/utils");
const DELIVERY_SLOTS = "Delivery Slots";

const getDeliverySlotsForPortalSchema = {
  tags: [DELIVERY_SLOTS],
  summary: "Returns the list of 7 delivery slots starting from today [Admin Portal]",
  description: `**Role(s) allowed**: 
  - Super Admin (1)
  
  This API returns the list of 7 delivery slots against the selected location. The returned list is unfiltered and includes all (disabled, expired) slots:

  - Today
  - Today + 1
  - Today + 2
  - Today + 3
  - Today + 4
  - Today + 5
  - Today + 6  

  If a delivery slot doesn't exist for a particular date, a dummy slot will be shown for the date with its initial *touchpoint capacity* set to 0 and cut-off time set to default cut-off (set in location's table).

  \n **May communicate with**:
   - **Config service** to fetch default cut-off against the selected location`,
  ...getSwaggerSchema(joiToSwagger(validationSchema.getDeliverySlotsValidation).swagger),
};

const getDeliverySlotsForConsumerSchema = {
  tags: [DELIVERY_SLOTS],
  summary: "Returns the list of available delivery slots [Consumer]",
  description: `**Role(s) allowed**: 
  - Customer (8)
  - Sales agent (16)
  
  This API returns the list of available (advance bookable) delivery slots for customer.

  Pre-requisites for this API to return slots: 
  1. Heirarchy feature flag must be enabled against customer's Business unit
  2. "Advance bookable days" must be set against customer's location

  **Only the slots that comply with the below will be returned:**
  - Enabled
  - TP capacity is greater than 0
  - TP booked is less than TP capacity
  - Cut off has not been reached
  - Cut off > Current datetime

  **Consider the following example where we have the following 7 slots:**

  Keeping below for the sake of this example \n
  - Current datetime: **2022-10-13 21:58:16**
  - Advance bookable days: **3**

  | Delivery Slot Date | Cut-off datetime | Enabled&nbsp;&nbsp; | Touchpoint Capacity | Touchpoint Booked | Shown to the customer | Explanation |
  | --- | --- | --- | --- | --- | --- |  --- |
  | 2022-10-13 | 2022-10-13 22:00:00 | Yes | 100  | 0    | ✅ | <ul><li>✅ Enabled</li><li>✅ TP capacity greater than 0</li><li>✅ TP booked is less than TP capacity</li><li>✅ Cut off not reached yet (Cut-off is 2022-10-13 **22**:00:00 which means the customer still has still ~2 minutes to place the order for this slot) </li></ul> |
  | 2022-10-14 | 2022-10-13 23:00:00 | Yes | 0    | 0    | ❌ | <ul><li>✅ Enabled</li><li>❌ TP capacity greater than 0</li><li>✅ TP booked is less than TP capacity</li><li>✅ Cut off not reached yet (Cut-off is 2022-10-13 **23**:00:00 which means the customer still has ~1 hr to place the order for this slot) </li></ul> |
  | 2022-10-16 | 2022-10-13 20:00:00 | Yes | 2000 | 0    | ❌ | <ul><li>✅ Enabled</li><li>✅ TP capacity greater than 0</li><li>✅ TP booked is less than TP capacity</li><li>❌ Cut off not reached yet (Cut off for this slot was 1 hr ago)</li></ul> |
  | 2022-10-17 | 2022-10-14 05:00:00 | No  | 8500 | 0    | ❌ | <ul><li>❌ Enabled</li><li>✅ TP capacity greater than 0</li><li>✅ TP booked is less than TP capacity</li><li>✅ Cut off not reached yet</li></ul> |
  | 2022-10-18 | 2022-10-14 05:35:00 | Yes | 1500 | 2    | ✅ | <ul><li>✅ Enabled</li><li>✅ TP capacity greater than 0</li><li>✅ TP booked is less than TP capacity</li><li>✅ Cut off not reached yet (Customer can place the order for this slot till tomorrow 05:35:00, considering it's *Oct 13, 2022* today) </li></ul> |
  | 2022-10-19 | 2022-10-15 06:00:00 | Yes | 1500 | 599  | ✅ | <ul><li>✅ Enabled</li><li>✅ TP capacity greater than 0</li><li>✅ TP booked is less than TP capacity</li><li>✅ Cut off not reached yet (Customer can place the order for this slot till 15th Oct 06:00:00, considering it's *Oct 13, 2022* today)</li></ul> |
  | 2022-11-01 | 2022-10-16 21:00:00 | Yes | 9999 | 9998 | ❌  | <ul><li>✅ Enabled</li><li>✅ TP capacity greater than 0</li><li>✅ TP booked is less than TP capacity</li><li>✅ Cut off not reached yet (Customer can place the order for this slot till 16th Oct 21:00:00, considering it's *Oct 13, 2022* today) </li></ul> <br> ❌ Doesn't lie in the "Advance bookable days" limit. Since the **Advance bookable days** for this location is set to 3, only first 3 available slots will be shown to the customer |`,
  ...getSwaggerSchema(joiToSwagger(validationSchema.getDeliverySlotsValidation).swagger),
};

const upsertDeliverySlotsForPortalSchema = {
  tags: [DELIVERY_SLOTS],
  summary: "Inserts/updates delivery slots [Admin Portal]",
  description: `**Role(s) allowed**: 
  - Super Admin (1)

  \n This API updates the delivery slot if it exists already, inserts otherwise.`,
  ...getSwaggerSchema(joiToSwagger(validationSchema.upsertDeliverySlotsForPortal).swagger),
};

module.exports = {
  getDeliverySlotsForPortalSchema,
  getDeliverySlotsForConsumerSchema,
  upsertDeliverySlotsForPortalSchema,
};
