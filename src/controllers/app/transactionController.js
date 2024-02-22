const Transformer = require("object-transformer");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const ip = require("ip");
const axios = require("axios");
const Response = require("../../services/Response");
const Constants = require("../../services/Constants");
const { ROLES, ACTIVE, TRANSACTION_TYPE } = require("../../services/Constants");
const {
  resultTransactionValidation,
} = require("../../services/UserValidation");
const { Login } = require("../../transformers/admin/adminAuthTransformer");
const { User, Transaction, ResultTransaction } = require("../../models");

module.exports = {
  /**
   * @description "This function is to create the transaction of result."
   * @param req
   * @param res
   */
  resulTransaction: async (req, res) => {
    try {
      const reqParam = req.body;
      const { authUserId } = req;
      resultTransactionValidation(reqParam, res, async (validate) => {
        if (validate) {
          const roundId = uuidv4();
          // CREATE OR UPDATE STATEMENT BY DESCRIPTION
          let description = new Date().toLocaleDateString().replace("/", "-");
          let modifiedDescription = description + "_" + reqParam?.game;
          let checkRTxn = await ResultTransaction.findOne({
            userId: authUserId,
            description: modifiedDescription,
          });

          if (checkRTxn != null) {
            let final_result = "";
            let final_pl = checkRTxn.pl + parseInt(reqParam?.amount);
            if (final_pl >= 0) {
              final_result = "win";
            } else {
              final_result = "loss";
            }
            // UPDATE
            await checkRTxn.updateOne({
              pl: checkRTxn.pl + parseInt(reqParam?.amount),
              result: reqParam?.result,
            });
          } else {
            // CREATE
            await ResultTransaction.create({
              userId: authUserId,
              description: modifiedDescription,
              game: reqParam?.game,
              pl: parseInt(reqParam?.amount),
              result: reqParam?.result,
              roundId: roundId,
            });
          }
          return Response.successResponseWithoutData(
            res,
            res.locals.__("success"),
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
};
