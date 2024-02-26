const moment = require("moment");
const Response = require("../../services/Response");
const Constants = require("../../services/Constants");
const {
  SUCCESS,
} = require("../../services/Constants");
const { Question, QuestionResult, User } = require("../../models");
const {
  resultTransactionQuestion,
  searchQuestionByQuery,
} = require("../../services/Helper");

module.exports = {
  /**
   * @description "This function is to deposit to user."
   * @param req
   * @param res
   */
  result: async (req, res) => {
    try {
      const reqParam = req.body;
      let questionResult = await QuestionResult?.find();
      questionResult?.forEach(async (element) => {
        if (reqParam?.question === element?.questionSlug) {
          let pl = 0;
          if (element?.answer === reqParam?.answer) {
            // win
            pl = element?.amount * element?.odd;
            let data = await resultTransactionQuestion(res, element, pl, "win");
          } else {
            // lose
            pl = -parseInt(element?.amount);
            let data = await resultTransactionQuestion(
              res,
              element,
              pl,
              "lose"
            );
          }
          let user = await User?.findOne(
            { _id: element?.userId },
            { balance: 1 }
          );
          let balance = user?.balance + pl;
          await QuestionResult.updateOne(
            { _id: element._id },
            {
              $set: {
                isDeclared: true,
              },
            }
          );

          await User.updateOne(
            { _id: element?.userId },
            {
              $set: {
                balance: balance,
              },
            }
          );
        }
      });

      await Question.updateOne(
        { questionSlug: reqParam?.question },
        {
          $set: {
            isDeclared: true,
            answer: reqParam?.answer,
          },
        }
      );

      return Response.successResponseWithoutData(
        res,
        res.locals.__("success"),
        SUCCESS
      );
    } catch (error) {
      return Response.errorResponseWithoutData(
        res,
        res.locals.__("internalError"),
        Constants.INTERNAL_SERVER
      );
    }
  },

  /**
   * @description "This function is to deposit to user."
   * @param req
   * @param res
   */
  getResult: async (req, res) => {
    try {
      const reqParam = req.query;
      let query = { isDeclared: true };

      let questionResult = await Question?.find(query);

      
      if (questionResult) {
        questionResult = questionResult.map((question) => {
          return({
            _id: question?._id?.toString(),
            question: question?.question?.toString(),
            option1: question?.option1?.toString(),
            option2: question?.option2?.toString(),
            option3: question?.option3?.toString(),
            odd: question?.odd?.toString(),
            questionSlug: question?.questionSlug?.toString(),
            createdAt: moment(question?.createdAt).format(
              "YYYY-MM-DD HH:mm:ss"
            )?.toString(),
            updatedAt: moment(question?.updatedAt).format(
              "YYYY-MM-DD HH:mm:ss"
            )?.toString(),
            answer: question?.answer?.toString(),
          })
        });
      }

      let search = [];
      if (reqParam?.search && reqParam?.search !== "") {
        search = await searchQuestionByQuery(reqParam?.search, questionResult);
      } else {
        search = questionResult;
      }

      Response.successResponseData(res, search, SUCCESS, res.__("success"));
    } catch (error) {
      return Response.errorResponseWithoutData(
        res,
        res.locals.__("internalError"),
        Constants.INTERNAL_SERVER
      );
    }
  },
};
