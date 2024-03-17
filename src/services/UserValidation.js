const Response = require("./Response");
const Joi = require("@hapi/joi");
const Helper = require("./Helper");
const { TRANSACTION_TYPE, ACCOUNT_TYPE } = require("./Constants");

module.exports = {
  /**
   * @description This function is used to validate User Login fields.
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
   * @description This function is used to validate user otp verification fields.
   * @param req
   * @param res
   */
  resetPassValidation: (req, res, callback) => {
    const schema = Joi.object({
      email: Joi.string()
        // .pattern(/^([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+)\.([a-zA-Z]{2,})$/)
        .required(),
      otp: Joi.string().trim().required(),
      password: Joi.string()
        .trim()
        .min(8)
        // .regex(/^(?=.*[0-9])(?=.*[a-zA-Z])[a-zA-Z0-9!@#$%^&*]{6,}$/)
        .required(), //.regex(/^(?=.*[0-9])(?=.*[a-zA-Z])[a-zA-Z0-9!@#$%^&*]{6,}$/),
    });
    const { error } = schema.validate(req);
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey("userOtpValidation", error))
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
      old_password: Joi.string()
        .trim()
        .min(8)
        .regex(/^(?=.*[0-9])(?=.*[a-zA-Z])[a-zA-Z0-9!@#$%^&*]{6,}$/)
        .required(),
      password: Joi.string()
        .trim()
        .min(8)
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
   * @description This function is used to validate user otp verification fields.
   * @param req
   * @param res
   */
  resendOtpValidation: (req, res, callback) => {
    const schema = Joi.object({
      email: Joi.string().email().trim().required(),
    });
    const { error } = schema.validate(req);
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey("resendOtpValidation", error))
      );
    }
    return callback(true);
  },

  /**
   * @description This function is used to validate user otp verification fields.
   * @param req
   * @param res
   */
  verifyOtpValidation: (req, res, callback) => {
    const schema = Joi.object({
      email: Joi.string().email().trim().required(),
      otp: Joi.string().trim().required(),
    });
    const { error } = schema.validate(req);
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey("verifyOtpValidation", error))
      );
    }
    return callback(true);
  },

  /**
   * @description This function is used to validate logout field ID.
   * @param req
   * @param res
   */
  logoutValidation: (req, res, callback) => {
    const schema = Joi.object({
      user_id: Joi.string().trim().required(),
    });
    const { error } = schema.validate(req);
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey("logoutValidation", error))
      );
    }
    return callback(true);
  },

  /**
   * @description This function is used to validate user registration fields.
   * @param req
   * @param res
   */
  userRegisterValidation: (req, res, callback) => {
    const schema = Joi.object({
      username: Joi.string().trim().required(),
      email: Joi.string().email().trim().required(),
      mobile: Joi.string()
        .trim()
        .max(15)
        .regex(/^(0|[1-9]\d*)$/)
        .required(),
      password: Joi.string()
        .trim()
        .min(6)
        // .regex(/^(?=.*[0-9])(?=.*[a-zA-Z])[a-zA-Z0-9!@#$%^&*]{6,}$/)
        .required(), //.regex(/^(?=.*[0-9])(?=.*[a-zA-Z])[a-zA-Z0-9!@#$%^&*]{6,}$/),
      country: Joi.string().trim().max(15).required(),
    });
    const { error } = schema.validate(req);
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey("userRegisterValidation", error))
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

  /**
   * @description This function is used to validate result transaction fields.
   * @param req
   * @param res
   */
  resultTransactionValidation: (req, res, callback) => {
    const schema = Joi.object({
      invest: Joi.number().required(),
      amount: Joi.number().required(),
      result: Joi.string().trim().required(),
      game: Joi.string().trim().required(),
    });
    const { error } = schema.validate(req);
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(
          Helper.validationMessageKey("resultTransactionValidation", error)
        )
      );
    }
    return callback(true);
  },

  /**
   * @description This function is used to validate result transaction fields.
   * @param req
   * @param res
   */
  depositValidation: (req, res, callback) => {
    const schema = Joi.object({
      bank_id: Joi.string().optional(),
      transaction_type: Joi.string()
        .valid(TRANSACTION_TYPE?.DEPOSIT, TRANSACTION_TYPE?.WITHDRAWL)
        .required(),
      remark: Joi.string().optional(),
      transactionId: Joi.string().trim().optional(),
      image: Joi.string().trim().optional(),
      amount: Joi.string().trim().required(),
    });
    const { error } = schema.validate(req);
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey("depositValidation", error))
      );
    }
    return callback(true);
  },

  /**
   * @description This function is used to validate result transaction fields.
   * @param req
   * @param res
   */
  addEditBankValidation: (req, res, callback) => {
    const schema = Joi.object({
      bank_id: Joi.string().optional(),
      accountNumber: Joi.string().required(),
      accountName: Joi.string().trim().required(),
      bankName: Joi.string().trim().required(),
      ifscCode: Joi.string().trim().required(),
      accountType: Joi.string()
        .valid(ACCOUNT_TYPE?.SAVING, ACCOUNT_TYPE?.CURRENT)
        .required(),
    });
    const { error } = schema.validate(req);
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey("addEditBankValidation", error))
      );
    }
    return callback(true);
  },

   /**
   * @description This function is used to validate result transaction fields.
   * @param req
   * @param res
   */
   deleteBankValidation: (req, res, callback) => {
    const schema = Joi.object({
      bank_id: Joi.string().required(),
    });
    const { error } = schema.validate(req);
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey("deleteBankValidation", error))
      );
    }
    return callback(true);
  },

  /**
   * @description This function is used to validate result transaction fields.
   * @param req
   * @param res
   */
  editProfileValidation: (req, res, callback) => {
    const schema = Joi.object({
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      email: Joi.string().email().trim().required(),
      mobileNo: Joi.string().trim().required(),
      address: Joi.string().required(),
      state: Joi.string().required(),
      zipCode: Joi.string().trim().required(),
      city: Joi.string().trim().required(),
      country: Joi.string().trim().required(),
    });
    const { error } = schema.validate(req);
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey("editProfileValidation", error))
      );
    }
    return callback(true);
  },

  /**
   * @description This function is used to validate setting fields.
   * @param req
   * @param res
   */
  getSettingValidation: (req, res, callback) => {
    const schema = Joi.object({
      game: Joi.string().trim().required(),
    });
    const { error } = schema.validate(req);
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey("getSettingValidation", error))
      );
    }
    return callback(true);
  },
};
