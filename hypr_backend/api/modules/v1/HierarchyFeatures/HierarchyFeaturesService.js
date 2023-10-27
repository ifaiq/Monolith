const { findFeaturesByBusinessUnitId, findFeaturesByLocationId } = require("./HierarchyFeaturesDao");

/**
* This function takes the businessUnitId and return features list.
*
* @param {Number} businessUnitId
* @returns {feature[]} features
*/
const findHierarchyFeaturesByBusinessUnitId = async businessUnitId => (
  businessUnitId ?
    await findFeaturesByBusinessUnitId(businessUnitId) :
    []
);

const findHierarchyFeaturesByLocationId = async locationId => (
  locationId ?
    await findFeaturesByLocationId(locationId) :
    []
);

module.exports = {
  findHierarchyFeaturesByBusinessUnitId,
  findHierarchyFeaturesByLocationId,
};
