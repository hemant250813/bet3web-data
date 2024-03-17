const moment = require("moment");
const Response = require("../../services/Response");
const {
  TRANSACTION_TYPE,
  SUCCESS,
  INTERNAL_SERVER,
  BANK_SLIDER,
  DEPOSIT,
} = require("../../services/Constants");
const {
  deleteBankValidation,
  addBankSliderValidation,
  acceptRejectRequestValidation,
} = require("../../services/AdminValidation");
const { User, BankTransaction, BankAccount } = require("../../models");
const { base64ImageUpload, s3MediaUrl } = require("../../services/S3Bucket");
const { makeRandomNumber } = require("../../services/Helper");
const { Bank } = require("../../models/user");

module.exports = {
  /**
   * @description "This function is to create the transaction of result."
   * @param req
   * @param res
   */
  addBankSlider: async (req, res) => {
    try {
      const reqParam = req.body;
      const { authAdminId } = req;
      console.log("addBankSlider", reqParam);
      addBankSliderValidation(reqParam, res, async (validate) => {
        if (validate) {
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
            await base64ImageUpload(
              imageName,
              BANK_SLIDER,
              reqParam?.image,
              res
            );
          }

          let bankSliderObj = {
            layerId: authAdminId,
            type: 1,
            title: reqParam?.title,
            image: imageName,
          };
          await Bank.create(bankSliderObj);
          return Response.successResponseWithoutData(
            res,
            res.locals.__("sliderAdded"),
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
  acceptRejectRequest: async (req, res) => {
    try {
      const reqParam = req.body;
      acceptRejectRequestValidation(reqParam, res, async (validate) => {
        if (validate) {
          let bankTransactionObj = {
            _id: reqParam?.id,
          };
          if (reqParam?.requestType === "accepted") {
            bankTransactionObj = {
              status: "accepted",
            };
          } else {
            bankTransactionObj = {
              status: "rejected",
              remark: reqParam?.remark,
            };
          }

          await BankTransaction.updateOne(
            { _id: { $eq: reqParam?.id } },
            { $set: bankTransactionObj }
          );

          return Response.successResponseWithoutData(
            res,
            reqParam?.requestType === "accepted"
              ? res.locals.__("accepted")
              : res.locals.__("rejected"),
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
  bankSliderList: async (req, res) => {
    try {
      const reqParam = req.body;
      const { authAdminId } = req;

      // let bankSlider = await Bank.find({ layerId: authAdminId });
      let bankSlider = await Bank.find();
      let bankSliderModified = bankSlider?.map((modified) => {
        return {
          _id: modified?._id,
          layerId: modified?.layerId,
          type: modified?.type,
          title: modified?.title,
          image: s3MediaUrl(BANK_SLIDER, modified?.image),
          createdAt: modified?.createdAt,
          updatedAt: modified?.updatedAt,
        };
      });
      console.log("bankSlider", bankSliderModified);
      Response.successResponseData(
        res,
        bankSliderModified,
        SUCCESS,
        res.__("success")
      );
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
  deleteBankSlider: async (req, res) => {
    try {
      const reqParam = req.body;
      deleteBankValidation(reqParam, res, async (validate) => {
        if (validate) {
          await Bank.deleteOne({ _id: reqParam.bank_id });
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
  bankTransactionList: async (req, res) => {
    try {
      const reqParam = req.query;
      const bankTransaction = await BankTransaction.find()
        ?.populate({
          path: "fromId",
          select: ["username"],
          match: { type: { $ne: 1 } },
        })
        ?.populate({
          path: "toId",
          select: ["username"],
          match: { type: { $ne: 1 } },
        })
        ?.populate("bankId");

      let bankDepositTransactionModified = bankTransaction
        ?.map((modified) => {
          return {
            _id: modified?._id,
            layerId:
              modified?.fromId === null
                ? modified?.toId?.username
                : modified?.fromId?.username,
            transaction_type: modified?.transaction_type,
            remark: modified?.remark,
            transactionId: modified?.transactionId,
            image: s3MediaUrl(DEPOSIT, modified?.image),
            status: modified?.status,
            amount: modified?.amount,
            createdAt: modified?.createdAt,
            updatedAt: modified?.updatedAt,
          };
        })
        ?.filter(
          (deposit) => deposit?.transaction_type === TRANSACTION_TYPE?.DEPOSIT
        );

      let bankWithdrawalTransactionModified = bankTransaction
        ?.map((modified) => {
          return {
            _id: modified?._id,
            layerId:
              modified?.fromId === null
                ? modified?.toId?.username
                : modified?.fromId?.username,
            transaction_type: modified?.transaction_type,
            remark: modified?.remark === undefined ? "-" : modified?.remark,
            accountNumber: modified?.bankId?.accountNumber,
            accountName: modified?.bankId?.accountName,
            bankName: modified?.bankId?.bankName,
            ifscCode: modified?.bankId?.ifscCode,
            accountType: modified?.bankId?.accountType,
            status: modified?.status,
            amount: modified?.amount,
            createdAt: modified?.createdAt,
            updatedAt: modified?.updatedAt,
          };
        })
        ?.filter(
          (deposit) => deposit?.transaction_type === TRANSACTION_TYPE?.WITHDRAWL
        );
      let responseObj = {
        bankDepositTransactionModified: bankDepositTransactionModified,
        bankWithdrawalTransactionModified: bankWithdrawalTransactionModified,
      };

      Response.successResponseData(
        res,
        responseObj,
        SUCCESS,
        res.__("success")
      );
    } catch (error) {
      return Response.errorResponseWithoutData(
        res,
        res.locals.__("internalError"),
        INTERNAL_SERVER
      );
    }
  },
};
