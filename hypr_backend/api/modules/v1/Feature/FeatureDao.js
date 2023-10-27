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

/**
 * This function takes a categoryId and returns all of its junctions with products
 *
 * @param {Name} name
 * @returns {Object} feature
 */
const findFeatureByName = async name =>
  (await Feature.findOne({ name }));

module.exports = {
  findFeatureByName,
};
