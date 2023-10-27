/**
 Copyright © 2022 Retailo, Inc.

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

// Please set this in your container env
const CONFIG_SERVICE_BASE_URL = process.env.CONFIG_SERVICE_BASE_URL || "https://dev.retailo.me/config";

module.exports = {
  URLS: {
    CONFIG_SERVICE_BASE_URL,
    APP_VERSION: "appversion",
    BUSINESS_UNIT: "businessunit",
    COMPANY: "company",
    LOCATION: "location",
    LOCATION_BANNER: "locationbanner",
    ROLE_APP_VERSION: "roleappversion",
  },
};
