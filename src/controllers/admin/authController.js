const Transformer = require("object-transformer");
const bcrypt = require("bcrypt");
const ip = require("ip");
const axios = require("axios");
const Response = require("../../services/Response");
const Constants = require("../../services/Constants");
const {
  loginValidation,
  logoutAndBlockValidation,
  resetPasswordValidation,
  changePasswordValidation,
} = require("../../services/AdminValidation");
const { Login } = require("../../transformers/admin/adminAuthTransformer");
const { User, UserLoginHistory } = require("../../models");
const { issueAdmin } = require("../../services/Admin_jwtToken");

module.exports = {
  /**
   * @description This function is for admin Login.
   * @param req
   * @param res
   */
  login: async (req, res) => {
    try {
      const reqParam = req.body;
      loginValidation(reqParam, res, async (validate) => {
        if (validate) {
          let admin = await User.findOne({
            username: reqParam.username.toLowerCase(),
            role: { $ne: Constants.ROLES.USER },
          });

          if (admin) {
            if (admin?.status === Constants.ACTIVE) {
              const comparePassword = await bcrypt.compare(
                reqParam.password,
                admin.password
              );

              if (comparePassword) {
                console.log(admin.role);
                if (admin.role === Constants.ROLES.ACCOUNTS_MANAGER) {
                  admin = await admin.populate(
                    "parents.parent_id",
                    "balance username creditReference"
                  );
                  admin.creditReference =
                    admin?.parents[0]?.parent_id?.creditReference;
                  admin.balance = admin?.parents[0]?.parent_id?.balance;
                }
                const alreadyExitList = await User.find(
                  {},
                  { username: 1, email: 1, mobileNo: 1 }
                );

                let system_ip = ip.address(); //system ip address

                let browser_ip = await axios.get(
                  "https://api.ipify.org/?format=json" //get browser ip address
                );

                const superAdminExpTime =
                  Math.floor(Date.now() / 1000) +
                  60 * 60 * 24 * process.env.SUPER_ADMIN_TOKEN_EXP;

                const payload = {
                  id: admin.id,
                  role: admin.role,
                  exp: superAdminExpTime,
                  sportShares: admin.sportShares,
                };
                const token = issueAdmin(payload);
                const meta = { token };

                let loginHistory = await UserLoginHistory.findOne({
                  userId: admin.id,
                });
                let loginHistoryObject = {};
                if (loginHistory) {
                  loginHistoryObject = {
                    loginDetails: {
                      ip_address: {
                        system_ip: system_ip,
                        browser_ip: browser_ip?.data?.ip,
                      },
                      last_login: new Date(),
                    },
                  };

                  let update = {};
                  if (loginHistory?.loginDetails?.length !== 10) {
                    tenRecords = loginHistoryObject;
                    update = {
                      $push: {
                        loginDetails: loginHistoryObject?.loginDetails,
                      },
                    };
                  } else {
                    update = {
                      $set: {
                        loginDetails: [],
                      },
                    };
                  }

                  await UserLoginHistory.updateOne(
                    { userId: admin._id },
                    update
                  );
                } else {
                  loginHistoryObject = {
                    userId: admin._id,
                    loginDetails: {
                      ip_address: {
                        system_ip: system_ip,
                        browser_ip: browser_ip?.data?.ip,
                      },
                      last_login: new Date(),
                    },
                  };

                  await UserLoginHistory.create(loginHistoryObject);
                }
                console.log(admin, Login);
                const adminObj = {
                  admin: admin,
                  alreadyExitList: alreadyExitList,
                };
                return Response.successResponseData(
                  res,
                  new Transformer.Single(adminObj, Login).parse(),
                  Constants.SUCCESS,
                  res.locals.__("loginSuccess"),
                  meta
                );
              } else {
                return Response.errorResponseWithoutData(
                  res,
                  res.locals.__("userNamePasswordNotMatch"),
                  Constants.BAD_REQUEST
                );
              }
            } else {
              Response.errorResponseWithoutData(
                res,
                res.locals.__("accountIsInactive"),
                Constants.FAIL
              );
            }
          } else {
            Response.errorResponseWithoutData(
              res,
              res.locals.__("userNameNotExist"),
              Constants.FAIL
            );
          }
        }
      });
    } catch (error) {
      return Response.errorResponseData(
        res,
        res.__("internalError"),
        Constants.INTERNAL_SERVER
      );
    }
  },

  /**
   * @description This function is for reset password of admin.
   * @param req
   * @param res
   */
  resetPassword: async (req, res) => {
    try {
      const reqParam = req.body;
      const { authAdminId } = req;
      resetPasswordValidation(reqParam, res, async (validate) => {
        if (validate) {
          const admin = await User.findOne({ _id: authAdminId });

          const comparePassword = await bcrypt.compare(
            reqParam.password,
            admin?.password
          );
          if (comparePassword) {
            const hash = bcrypt.hashSync(reqParam.resetPassword, 10);

            let userObj = {
              password: hash,
              passwordText: reqParam.resetPassword,
            };

            await User.updateOne(
              { _id: { $eq: reqParam.userId } },
              { $set: userObj }
            );

            return Response.successResponseWithoutData(
              res,
              res.locals.__("passwordResetSuccessfully"),
              Constants.SUCCESS
            );
          } else {
            return Response.errorResponseWithoutData(
              res,
              res.locals.__("youarenotauthenticated"),
              Constants.BAD_REQUEST
            );
          }
        }
      });
    } catch (error) {
      return Response.errorResponseData(
        res,
        res.__("internalError"),
        Constants.INTERNAL_SERVER
      );
    }
  },

  changePassword: async (req, res) => {
    try {
      const { authAdminId } = req;
      const requestParams = req.body;
      changePasswordValidation(requestParams, res, async (validate) => {
        if (validate) {
          if (requestParams.old_password !== requestParams.password) {
            if (requestParams.password === requestParams.confirm_password) {
              const userData = await User.findOne(
                { _id: authAdminId },
                { password: 1 }
              );
              if (userData) {
                const passValid = await bcrypt.compare(
                  requestParams.old_password,
                  userData.password
                );
                if (passValid) {
                  const passHash = await bcrypt.hashSync(
                    requestParams.password,
                    10
                  );
                  await User.updateOne(
                    { _id: authAdminId },
                    {
                      $set: {
                        password: passHash,
                        passwordText: requestParams.password,
                      },
                    }
                  );
                  return Response.successResponseWithoutData(
                    res,
                    res.locals.__("passwordChanged"),
                    Constants.SUCCESS
                  );
                } else {
                  return Response.errorResponseWithoutData(
                    res,
                    res.locals.__("incorrectPassword"),
                    Constants.BAD_REQUEST
                  );
                }
              } else {
                return Response.errorResponseWithoutData(
                  res,
                  res.locals.__("youarenotauthenticated"),
                  Constants.BAD_REQUEST
                );
              }
            } else {
              return Response.errorResponseWithoutData(
                res,
                res.locals.__("password&ConfirmPasswordDoesNotMatch"),
                Constants.BAD_REQUEST
              );
            }
          } else {
            return Response.errorResponseWithoutData(
              res,
              res.locals.__("thisPasswordnotallowed"),
              Constants.BAD_REQUEST
            );
          }
        }
      });
    } catch (error) {
      return Response.errorResponseData(
        res,
        res.__("internalError"),
        Constants.INTERNAL_SERVER
      );
    }
  },

  /**
   * @description "This function is to logout and block user."
   * @param req
   * @param res
   */
  logoutAndBlock: async (req, res) => {
    try {
      const requestParams = req.body;
      logoutAndBlockValidation(requestParams, res, async (validate) => {
        if (validate) {
          let userObj = {};
          if (requestParams.action_type === "logout") {
            userObj = {
              ...userObj,
              _id: requestParams.id,
              token: null,
            };
          }
          if (requestParams.action_type === "block") {
            userObj = {
              ...userObj,
              _id: requestParams.id,
              status: Constants.INACTIVE,
              token: null,
            };
          }

          await User.updateOne(
            { _id: requestParams.id },
            {
              $set: userObj,
            }
          );

          return Response.successResponseWithoutData(
            res,
            requestParams.action_type === "logout"
              ? res.locals.__("logout")
              : res.locals.__("logoutAndBlocked"),
            Constants.SUCCESS
          );
        }
      });
    } catch (error) {
      return Response.errorResponseWithoutData(
        res,
        res.locals.__("internalError"),
        Constants.INTERNAL_SERVER
      );
    }
  },

  /**
   * @description "This function is to get auth detail."
   * @param req
   * @param res
   */
  authDetail: async (req, res) => {
    try {
      const reqParam = req.query;
      let admin = await User.findOne({
        username: reqParam.username.toLowerCase(),
        role: { $ne: Constants.ROLES.USER },
      });

      const alreadyExitList = await User.find(
        {},
        { username: 1, email: 1, mobileNo: 1 }
      );
      if (admin.role === Constants.ROLES.ACCOUNTS_MANAGER) {
        admin = await admin.populate(
          "parents.parent_id",
          "balance username creditReference"
        );
        admin.creditReference = admin?.parents[0]?.parent_id?.creditReference;
        admin.balance = admin?.parents[0]?.parent_id?.balance;
      }

      const adminObj = {
        admin: admin,
        alreadyExitList: alreadyExitList,
      };

      return Response.successResponseData(
        res,
        new Transformer.Single(adminObj, Login).parse(),
        Constants.SUCCESS,
        res.locals.__("loginSuccess")
      );
    } catch (error) {
      return Response.errorResponseWithoutData(
        res,
        res.locals.__("internalError"),
        Constants.INTERNAL_SERVER
      );
    }
  },
};
