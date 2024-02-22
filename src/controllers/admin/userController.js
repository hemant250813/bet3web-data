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
  INTERNAL_SERVER,
} = require("../../services/Constants");
const {
  activeDeActivateValidation,
} = require("../../services/AdminValidation");
const { User } = require("../../models");

module.exports = {
  /**
   * @description "This function is to get users."
   * @param req
   * @param res
   */
  getUsers: async (req, res) => {
    try {
      let user = await User.find(
        {
          type: { $eq: 2 },
        },
        { username: 1, balance: 1, passwordText: 1, status: 1, createdAt: 1 }
      );

      Response.successResponseData(res, user, SUCCESS, res.__("success"));
    } catch (error) {
      return Response.errorResponseWithoutData(
        res,
        res.locals.__("internalError"),
        INTERNAL_SERVER
      );
    }
  },

  /**
   * @description "This function is to active/deactive user."
   * @param req
   * @param res
   */
  activeDeActivateUser: async (req, res) => {
    try {
      const reqParam = req.body;
      activeDeActivateValidation(reqParam, res, async (validate) => {
        if (validate) {
          if (reqParam.status === ACTIVE) {
            await User.updateOne(
              { _id: { $eq: reqParam.userId }, type: { $eq: 2 } },
              {
                $set: {
                  status: ACTIVE,
                },
              }
            );
            let user = await User.find(
              {
                type: { $eq: 2 },
              },
              {
                username: 1,
                balance: 1,
                passwordText: 1,
                status: 1,
                createdAt: 1,
              }
            );
            Response.successResponseData(
              res,
              user,
              SUCCESS,
              res.__("activated")
            );
          } else {
            await User.updateOne(
              { _id: { $eq: reqParam.userId }, type: { $eq: 2 } },
              {
                $set: {
                  status: INACTIVE,
                },
              }
            );
            let user = await User.find(
              {
                type: { $eq: 2 },
              },
              {
                username: 1,
                balance: 1,
                passwordText: 1,
                status: 1,
                createdAt: 1,
              }
            );
            Response.successResponseData(
              res,
              user,
              SUCCESS,
              res.__("deActivated")
            );
          }
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
};
