const Transformer = require("object-transformer");
const bcrypt = require("bcrypt");
const ip = require("ip");
const axios = require("axios");
const Response = require("../../services/Response");
const Constants = require("../../services/Constants");
const { ROLES, ACTIVE } = require("../../services/Constants");
const {
  loginValidation,
  logoutAndBlockValidation,
  resetPasswordValidation,
  changePasswordValidation,
} = require("../../services/AdminValidation");
const { Login } = require("../../transformers/admin/adminAuthTransformer");
const {
  User,
  UserLoginHistory,
  Transaction,
  ResultTransaction,
} = require("../../models");
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
            type: { $eq: 1 },
          });

          if (admin) {
            if (admin?.status === ACTIVE) {
              const comparePassword = await bcrypt.compare(
                reqParam.password,
                admin.password
              );

              if (comparePassword) {
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
                  id: admin._id,
                  type: admin.type,
                  exp: superAdminExpTime,
                };
                const token = issueAdmin(payload);
                const meta = { token };

                let loginHistory = await UserLoginHistory.findOne({
                  userId: admin._id,
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

                const adminObj = {
                  name: admin.name,
                  username: admin.username,
                  type: admin.type,
                  email: admin.email,
                  mobileNo: admin.mobileNo,
                  balance: admin.balance,
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
      const { authAdminId } = req;
      let admin = await User.findOne({
        _id: authAdminId,
        type: { $eq: 1 },
      });

      const alreadyExitList = await User.find(
        {},
        { username: 1, email: 1, mobileNo: 1 }
      );

      const transaction = await Transaction.find(
        {},
        { transaction_type: 1, amount: 1 }
      );

      const resultTransaction = await ResultTransaction.find(
        {},
        { pl: 1 }
      );

      const totalDeposit = transaction.reduce((accumulator, currentValue) => {
        if (currentValue?.transaction_type === "deposit") {
          let total = accumulator + currentValue?.amount;
          return total;
        }
        
        // Always return the accumulator if the condition is not met
        return accumulator;
      }, 0);

      const totalWithdrawl = transaction.reduce((accumulator, currentValue) => {
        if (currentValue?.transaction_type === "withdrawl") {
          return accumulator + currentValue?.amount;
        }
        return accumulator;
      }, 0);

      const total_pl = resultTransaction.reduce((accumulator, currentValue) => {
          return accumulator + currentValue?.pl;
      }, 0);

      console.log({totalDeposit:totalDeposit,totalWithdrawl:totalWithdrawl,total_pl:total_pl});
      const adminObj = {
        name: admin.name,
        username: admin.username,
        type: admin.type,
        email: admin.email,
        mobileNo: admin.mobileNo,
        balance: admin.balance,
        totalDeposit: totalDeposit,
        totalWithdrawl: totalWithdrawl,
        total_pl: total_pl,
        alreadyExitList: alreadyExitList,
      };

      return Response.successResponseData(
        res,
        new Transformer.Single(adminObj, Login).parse(),
        Constants.SUCCESS,
        res.locals.__("success")
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
