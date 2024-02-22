const Transformer = require("object-transformer");
const ip = require("ip");
const axios = require("axios");
const bcrypt = require("bcrypt");
const Response = require("../../services/Response");
const {
  SUCCESS,
  INTERNAL_SERVER,
  ACTIVE,
  FAIL,
  BAD_REQUEST,
} = require("../../services/Constants");
const Helper = require("../../services/Helper");
const Mailer = require("../../services/Mailer");
const {
  loginValidation,
  logoutValidation,
  forgotPasswordValidation,
  resetPassValidation,
} = require("../../services/UserValidation");
const { changePasswordValidation } = require("../../services/AdminValidation");
const { Login } = require("../../transformers/user/userAuthTransformer");
const { User, Otp, Transaction, ResultTransaction } = require("../../models");
const { issueUser } = require("../../services/User_jwtToken");
const { app } = require("../../../server.js");

module.exports = {
  /**
   * @description "This function is for User-Login."
   * @param req
   * @param res
   */
  login: async (req, res) => {
    try {
      const reqParam = req.body;
      loginValidation(reqParam, res, async (validate) => {
        if (validate) {
          let findQuery = {};

          findQuery = {
            $or: [
              { email: { $eq: reqParam.user } },
              { username: { $eq: reqParam.user } },
            ],
          };

          const user = await User.findOne(findQuery);

          let browser_ip =
            req.headers["x-forwarded-for"] || req.connection.remoteAddress;

          const system_ip = req.clientIp;
          if (user) {
            if (user?.status === ACTIVE) {
              const comparePassword = await bcrypt.compare(
                reqParam.password,
                user.password
              );
              if (comparePassword) {
                const USER_TOKEN_EXPIRY_TIME =
                  Math.floor(Date.now() / 1000) +
                  60 * 60 * 24 * process.env.USER_TOKEN_EXP;

                const payload = {
                  id: user._id,
                  exp: USER_TOKEN_EXPIRY_TIME,
                };

                const token = issueUser(payload);
                const meta = { token };
                let tokenUpdate = {};

                tokenUpdate = {
                  $set: {
                    last_login: new Date(),
                    token: token,
                    "ip_address.system_ip": system_ip,
                    "ip_address.browser_ip": browser_ip,
                  },
                };

                await User.updateOne({ _id: user?._id }, tokenUpdate);

                return Response.successResponseData(
                  res,
                  new Transformer.Single(user, Login).parse(),
                  SUCCESS,
                  res.locals.__("loginSuccess"),
                  meta
                );
              } else {
                return Response.errorResponseWithoutData(
                  res,
                  res.locals.__("emailPasswordNotMatch"),
                  BAD_REQUEST
                );
              }
            } else {
              Response.errorResponseWithoutData(
                res,
                res.locals.__("accountIsInactive"),
                FAIL
              );
            }
          } else {
            Response.errorResponseWithoutData(
              res,
              res.locals.__("userNameNotExist"),
              FAIL
            );
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
   * @description This function is for Forgot Password of user.
   * @param req
   * @param res
   */
  forgotPassword: async (req, res) => {
    try {
      const reqParam = req.body;
      forgotPasswordValidation(reqParam, res, async (validate) => {
        if (validate) {
          const minutesLater = new Date();
          const restTokenExpire = minutesLater.setMinutes(
            minutesLater.getMinutes() + 60
          );
          const otp = await Helper.makeRandomNumber(10);
          let user = await User.findOne(
            { email: reqParam.email },
            { name: 1, status: 1 }
          );

          if (user) {
            const locals = {
              appName: Helper.AppName,
              otp,
            };
            if (user?.status === ACTIVE) {
              await User.updateOne(
                { _id: user._id },
                {
                  $set: {
                    otp: otp,
                    code_expiry: restTokenExpire,
                  },
                }
              );

              await Mailer.sendMail(
                reqParam.email,
                "Forgot Password",
                Helper.forgotTemplate,
                locals
              );

              return Response.successResponseData(
                res,
                otp,
                SUCCESS,
                res.locals.__("forgotPasswordEmailSendSuccess")
              );
            } else {
              Response.errorResponseWithoutData(
                res,
                res.locals.__("accountIsInactive"),
                FAIL
              );
            }
          } else {
            Response.errorResponseWithoutData(
              res,
              res.locals.__("emailNotExists"),
              FAIL
            );
          }
        }
      });
    } catch (error) {
      return Response.errorResponseData(res, error.message, INTERNAL_SERVER);
    }
  },

  /**
   * @description This function is for reset Password of user with otp verification.
   * @param req
   * @param res
   */
  resetPassword: async (req, res) => {
    try {
      const reqParam = req.body;
      resetPassValidation(reqParam, res, async (validate) => {
        if (validate) {
          const valid = await User.findOne(
            { email: reqParam.email, otp: reqParam.otp },
            { otp: 1, email: 1, code_expiry: 1, password: 1 }
          );
          if (valid && reqParam.email === valid?.email) {
            if (valid.code_expiry != null) {
              if (valid.code_expiry.getTime() >= Date.now()) {
                const passCheck = await bcrypt.compare(
                  reqParam.password,
                  valid?.password
                );
                if (!passCheck) {
                  const hashPass = bcrypt.hashSync(reqParam?.password, 10);
                  await User.findByIdAndUpdate(valid?._id, {
                    $set: { password: hashPass, otp_expiry: null },
                  });

                  return Response.successResponseWithoutData(
                    res,
                    res.locals.__("PasswordResetSuccessfully"),
                    SUCCESS
                  );
                } else {
                  return Response.errorResponseWithoutData(
                    res,
                    res.locals.__("thisPasswordnotallowed"),
                    BAD_REQUEST
                  );
                }
              } else {
                return Response.errorResponseWithoutData(
                  res,
                  res.locals.__("otpExpired"),
                  BAD_REQUEST
                );
              }
            } else {
              return Response.errorResponseWithoutData(
                res,
                res.locals.__("invalidOtp"),
                BAD_REQUEST
              );
            }
          } else {
            return Response.errorResponseWithoutData(
              res,
              res.locals.__("invalidOtp"),
              BAD_REQUEST
            );
          }
        }
      });
    } catch (error) {
      return Response.errorResponseData(res, error.message, INTERNAL_SERVER);
    }
  },

  /**
   * @description This function is for change Password of user.
   * @param req
   * @param res
   */

  changePassword: async (req, res) => {
    try {
      const { authUserId } = req;
      const requestParams = req.body;
      changePasswordValidation(requestParams, res, async (validate) => {
        if (validate) {
          if (requestParams.old_password !== requestParams.password) {
            if (requestParams.password === requestParams.confirm_password) {
              const userData = await User.findOne(
                { _id: authUserId, role: ROLES?.USER },
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
                    { _id: authUserId },
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
                    SUCCESS
                  );
                } else {
                  return Response.errorResponseWithoutData(
                    res,
                    res.locals.__("incorrectPassword"),
                    BAD_REQUEST
                  );
                }
              } else {
                return Response.errorResponseWithoutData(
                  res,
                  res.locals.__("youarenotauthenticated"),
                  BAD_REQUEST
                );
              }
            } else {
              return Response.errorResponseWithoutData(
                res,
                res.locals.__("password&ConfirmPasswordDoesNotMatch"),
                BAD_REQUEST
              );
            }
          } else {
            return Response.errorResponseWithoutData(
              res,
              res.locals.__("thisPasswordnotallowed"),
              BAD_REQUEST
            );
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
   * @description "This function is to logout user."
   * @param req
   * @param res
   */
  logout: async (req, res) => {
    try {
      const requestParams = req.body;
      console.log("requestParams logout", requestParams);
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
   * @description "This function is to get user data."
   * @param req
   * @param res
   */
  getUserDetail: async (req, res) => {
    try {
      const { authUserId } = req;

      const user = await User.findOne({
        $and: [{ status: { $eq: ACTIVE } }, { _id: { $eq: authUserId } }],
      });

      const transaction = await Transaction.find(
        {
          $or: [{ fromId: { $in: authUserId } }, { toId: { $in: authUserId } }],
        },
        { transaction_type: 1, amount: 1 }
      );

      const resultTransaction = await ResultTransaction.find(
        { userId: authUserId },
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

      const total_win = resultTransaction.reduce((accumulator, currentValue) => {
        if (currentValue?.transaction_type === "win") {
          return accumulator + currentValue?.amount;
        }
        return accumulator;
      }, 0);

      const total_loss = resultTransaction.reduce((accumulator, currentValue) => {
        if (currentValue?.transaction_type === "loss") {
          return accumulator + currentValue?.amount;
        }
        return accumulator;
      }, 0);

      const userObj = {
        name: user.name,
        username: user.username,
        type: user.type,
        email: user.email,
        mobileNo: user.mobileNo,
        balance: user.balance,
        totalDeposit: totalDeposit,
        totalWithdrawl: totalWithdrawl,
        total_pl: total_pl,
        total_win: total_win,
        total_loss: total_loss,
      };

      Response.successResponseData(res, userObj, SUCCESS, res.__("success"));
    } catch (error) {
      console.log("error", error);
      return Response.errorResponseWithoutData(
        res,
        res.locals.__("internalError"),
        INTERNAL_SERVER
      );
    }
  },
};
