const moment = require("moment");
const Response = require("../../services/Response");
const {
  TRANSACTION_TYPE,
  SUCCESS,
  INTERNAL_SERVER,
  DEPOSIT,
} = require("../../services/Constants");
const {
  depositValidation,
  addEditBankValidation,
  deleteBankValidation,
} = require("../../services/UserValidation");
const { User, BankTransaction, BankAccount } = require("../../models");
const { base64ImageUpload, s3MediaUrl } = require("../../services/S3Bucket");
const { makeRandomNumber } = require("../../services/Helper");

module.exports = {
  /**
   * @description "This function is to create the transaction of result."
   * @param req
   * @param res
   */
  bankTransaction: async (req, res) => {
    try {
      const reqParam = req.body;
      const { authUserId } = req;
      console.log("bankTransaction", reqParam);
      depositValidation(reqParam, res, async (validate) => {
        if (validate) {
          const admin = await User.findOne(
            {
              email: { $eq: process.env.ADMIN_EMAIL },
            },
            { _id: 1 }
          );

          if (reqParam?.transaction_type === TRANSACTION_TYPE?.DEPOSIT) {
            let imageName = "";
            if (reqParam?.image && reqParam?.image !== "") {
              //image file modification
              const extension =
                reqParam?.image && reqParam?.image !== ""
                  ? reqParam?.image.split(";")[0].split("/")[1]
                  : "";
              const randomNumber = await makeRandomNumber(5);
              imageName =
                reqParam?.image && reqParam?.image !== ""
                  ? `${moment().unix()}${randomNumber}.${extension}`
                  : "";

              //profile pic upload
              await base64ImageUpload(imageName, DEPOSIT, reqParam?.image, res);
            }

            let depositObj = {
              fromId: authUserId,
              toId: admin?._id,
              transaction_type: reqParam?.transaction_type,
              remark: reqParam?.remark,
              transactionId: reqParam?.transactionId,
              amount: reqParam?.amount,
              image: imageName,
            };
            await BankTransaction.create(depositObj);
            return Response.successResponseWithoutData(
              res,
              res.locals.__("depositRequest"),
              SUCCESS
            );
          } else {
            let withdrawalObj = {
              fromId: admin?._id,
              toId: authUserId,
              transaction_type: reqParam?.transaction_type,
              amount: reqParam?.amount,
              bankId: reqParam?.bank_id,
            };
            await BankTransaction.create(withdrawalObj);
            return Response.successResponseWithoutData(
              res,
              res.locals.__("withdrawalRequest"),
              SUCCESS
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

  /**
   * @description "This function is to create the transaction of result."
   * @param req
   * @param res
   */
  depositTransactionList: async (req, res) => {
    try {
      const reqParam = req.query;
      const { authUserId } = req;
      let transactionQuery = {
        transaction_type: { $eq: TRANSACTION_TYPE?.DEPOSIT },
      };
      transactionQuery = {
        $and: [
          transactionQuery,
          {
            $or: [
              { fromId: { $in: authUserId } },
              { toId: { $in: authUserId } },
            ],
          },
        ],
      };
      const deposit = await BankTransaction.find(transactionQuery, {
        _id: 1,
        transactionId: 1,
        amount: 1,
        createdAt: 1,
        remark: 1,
        status: 1,
      });
      console.log("deposit", deposit);
      Response.successResponseData(res, deposit, SUCCESS, res.__("success"));
    } catch (error) {
      return Response.errorResponseWithoutData(
        res,
        res.locals.__("internalError"),
        INTERNAL_SERVER
      );
    }
  },

  /**
   * @description "This function is to create the transaction of result."
   * @param req
   * @param res
   */
  withdrawalTransactionList: async (req, res) => {
    try {
      const reqParam = req.query;
      const { authUserId } = req;
      let transactionQuery = {
        transaction_type: { $eq: TRANSACTION_TYPE?.WITHDRAWL },
      };
      transactionQuery = {
        $and: [
          transactionQuery,
          {
            $or: [
              { fromId: { $in: authUserId } },
              { toId: { $in: authUserId } },
            ],
          },
        ],
      };
      const withdrawl = await BankTransaction.find(transactionQuery, {
        _id: 1,
        bankId: 1,
        amount: 1,
        status: 1,
        createdAt: 1,
      }).populate("bankId");
      Response.successResponseData(res, withdrawl, SUCCESS, res.__("success"));
    } catch (error) {
      return Response.errorResponseWithoutData(
        res,
        res.locals.__("internalError"),
        INTERNAL_SERVER
      );
    }
  },

  /**
   * @description "This function is to create the transaction of result."
   * @param req
   * @param res
   */
  addBank: async (req, res) => {
    try {
      const reqParam = req.body;
      const { authUserId } = req;
      addEditBankValidation(reqParam, res, async (validate) => {
        if (validate) {
          let bankObj = {
            userId: authUserId,
            accountNumber: reqParam.accountNumber,
            accountName: reqParam.accountName,
            bankName: reqParam.bankName,
            ifscCode: reqParam.ifscCode,
            accountType: reqParam.accountType,
          };
          await BankAccount.create(bankObj);
          return Response.successResponseWithoutData(
            res,
            res.locals.__("bankAdded"),
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
   * @description "This function is to create the transaction of result."
   * @param req
   * @param res
   */
  editBank: async (req, res) => {
    try {
      const reqParam = req.body;
      addEditBankValidation(reqParam, res, async (validate) => {
        if (validate) {
          let bankObj = {
            accountNumber: reqParam.accountNumber,
            accountName: reqParam.accountName,
            bankName: reqParam.bankName,
            ifscCode: reqParam.ifscCode,
            accountType: reqParam.accountType,
          };

          await BankAccount.updateOne(
            { _id: { $eq: reqParam.bank_id } },
            { $set: bankObj }
          );
          return Response.successResponseWithoutData(
            res,
            res.locals.__("bankUpdated"),
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
   * @description "This function is to create the transaction of result."
   * @param req
   * @param res
   */
  deleteBank: async (req, res) => {
    try {
      const reqParam = req.body;
      deleteBankValidation(reqParam, res, async (validate) => {
        if (validate) {
          await BankAccount.deleteOne({ _id: reqParam.bank_id });
          return Response.successResponseWithoutData(
            res,
            res.locals.__("deleted"),
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
   * @description "This function is to create the transaction of result."
   * @param req
   * @param res
   */
  bankList: async (req, res) => {
    try {
      const reqParam = req.query;
      const { authUserId } = req;
      const bank = await BankAccount.find({ userId: authUserId });
      Response.successResponseData(res, bank, SUCCESS, res.__("success"));
    } catch (error) {
      return Response.errorResponseWithoutData(
        res,
        res.locals.__("internalError"),
        INTERNAL_SERVER
      );
    }
  },
};
