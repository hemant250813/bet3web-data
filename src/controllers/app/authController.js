const Transformer = require("object-transformer");
const ip = require("ip");
const axios = require("axios");
const bcrypt = require("bcrypt");
const Response = require("../../services/Response");
const Constants = require("../../services/Constants");
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
const { User, Otp } = require("../../models");
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
      console.log("reqParam", reqParam);
      loginValidation(reqParam, res, async (validate) => {
        if (validate) {
          const user = await User.findOne({
            email: reqParam.email.toLowerCase(),
          });

          let browser_ip =
            req.headers["x-forwarded-for"] || req.connection.remoteAddress;

          const system_ip = req.clientIp;
          if (user) {
            if (user?.status === Constants.ACTIVE) {
              const comparePassword = await bcrypt.compare(
                reqParam.password,
                user.password
              );
              if (comparePassword) {
                const userExpTime = Math.floor(Date.now() / 1000) + 3600;

                const payload = {
                  id: user._id,
                  role: user.role,
                  exp: userExpTime,
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
                  Constants.SUCCESS,
                  res.locals.__("loginSuccess"),
                  meta
                );
              } else {
                return Response.errorResponseWithoutData(
                  res,
                  res.locals.__("emailPasswordNotMatch"),
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
   * @description This function is for Forgot Password of user.
   * @param req
   * @param res
   */
  forgotPassword: async (req, res) => {
    try {
      const reqParam = req.body;
      console.log("forgotPassword", reqParam);
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
            if (user?.status === Constants.ACTIVE) {
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
                Constants.SUCCESS,
                res.locals.__("forgotPasswordEmailSendSuccess")
              );
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
              res.locals.__("emailNotExists"),
              Constants.FAIL
            );
          }
        }
      });
    } catch (error) {
      return Response.errorResponseData(
        res,
        error.message,
        Constants.INTERNAL_SERVER
      );
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
      console.log("resetPassword", reqParam);
      resetPassValidation(reqParam, res, async (validate) => {
        if (validate) {
          console.log("validate ");
          const valid = await User.findOne(
            { email: reqParam.email, otp: reqParam.otp },
            { otp: 1, email: 1, code_expiry: 1, password: 1 }
          );
          if (valid && reqParam.email === valid?.email) {
            if (valid.code_expiry != null) {
              if (valid.code_expiry.getTime() >= Date.now()) {
                console.log("valid", valid?.password);
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
                    Constants.SUCCESS
                  );
                } else {
                  return Response.errorResponseWithoutData(
                    res,
                    res.locals.__("thisPasswordnotallowed"),
                    Constants.BAD_REQUEST
                  );
                }
              } else {
                return Response.errorResponseWithoutData(
                  res,
                  res.locals.__("otpExpired"),
                  Constants.BAD_REQUEST
                );
              }
            } else {
              return Response.errorResponseWithoutData(
                res,
                res.locals.__("invalidOtp"),
                Constants.BAD_REQUEST
              );
            }
          } else {
            return Response.errorResponseWithoutData(
              res,
              res.locals.__("invalidOtp"),
              Constants.BAD_REQUEST
            );
          }
        }
      });
    } catch (error) {
      return Response.errorResponseData(
        res,
        error.message,
        Constants.INTERNAL_SERVER
      );
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
                { _id: authUserId, role: Constants?.ROLES?.USER },
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
   * @description "This function is to get user data."
   * @param req
   * @param res
   */
  getUserDetail: async (req, res) => {
    try {
      const { authUserId } = req;

      const user = await User.findOne({
        $and: [
          { status: { $eq: Constants?.ACTIVE } },
          { _id: { $eq: authUserId } },
        ],
      });

      Response.successResponseData(
        res,
        user,
        Constants.SUCCESS,
        res.__("success")
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
