const Response = require("./Response");
const Joi = require("@hapi/joi");
const Helper = require("./Helper");
const { TRANSACTION_TYPE, ACTIVE, INACTIVE } = require("../services/Constants");

module.exports = {
  /**
   * @description This function is used to validate Admin Login fields.
   * @param req
   * @param res
   */
  loginValidation: (req, res, callback) => {
    const schema = Joi.object({
      user: Joi.string().trim().required(),
      password: Joi.string().trim().required(),
    });
    const { error } = schema.validate(req);
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey("loginValidation", error))
      );
    }
    return callback(true);
  },

  /**
   * @description This function is used to validate forget password fields.
   * @param req
   * @param res
   */
  forgotPasswordValidation: (req, res, callback) => {
    const schema = Joi.object({
      email: Joi.string().email().trim().required(),
    });
    const { error } = schema.validate(req);
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey("forgotPasswordValidation", error))
      );
    }
    return callback(true);
  },

  /**
   * @description This function is used to validate reset password fields.
   * @param req
   * @param res
   */
  resetPasswordValidation: (req, res, callback) => {
    const schema = Joi.object({
      userId: Joi.string().trim().required(),
      resetPassword: Joi.string().trim().required(),
      password: Joi.string().trim().required(),
    });
    const { error } = schema.validate(req);
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey("resetPasswordValidation", error))
      );
    }
    return callback(true);
  },

  /**
   * @description This function is used to validate change password fields.
   * @param req
   * @param res
   */
  changePasswordValidation: (req, res, callback) => {
    const schema = Joi.object({
      old_password: Joi.string().trim().required(),
      password: Joi.string()
        .trim()
        .min(6)
        .regex(/^(?=.*[0-9])(?=.*[a-zA-Z])[a-zA-Z0-9!@#$%^&*]{6,}$/)
        .required(),
      confirm_password: Joi.string()
        .trim()
        .min(6)
        .regex(/^(?=.*[0-9])(?=.*[a-zA-Z])[a-zA-Z0-9!@#$%^&*]{6,}$/)
        .required(),
    });
    const { error } = schema.validate(req);
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey("changePasswordValidation", error))
      );
    }
    return callback(true);
  },

  /**
   * @description This function is used to validate activate/deActivate status fields.
   * @param req
   * @param res
   */
  activeDeActivateValidation: (req, res, callback) => {
    const schema = Joi.object({
      userId: Joi.string().trim().required(),
      status: Joi.string().trim().valid(ACTIVE, INACTIVE).required(),
    });
    const { error } = schema.validate(req);
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey("activeDeActivateValidation", error))
      );
    }
    return callback(true);
  },

  /**
   * @description This function is used to validate transaction fields.
   * @param req
   * @param res
   */
  transactionValidation: (req, res, callback) => {
    const schema = Joi.object({
      userId: Joi.string().trim().required(),
      transaction_type: Joi.string()
        .trim()
        .valid(TRANSACTION_TYPE.DEPOSIT, TRANSACTION_TYPE.WITHDRAWL)
        .required(),
      amount: Joi.number().required(),
      remark: Joi.string().trim().required(),
      password: Joi.string().trim().required(),
    });
    const { error } = schema.validate(req);
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey("transactionValidation", error))
      );
    }
    return callback(true);
  },
};
