const passport = require("passport");
const AuthService = require("../services/AuthService");
const {
  findAllUserNotifications,
  createUserNotification,
} = require("../modules/v1/UserNotification/UserNotificationDao");

const businessUnitExtractionService = require("../config_service_extraction/businessUnitExtraction");
const companyExtractionService = require("../config_service_extraction/companiesExtraction");
const locationExtractionService = require("../config_service_extraction/locationsExtraction");
const userRolesExtractionService = require("../rbac_service_extraction/userRolesService");
const rolesExtractionService = require("../rbac_service_extraction/rolesService");

async function _onUserPassportAuth(req, res, error, user, info) {
  if (error) return res.serverError(error);
  if (user) {
    try {
      let user_roles = await userRolesExtractionService.find({ userId: user.id, select: 'userId,roleId' });
      if (!user_roles) {
        return res.unauthorized("Role not authorized", {
          code: "E_WRONG_ROLE",
        });
      }
      let user_role_ids = user_roles.map((role) => role.role_id);
      var flag = false;
      if (user.disabled) {
        return res.unauthorized("User account is disabled", {
          code: "E_DISABLED_USER",
        });
      }

      if (req.param("role_id") instanceof Array) {
        // if any role in the array is assigned to user (should be changed later)
        for (var role of req.param("role_id")) {
          if (user_role_ids.includes(parseInt(role))) {
            flag = true;
          }
        }
      } else {
        if (user_role_ids.includes(parseInt(req.param("role_id")))) {
          flag = true;
        }
      }
      const dbRole = await rolesExtractionService.findOne({ id: user_roles[0].role_id, disabled: false });
      if (!dbRole) {
        return res.unauthorized("Role not authorized", {
          code: "E_WRONG_ROLE",
        });
      }
      user.role = dbRole;
      if (!flag) {
        return res.unauthorized("Role not authorized", {
          code: "E_WRONG_ROLE",
        });
      }

      try {
        let accessHierarchy = await AuthStoreService.getUserAccessHierarchy(
          user
        );
        user["accessHierarchy"] = accessHierarchy;
        if (user.role.id != Constants.HyprRoles.ADMIN) {
          if (
            [Constants.HyprRoles.COMPANY_OWNER].includes(
              typeof user.role.id == "string"
                ? parseInt(user.role.id)
                : user.role.id
            )
          ) {
            const company = await companyExtractionService.findOne();
            if (!accessHierarchy.companies.includes(company.id)) {
              return res.unauthorized("All assigned companies are disabled", {
                code: "E_DISABLED_COMPANIES",
              });
            }
          } else if (user.role.id == Constants.HyprRoles.BU_MANAGER) {
            const bus = (await businessUnitExtractionService.find(
              { id: accessHierarchy.business_units, disabled: false },
            )).map(bu => bu.id);
            if (bus.length == 0 || (bus.length == 1 && bus[0] == 0)) {
              return res.unauthorized("All assigned bu's are disabled", {
                code: "E_DISABLED_BU'S",
              });
            }
          } else {
            const locations = (await locationExtractionService.find(
              { id: accessHierarchy.locations, disabled: false, allData: true },
            )).map(loc => loc.id);
            if (
              locations.length == 0 ||
              (locations.length == 1 && locations[0] == 0)
            ) {
              return res.unauthorized("All assigned locations are disabled", {
                code: "E_DISABLED_LOCATIONS",
              });
            }
          }
        }
      } catch (err) {
        console.log(err);
      }
      user.player_id = req.param("player_id");

      if (!GeneralHelper.emptyOrAllParam(req.param("player_id"), true)) {
        let notification = await findAllUserNotifications({
          user_id: user.id,
          player_id: req.param("player_id"),
        });
        (notification && notification.length > 0) ||
          user.role.id == Constants.HyprRoles.SUPERVISOR
          ? null
          : await createUserNotification({
            user_id: user.id,
            player_id: req.param("player_id"),
          });
      }
      let company_id = null;
      if (
        user.accessHierarchy.companies &&
        user.accessHierarchy.companies.length > 0
      ) {
        company_id = user.accessHierarchy.companies[0];
      } else if (
        user.accessHierarchy.business_units &&
        user.accessHierarchy.business_units.length > 0
      ) {
        let bu = await businessUnitExtractionService.findOne({
          id: user.accessHierarchy.business_units[0],
        });
        user["companyDetails"] = await companyExtractionService.find({ id: bu.company_id });
        company_id = bu.company_id.id;
      } else if (
        user.accessHierarchy.locations &&
        user.accessHierarchy.locations.length > 0
      ) {
        let location = await locationExtractionService.findOne({
          id: user.accessHierarchy.locations[0],
        });
        company_id = location.company_id;
      }
      let token = await AuthService.createTokenAndCache(user);
      if (company_id) {
        // user = await AuthService.getUserAccountSettings(user, company_id);
      }
      if (!user.settings) user.settings = {};
      return res.ok({
        token: token,
        user: user,
      });
    } catch (err) {
      res.serverError(err);
    }
  } else {
    console.log("RETURNING FROM HERE");
    return res.unauthorized(info.message, {
      code: info.code,
    });
  }
}

module.exports = {
  signin: async function (req, res, next) {
    const { headers: { app_version } } = req;
    const { phone, role_id } = req.allParams();
    await AuthService.checkLogisticsAppVersion(app_version, role_id);
    sails.log.info(`AuthController.signin Params: ${JSON.stringify(req.allParams())}`);
    if (phone) {
      const username = await AuthService.getUsernameFromPhone(phone, role_id);
      if (!username) {
        return res.badRequest("user not found")
      }
      /* NOTE: adding username to request body to make passport work */
      req.body["username"] = username;
    }
    passport.authenticate(
      "user-local",
      _onUserPassportAuth.bind(this, req, res)
    )(req, res);
  },
};
