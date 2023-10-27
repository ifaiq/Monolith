/**
* This function takes the appropirate data for roles app version
* and creates a new roles app version
* @param {Object} rolesAppVersion
*/

const create = async rolesAppVersion => await RolesAppVersions.create(rolesAppVersion);


/**
* This function takes the appropirate data for roles app version
* and update roles app version
* @param {int} id
* @param {Object} rolesAppVersion
*/
const updateById = async (id, rolesAppVersion) => await RolesAppVersions.updateOne({id}, rolesAppVersion);

const getOsAndRoleBasedAppVersion = async (os, role_id) => await RolesAppVersions.findOne({
  os,
  role_id,
  disabled: false,
}).populate(["general_app_version", "role_id"]);

module.exports = {
  create,
  updateById,
  getOsAndRoleBasedAppVersion,
};
