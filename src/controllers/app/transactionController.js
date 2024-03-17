const { v4: uuidv4 } = require("uuid");
const Response = require("../../services/Response");
const Constants = require("../../services/Constants");
const {
  resultTransactionValidation,
} = require("../../services/UserValidation");
const { User, ResultTransaction } = require("../../models");

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
          let user = await User.findOne(
            {
              _id: authUserId,
            },
            { balance: 1 }
          );

          let balance = user?.balance + parseInt(reqParam?.amount);
          if (reqParam?.result === "win") {
            balance = user?.balance + parseInt(reqParam?.amount);
          } else {
            balance = user?.balance + parseInt(reqParam?.amount);
          }
          await User.updateOne(
            { _id: user._id },
            {
              $set: {
                balance: balance,
              },
            }
          );

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
            let final_amount = checkRTxn.amount + parseInt(reqParam?.invest);
            if (final_pl >= 0) {
              final_result = "win";
            } else {
              final_result = "lose";
            }
            // UPDATE
            await checkRTxn.updateOne({
              pl: checkRTxn.pl + parseInt(reqParam?.amount),
              result: final_result,
              amount: final_amount,
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
              amount: parseInt(reqParam?.invest),
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
