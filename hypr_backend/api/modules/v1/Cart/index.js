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

const CartRoutes = require("./CartRoutes");
const { addPrefixWithRoutes } = require("../../../../utils/routes");
const { constants: { request: { VERSIONING: { v1, prefix } } } } = require("../../../constants/http");
const cartService = require("./CartService");
const { messages } = require("./CartUserMessages");
module.exports = {
  cartRoutes: addPrefixWithRoutes(`/${prefix}/${v1}/cart`, CartRoutes),
  cartService,
  messages,
};
