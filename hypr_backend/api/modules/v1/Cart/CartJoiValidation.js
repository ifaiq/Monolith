/**
 Copyright © 2021 Retailo, Inc.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

const { Joi } = require("../../../../utils/services");


// PUT /api/v1/cart
const putCartValidation = Joi.object()
  .keys({
    body: Joi.object({
      locationId: Joi.number().integer().positive().strict().required(),
      zones: Joi.string().optional().allow(""),
      shopTypeId: Joi.number().integer().positive().optional().allow("").allow(null),
      products: Joi.array().items(
        Joi.object({
          id: Joi.number().integer().positive().strict().required(),
          quantity: Joi.number().integer().positive().strict().required(),
        }),
      ).strict().required(),
      coupon: Joi.object({
        id: Joi.number().integer().positive().strict(),
        name: Joi.string().strict(),
      }).unknown(true),
    }).unknown(true),
  });

// GET /api/v1/cart
const getCartValidation = Joi.object()
  .keys({
    query: {
      customerId: Joi.string().pattern(/^[0-9]/),
    },
  });
/**
 * CHANGELOG: compensate frontend glitch, set min zero to allow zero quantity coming from frontend
 * DISCUSSION REQUIRED: api contracts not being followed completely
 */
const generateCartValidation = Joi.object()
  .keys({
    body: Joi.object({
      locationId: Joi.number().integer().positive().strict().required(),
      products: Joi.array().items(
        Joi.object({
          id: Joi.number().integer().positive().strict().required(),
          quantity: Joi.number().integer().min(0).strict().required(),
        }),
      ).strict().required(),
      coupon: Joi.object({
        id: Joi.number().integer().positive().strict(),
        name: Joi.string().strict(),
      }).unknown(true),
    }).unknown(true),
  });

module.exports = {
  putCartValidation,
  getCartValidation,
  generateCartValidation,
};
