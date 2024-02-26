const Transformer = require("object-transformer");
const bcrypt = require("bcrypt");
const Response = require("../../services/Response");
const Constants = require("../../services/Constants");
const {
  SUCCESS,
  INTERNAL_SERVER,
  FAIL,
} = require("../../services/Constants");
const {
  loginValidation,
  resetPasswordValidation,
  changePasswordValidation,
  logoutValidation
} = require("../../services/AdminValidation");
const { Login } = require("../../transformers/admin/adminAuthTransformer");
const { LoginUser } = require("../../transformers/user/userAuthTransformer");
const {
  User,
  Transaction,
  ResultTransaction,
} = require("../../models");
const { authLogin, userLogin } = require("../auth");

module.exports = {
  /**
   * @description This function is for admin Login.
   * @param req
   * @param res
   */
  loginSwitch: async (req, res) => {
    try {
      const reqParam = req.body;
      loginValidation(reqParam, res, async (validate) => {
        if (validate) {
          let user = await User.findOne(
            {
              username: reqParam.user.toLowerCase(),
            },
            { type: 1 }
          );

          if (user?.type === 1) {
            let authData = await authLogin(req, res, reqParam);
      
            if (authData === "accountIsInactive") {
              Response.errorResponseWithoutData(
                res,
                res.locals.__("accountIsInactive"),
                FAIL
              );
            } else if (authData === "userNamePasswordNotMatch") {
              return Response.errorResponseWithoutData(
                res,
                res.locals.__("userNamePasswordNotMatch"),
                BAD_REQUEST
              );
            } else if (authData === "userNameNotExist") {
              Response.errorResponseWithoutData(
                res,
                res.locals.__("userNameNotExist"),
                FAIL
              );
            } else {
              return Response.successResponseData(
                res,
                new Transformer.Single(authData?.adminObj, Login).parse(),
                SUCCESS,
                res.locals.__("loginSuccess"),
                authData?.meta
              );
            }
          } else {
            let userData = await userLogin(req, res, reqParam);
            if (userData === "accountIsInactive") {
              Response.errorResponseWithoutData(
                res,
                res.locals.__("accountIsInactive"),
                FAIL
              );
            } else if (userData === "emailPasswordNotMatch") {
              return Response.errorResponseWithoutData(
                res,
                res.locals.__("emailPasswordNotMatch"),
                BAD_REQUEST
              );
            } else if (userData === "userNameNotExist") {
              Response.errorResponseWithoutData(
                res,
                res.locals.__("userNameNotExist"),
                FAIL
              );
            } else {
              return Response.successResponseData(
                res,
                new Transformer.Single(userData?.user, LoginUser).parse(),
                SUCCESS,
                res.locals.__("loginSuccess"),
                userData?.meta
              );
            }
          }
        }
      });
    } catch (error) {
      return Response.errorResponseData(
        res,
        res.__("internalError"),
        INTERNAL_SERVER
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
   * @description "This function is to logout user."
   * @param req
   * @param res
   */
   logout: async (req, res) => {
    try {
      const requestParams = req.body;
      logoutValidation(requestParams, res, async (validate) => {
        if (validate) {
          await User.updateOne(
            { username: requestParams.user_id },
            {
              $set: {
                token: null,
                "ip_address.system_ip": null,
                "ip_address.browser_ip": null,
              },
            }
          );

          return Response.successResponseWithoutData(
            res,
            res.locals.__("logout"),
            SUCCESS
          );
        }
      });
    } catch (error) {
      return Response.errorResponseWithoutData(
        res,
        res.locals.__("internalError"),
        INTERNAL_SERVER
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

      const resultTransaction = await ResultTransaction.find({}, { pl: 1 });

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
