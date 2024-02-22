const Transformer = require("object-transformer");
const bcrypt = require("bcrypt");
const ip = require("ip");
const axios = require("axios");
const Response = require("../../services/Response");
const Constants = require("../../services/Constants");
const { ROLES, ACTIVE, TRANSACTION_TYPE } = require("../../services/Constants");
const { transactionValidation } = require("../../services/AdminValidation");
const { Login } = require("../../transformers/admin/adminAuthTransformer");
const { User, Transaction, ResultTransaction } = require("../../models");

module.exports = {
  /**
   * @description "This function is to deposit to user."
   * @param req
   * @param res
   */
  transaction: async (req, res) => {
    try {
      const reqParam = req.body;
      const { authAdminId } = req;
      transactionValidation(reqParam, res, async (validate) => {
        if (validate) {
          let admin = await User.findOne({
            _id: authAdminId,
            type: { $eq: 1 },
          });
          const comparePassword = await bcrypt.compare(
            reqParam.password,
            admin.password
          );

          if (comparePassword) {
            let user = await User.findOne({
              _id: reqParam.userId,
              type: { $eq: 2 },
            });

            let bankTransactionObj = {
              transaction_type: reqParam.transaction_type,
              amount: reqParam.amount,
              description: reqParam.remark,
            };

            if (reqParam.transaction_type === TRANSACTION_TYPE?.DEPOSIT) {
              let adminBalance = admin.balance - parseInt(reqParam.amount);
              await User.updateOne(
                { _id: { $eq: authAdminId }, type: { $eq: 1 } },
                {
                  $set: {
                    balance: parseInt(adminBalance),
                  },
                }
              );

              let userBalance = user.balance + parseInt(reqParam.amount);
              await User.updateOne(
                { _id: { $eq: reqParam.userId }, type: { $eq: 2 } },
                {
                  $set: {
                    balance: parseInt(userBalance),
                  },
                }
              );

              bankTransactionObj.transaction_type = reqParam.transaction_type;
              bankTransactionObj.fromId = authAdminId;
              bankTransactionObj.toId = reqParam.userId;
              await Transaction.create(bankTransactionObj);
              return Response.successResponseWithoutData(
                res,
                res.locals.__("deposit"),
                Constants.SUCCESS
              );
            } else {
              let adminBalance = admin.balance + parseInt(reqParam.amount);
              await User.updateOne(
                { _id: { $eq: authAdminId }, type: { $eq: 1 } },
                {
                  $set: {
                    balance: parseInt(adminBalance),
                  },
                }
              );

              let userBalance = user.balance - parseInt(reqParam.amount);
              await User.updateOne(
                { _id: { $eq: reqParam.userId }, type: { $eq: 2 } },
                {
                  $set: {
                    balance: parseInt(userBalance),
                  },
                }
              );

              bankTransactionObj.transaction_type = reqParam.transaction_type;
              bankTransactionObj.fromId = reqParam.userId;
              bankTransactionObj.toId = authAdminId;
              await Transaction.create(bankTransactionObj);
              return Response.successResponseWithoutData(
                res,
                res.locals.__("withdrawn"),
                Constants.SUCCESS
              );
            }
          } else {
            return Response.errorResponseWithoutData(
              res,
              res.locals.__("userNamePasswordNotMatch"),
              Constants.BAD_REQUEST
            );
          }
        }
      });
    } catch (error) {
      console.log("error", error);
      return Response.errorResponseWithoutData(
        res,
        res.locals.__("internalError"),
        Constants.INTERNAL_SERVER
      );
    }
  },

  /**
   * @description "This function is to create the transaction of result."
   * @param req
   * @param res
   */
  resulTransaction: async (req, res) => {
    try {
      const reqParam = req.query;
      let resultTransactionQuery = {};
      let transactionQuery = {};

      if (reqParam?.deposit === "true") {
        transactionQuery = {
          transaction_type: "deposit",
        };
      } else if (reqParam?.withdrawl === "true") {
        transactionQuery = {
          transaction_type: "withdrawl",
        };
      }

      if (reqParam?.game === "true") {
        if (reqParam?.win === "true") {
          resultTransactionQuery = {
            result: "win",
            game: reqParam?.game_name,
          };
        } else if (reqParam?.lose === "true") {
          resultTransactionQuery = {
            result: "loss",
            game: reqParam?.game_name,
          };
        }
      } else {
        if (reqParam?.win === "true") {
          resultTransactionQuery = {
            result: "win",
          };
        } else if (reqParam?.lose === "true") {
          resultTransactionQuery = {
            result: "loss",
          };
        }
      }

      if(reqParam?.userId !== "undefined"){
        resultTransactionQuery={
          ...resultTransactionQuery,
          userId: reqParam?.userId,
        }

        transactionQuery = {
          $and: [
            transactionQuery,
            {
              $or: [
                { fromId: { $in: reqParam?.userId } },
                { toId: { $in: reqParam?.userId } },
              ],
            },
          ],
        };
      }

      let result_transaction = await ResultTransaction.find(
        resultTransactionQuery
      ).sort({
        createdAt: -1,
      });
      let modified_result_transaction = result_transaction?.map(
        (transaction) => {
          return {
            date: transaction?.createdAt,
            type: transaction?.result,
            from: null,
            to: null,
            desc: transaction?.description,
            amount: transaction?.pl,
          };
        }
      );

      let transaction = await Transaction.find(transactionQuery)
        .populate({
          path: "fromId",
          select: "username",
        })
        .populate({
          path: "toId",
          select: "username",
        })
        .sort({ createdAt: -1 });
      let modified_transaction = transaction?.map((transaction) => {
        return {
          date: transaction?.createdAt,
          type: transaction?.transaction_type,
          from: transaction?.fromId?.username,
          to: transaction?.toId?.username,
          desc: transaction?.description,
          amount: transaction?.amount,
        };
      });

      let resultTransactionList = null;

      if (reqParam?.deposit === "true") {
        resultTransactionList = modified_transaction;
      } else if (reqParam?.withdrawl === "true") {
        resultTransactionList = modified_transaction;
      } else if (reqParam?.win === "true") {
        resultTransactionList = modified_result_transaction;
      } else if (reqParam?.lose === "true") {
        resultTransactionList = modified_result_transaction;
      } else {
        resultTransactionList =
          modified_result_transaction.concat(modified_transaction);
      }

      resultTransactionList?.sort(function (a, b) {
        return new Date(a.date) - new Date(b.date);
      });

      let balance = 0;
      let result = resultTransactionList?.map((transaction) => {
        if (transaction?.type === "withdrawl") {
          balance = balance - transaction?.amount;
        } else {
          balance = balance + transaction?.amount;
        }

        return {
          date: transaction?.date,
          type: transaction?.type,
          from: transaction?.from,
          to: transaction?.to,
          desc: transaction?.desc,
          cr:
            transaction?.type === "loss"
              ? transaction?.amount
              : transaction?.type === "withdrawl"
              ? transaction?.amount
              : "-",
          dr:
            transaction?.type === "win"
              ? transaction?.amount
              : transaction?.type === "deposit"
              ? transaction?.amount
              : "-",
          balance: balance,
        };
      });

      result?.sort(function (a, b) {
        return new Date(b.date) - new Date(a.date);
      });

      return Response.successResponseData(
        res,
        result,
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
