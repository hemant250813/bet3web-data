const Response = require("../../services/Response");
const Constants = require("../../services/Constants");
const {
  SUCCESS,
} = require("../../services/Constants");
const { Question, QuestionResult } = require("../../models");

module.exports = {
  /**
   * @description "This function is to questions."
   * @param req
   * @param res
   */
  getQuestion: async (req, res) => {
    try {
      const { authUserId } = req;
      let questionResult = await QuestionResult.find({
        isDeclared: false,
        userId: authUserId,
      });
      let alreadyAnswerQuestion = questionResult?.map(
        (result) => result?.questionSlug
      );

      let question = await Question.find({ isDeclared: false });

      let filterQuestion = question?.filter((que) => {
        if(alreadyAnswerQuestion?.length > 0){
          if(!alreadyAnswerQuestion?.includes(que?.questionSlug)){
            return {
              _id: que?._id,
              question: que?.question,
              option1: que?.option1,
              option2: que?.option2,
              option3: que?.option3,
              odd: que?.odd,
              questionSlug:que?.questionSlug,
              isDeclared: que?.isDeclared,
              createdAt: que?.createdAt,
              updatedAt: que?.updatedAt,
            };
          }
        }else{
          return {
            _id: que?._id,
            question: que?.question,
            option1: que?.option1,
            option2: que?.option2,
            option3: que?.option3,
            odd: que?.odd,
            questionSlug:que?.questionSlug,
            isDeclared: que?.isDeclared,
            createdAt: que?.createdAt,
            updatedAt: que?.updatedAt,
          };
        }
      });
      Response.successResponseData(res, filterQuestion, SUCCESS, res.__("success"));
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
  questionResult: async (req, res) => {
    try {
      const reqParam = req.body;
      await QuestionResult.bulkWrite(
        reqParam?.formData?.map((data) => ({
          insertOne: { document: data },
        }))
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
};
