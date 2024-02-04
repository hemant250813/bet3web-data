const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const moment = require("moment");
const Response = require("../../services/Response");
const {
  ACTIVE,
  INACTIVE,
  SUCCESS,
  MAIL_SUBJECT_MESSAGE_REGISTRATION,
  MAIL_SUBJECT_MESSAGE_RESEND_OTP,
  VERIFY_EMAIL,
  FAIL,
  BAD_REQUEST,
  GALLERY,
  BALANCE,
} = require("../../services/Constants");
const {
  generateRandomNumber,
  AppName,
  newRegistration,
  resendOtp,
  verifyEmail,
} = require("../../services/Helper");
const Mailer = require("../../services/Mailer");
const { User, Otp } = require("../../models");
const {
  userRegisterValidation,
  resendOtpValidation,
  verifyOtpValidation,
} = require("../../services/UserValidation");

module.exports = {
  /**
   * @description "This function is to check the username is already exist or not in the database."
   * @param req
   * @param res
   */
  onChangeUserIsExistCheck: async (req, res) => {
    try {
      const requestParams = req.query;
      let query = {};
      if (requestParams.email) {
        query = { email: requestParams.email };
      } else if (requestParams.mobile_no) {
        query = { mobile_no: parseInt(requestParams.mobile_no) };
      } else if (requestParams.username) {
        query = { username: requestParams.username };
      }

      let user = await User.findOne(query, {
        username: 1,
        email: 1,
        mobile_no: 1,
      });
      if (user) {
        if (user.email !== undefined && user.email === requestParams.email) {
          return Response.successResponseWithoutData(
            res,
            res.__("emailAlreadyExist"),
            FAIL
          );
        } else if (
          user.mobile_no !== undefined &&
          user.mobile_no === requestParams.mobile_no
        ) {
          return Response.successResponseWithoutData(
            res,
            res.__("mobileAlreadyExist"),
            FAIL
          );
        } else if (
          user.username !== undefined &&
          user.username === requestParams.username
        ) {
          return Response.successResponseWithoutData(
            res,
            res.__("userAlreadyExist"),
            FAIL
          );
        }
      } else {
        return Response.successResponseWithoutData(
          res,
          res.__("usernameAvailable"),
          SUCCESS
        );
      }
    } catch (error) {
      return Response.errorResponseData(res, res.__("internalError"), error);
    }
  },

  /**
   * @description "This function is for User-Registration."
   * @param req
   * @param res
   */
  userRegistration: async (req, res) => {
    try {
      const requestParams = req.body;
      console.log("userRegistration", requestParams);
      // Below function will validate all the fields which we were passing from the body.
      userRegisterValidation(requestParams, res, async (validate) => {
        if (validate) {
          let user = await User.findOne(
            { username: requestParams.username },
            {
              username: 1,
            }
          );

          if (user) {
            return Response.successResponseWithoutData(
              res,
              res.__("userAlreadyExist"),
              SUCCESS
            );
          } else {
            const CURRENT_DATE = new Date();
            const OTP_TOKEN_EXPIRE = new Date(
              CURRENT_DATE.getTime() + process.env.OTP_EXPIRY_MINUTE * 60000
            );
            const OTP = await generateRandomNumber(6);

            const HASH_PASSWORD = await bcrypt.hash(requestParams.password, 10);

            let userObj = {
              username: requestParams.username,
              country: requestParams.country,
              email: requestParams.email,
              mobileNo: requestParams.mobile,
              verified: null,
              otp: OTP,
              otp_expiry: OTP_TOKEN_EXPIRE,
              passwordText: requestParams.password,
              password: HASH_PASSWORD,
              BALANCE: BALANCE,
              status: INACTIVE,
            };

            await User.create(userObj);

            const LOCALS = {
              username: requestParams.username,
              appName: AppName,
              otp: OTP,
            };

            await Mailer.sendMail(
              requestParams.email,
              MAIL_SUBJECT_MESSAGE_REGISTRATION,
              newRegistration,
              LOCALS
            );

            return Response.successResponseWithoutData(
              res,
              res.__("otpSent"),
              SUCCESS
            );
          }
        }
      });
    } catch (error) {
      return Response.errorResponseData(res, res.__("internalError"), error);
    }
  },

  /**
   * @description "This function is to verify email."
   * @param req
   * @param res
   */
  verifyEmail: async (req, res) => {  
    try {
      const requestParams = req.body;
      // Below function will validate all the fields which we are passing in the body.
      verifyOtpValidation(requestParams, res, async (validate) => {
        if (validate) {
          let findQuery = {
            $and: [
              { otp: { $eq: requestParams.otp } },
              { email: { $eq: requestParams.email } },
            ],
          };

          let user = await User.findOne(findQuery, { otp_expiry: 1 });
      
          if (user) {
            const CURRENT_TIME = new Date();
            const OTP_TOKEN_EXPIRE = new Date(user.otp_expiry);

            if (CURRENT_TIME.getTime() > OTP_TOKEN_EXPIRE.getTime()) {
              return Response.errorResponseWithoutData(
                res,
                res.locals.__("otpExpired"),
                FAIL
              );
            } else {
              const CURRENT_DATE_AND_TIME = moment().toDate();
              let query = {
                email: { $eq: requestParams.email },
              };

              await User.updateOne(query, {
                $set: {
                  verified: CURRENT_DATE_AND_TIME,
                  status: ACTIVE,
                  otp_expiry: null,
                },
              });

              return Response.successResponseWithoutData(
                res,
                res.__("emailVerified"),
                SUCCESS
              );
            }
          } else {
            return Response.errorResponseWithoutData(
              res,
              res.locals.__("invalidOtp"),
              FAIL
            );
          }
        }
      });
    } catch (error) {
      return Response.errorResponseData(res, res.__("internalError"), error);
    }
  },
  
  /**
   * @description "This function is for re-send OTP."
   * @param req
   * @param res
   */ 
  resendOtp: async (req, res) => {
    try {
      const requestParams = req.body;
      // Below function will validate all the fields which we are passing in the body.
      resendOtpValidation(requestParams, res, async (validate) => {
        if (validate) {
          let findQuery = {
            email: { $eq: requestParams.email },
          };  

          let user = await User.findOne(findQuery, { username: 1 });
        
          if (user) {
            var CURRENT_DATE = new Date();
            const OTP_TOKEN_EXPIRE = new Date(
              CURRENT_DATE.getTime() + process.env.OTP_EXPIRY_MINUTE * 60000
            );
            const OTP = await generateRandomNumber(6);

            await User.updateOne(findQuery, {
              $set: {
                otp: OTP,
                otp_expiry: OTP_TOKEN_EXPIRE,
              },
            });

            const LOCALS = {
              username: user.username,
              appName: AppName,   
              otp: OTP,
            };
            await Mailer.sendMail(
              requestParams.email,
              MAIL_SUBJECT_MESSAGE_RESEND_OTP,
              resendOtp,
              LOCALS
            );

            return Response.successResponseWithoutData(
              res,
              res.__("resendOtpEmail"),
              SUCCESS
            );
          } else {
            Response.errorResponseWithoutData(
              res,
              res.locals.__("userNotExist"),
              FAIL
            );
          }
        }
      });
    } catch (error) {
      return Response.errorResponseData(res, res.__("internalError"), error);
    }
  },

  /**
   * @description This function is get user profile detail.
   * @param req
   * @param res
   */
  userProfileDetails: async (req, res) => {
    try {
      const requestParams = req.query;
      userProfileDetailsValidations(requestParams, res, async (validate) => {
        if (validate) {
          let profile = await Profile.findOne({
            _id: new mongoose.Types.ObjectId(requestParams.target_profile_id),
          });
        }

        return Response.successResponseData(
          res,
          profile,
          SUCCESS,
          res.locals.__("success")
        );
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
   * @description "This function is to update email."
   * @param req
   * @param res
   */
  updateEmail: async (req, res) => {
    try {
      const requestParams = req.body;
      const { authUserId } = req;
      updateEmailValidation(requestParams, res, async (validate) => {
        if (validate) {
          let user = await User.findOne({ _id: authUserId }, { username: 1 });

          if (user) {
            var CURRENT_DATE = new Date();
            const OTP_TOKEN_EXPIRE = new Date(
              CURRENT_DATE.getTime() + process.env.OTP_EXPIRY_MINUTE * 60000
            );
            const OTP = await generateRandomNumber(6);

            await User.updateOne(
              { _id: authUserId },
              {
                $set: {
                  otp: OTP,
                  otp_expiry: OTP_TOKEN_EXPIRE,
                },
              }
            );

            const LOCALS = {
              username: user.username,
              appName: AppName,
              otp: OTP,
            };

            await Mailer.sendMail(
              requestParams.email,
              VERIFY_EMAIL,
              verifyEmail,
              LOCALS
            );

            return Response.successResponseWithoutData(
              res,
              res.locals.__("emailVerifyMailSent"),
              SUCCESS
            );
          } else {
            return Response.errorResponseWithoutData(
              res,
              res.locals.__("userNotExist"),
              FAIL
            );
          }
        }
      });
    } catch (error) {
      return Response.errorResponseData(res, res.__("internalError"), error);
    }
  },
};
