const {
  rolesAppVersionService: {
    createRolesAppVersion,
    updateRolesAppVersion,
  },
} = require("../../modules/v1/RolesAppVersion");
const {
  constants: {
    request: {
      VERSIONING: { v1 },
    },
  },
} = require("../../constants/http");

const createAppVersion = async (req, res) => {
  const logIdentifier = `API version: ${v1}, context:RolesAppVersionController.createAppVersion()`;
  const { role_id, os, minimum_version, general_app_version } = req.body;

  try {
    sails.log(
      `${logIdentifier} called with params -> ${JSON.stringify(req.body)}`,
    );
    await createRolesAppVersion(role_id, os, minimum_version, general_app_version);
    sails.log(`${logIdentifier} Roles based app version created successfully`);
    res.ok();
  } catch (error) {
    sails.log.error(
      `${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`,
    );
    res.error(error);
  }
};

const updateAppVersion = async (req, res) => {
  const logIdentifier = `API version: ${v1}, context:RolesAppVersionController.updateAppVersion()`;
  const {
    id,
    role_id,
    os,
    minimum_version,
    general_app_version,
    disable,
  } = req.body;

  try {
    sails.log(
      `${logIdentifier} called with params -> ${JSON.stringify(req.body)}`,
    );
    await updateRolesAppVersion(id, role_id, os, minimum_version, general_app_version, disable);
    sails.log(`${logIdentifier} Roles based app version updated successfully`);
    res.ok();
  } catch (error) {
    sails.log.error(
      `${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`,
    );
    res.error(error);
  }
};

module.exports = {
  createAppVersion,
  updateAppVersion,
};
