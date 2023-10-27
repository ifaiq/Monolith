const { isNewerVersion } = require("../../../../utils/controller");
const {
  constants: {
    request: {
      VERSIONING: { v1 },
    },
  },
} = require("../../../constants/http");
const rolesAppVersionDao = require("./RolesAppVersionDao");

const createRolesAppVersion = async (
  role_id,
  os,
  minimum_version,
  general_app_version,
) => {
  const logIdentifier = `API version: ${v1}, context:RolesAppVersionService.createRolesAppVersion()`;
  try {
    sails.log(
      `${logIdentifier} called with params -> ${{
        role_id,
        os,
        minimum_version,
      }}`,
    );
    const rolesAppVersionCreated = await rolesAppVersionDao.create({
      role_id,
      os,
      minimum_version,
      general_app_version,
    });
    sails.log(`${logIdentifier} Roles based app version created successfully`);
    return rolesAppVersionCreated;
  } catch (error) {
    sails.log.error(
      `${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`,
    );
    throw error;
  }
};

const updateRolesAppVersion = async (
  id,
  role_id,
  os,
  minimum_version,
  general_app_version,
  disable,
) => {
  const logIdentifier = `API version: ${v1}, context:RolesAppVersionService.updateRolesAppVersion()`;
  const query = {};
  if (role_id) {
    query.role_id = role_id;
  }
  if (os) {
    query.os = os;
  }
  if (minimum_version) {
    query.minimum_version = minimum_version;
  }
  if (general_app_version) {
    query.general_app_version = general_app_version;
  }
  if(disable) {
    query.disabled = disable;
  }
  try {
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify({ query })}`);
    const rolesAppVersionUpdated = await rolesAppVersionDao.updateById(id, query);
    sails.log(`${logIdentifier} Roles based app version updated successfully`);
    return rolesAppVersionUpdated;
  } catch (error) {
    sails.log.error(
      `${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`,
    );
    throw error;
  }
};


// If no os is provided then android will be the default os
const getRolesAppVersion = async ({ os = "android", role_id, name, current_version }) => {
  const logIdentifier = `API version: ${v1}, context:RolesAppVersionService.getRolesAppVersion()`;
  try {
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify({ os, role_id, name, current_version })}`);
    const rolesAppVersion = await rolesAppVersionDao.getOsAndRoleBasedAppVersion(os, role_id);
    sails.log(`${logIdentifier} Roles based app version found successfully`);
    if(rolesAppVersion) {
      const { general_app_version, role_id: roleInfo } = rolesAppVersion;

      const validate_os_name =
      general_app_version && general_app_version.os === rolesAppVersion.os && general_app_version.name === name;

      const validate_role = roleInfo && roleInfo.id === role_id;
      const validate_min_version = isNewerVersion(rolesAppVersion.minimum_version, general_app_version.current_version);
      const validate_current_version = isNewerVersion(rolesAppVersion.minimum_version, current_version);

      //  Validate if the app version is valid for the role
      if(validate_os_name && validate_role && validate_min_version && validate_current_version) {
        return true;
      }
    }
    return false;
  } catch (error) {
    sails.log.error(
      `${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`,
    );
    throw error;
  }
};

module.exports = {
  createRolesAppVersion,
  updateRolesAppVersion,
  getRolesAppVersion,
};
