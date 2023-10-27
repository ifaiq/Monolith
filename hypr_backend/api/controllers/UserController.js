module.exports = {
  saveLogoutNotificationId: function (req, res) {
    var params = req.allParams();
    params.user_id = res.locals.userData.id;
    params.session_uuid = res.locals.userData.session_uuid;
    UserService.destroyNotificationId(params)
      .then(async function (response) {
        console.log(
          params.isCustomer
            ? "CUSTOMER"
            : "USER" + " NOTIFICATION RECORD DELETED SUCCESSFULLY"
        );
        let obj = {};
        if (params.isCustomer) obj["customer_id"] = res.locals.userData.id;
        else obj["user_id"] = res.locals.userData.id;
        obj["session_uuid"] = res.locals.userData.session_uuid;
        await AuthService.clearSessions(obj);
        res.ok(response);
      })
      .catch(function (error) {
        res.serverError(error);
      });
  },
  changePassword: async function (req, res, next) {
    var params = req.allParams();
    var encrypted_password = CipherService.hashPassword(params.password);
    try {
      let user = await User.updateAndClearSessions(params.user_id, {
        password: encrypted_password,
      });
      res.ok();
    } catch (err) {
      res.serverError(err);
    }
  },
};
