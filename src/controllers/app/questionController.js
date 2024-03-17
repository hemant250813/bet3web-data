const Response = require("../../services/Response");
const Constants = require("../../services/Constants");
const { SUCCESS, QUESTION } = require("../../services/Constants");
const { Question, QuestionResult } = require("../../models");
const { s3MediaUrl } = require("../../services/S3Bucket");

module.exports = {
  /**
   * @description "This function is to questions."
   * @param req
   * @param res
   */
  getQuestion: async (req, res) => {
    try {
      const { authUserId } = req;
      console.log("authUserId", authUserId);
      let questionResult = await QuestionResult.find({
        isDeclared: false,
        userId: authUserId,
      });
      let alreadyAnswerQuestion = questionResult?.map(
        (result) => result?.questionSlug
      );
      console.log("alreadyAnswerQuestion", alreadyAnswerQuestion);
      let question = await Question.find({ isDeclared: false });

      let filterQuestion = question
        ?.filter((que) => {
          if (alreadyAnswerQuestion?.length > 0) {
            if (!alreadyAnswerQuestion?.includes(que?.questionSlug)) {
              return {
                _id: que?._id,
                question: que?.question,
                option1: que?.option1,
                option2: que?.option2,
                option3: que?.option3,
                odd1: que?.odd1,
                odd2: que?.odd2,
                odd3: que?.odd3,
                image1: que?.image1,
                image2: que?.image2,
                image3: que?.image3,
                questionSlug: que?.questionSlug,
                isDeclared: que?.isDeclared,
                createdAt: que?.createdAt,
                updatedAt: que?.updatedAt,
              };
            }
          } else {
            return {
              _id: que?._id,
              question: que?.question,
              option1: que?.option1,
              option2: que?.option2,
              option3: que?.option3,
              odd1: que?.odd1,
              odd2: que?.odd2,
              odd3: que?.odd3,
              image1: que?.image1,
              image2: que?.image2,
              image3: que?.image3,
              questionSlug: que?.questionSlug,
              isDeclared: que?.isDeclared,
              createdAt: que?.createdAt,
              updatedAt: que?.updatedAt,
            };
          }
        })
        ?.map((modified) => {
          return {
            _id: modified?._id,
            question: modified?.question,
            option1: modified?.option1,
            option2: modified?.option2,
            option3: modified?.option3,
            odd1: modified?.odd1,
            odd2: modified?.odd2,
            odd3: modified?.odd3,
            image1: s3MediaUrl(QUESTION, modified?.image1),
            image2: s3MediaUrl(QUESTION, modified?.image2),
            image3: s3MediaUrl(QUESTION, modified?.image3),
            questionSlug: modified?.questionSlug,
            isDeclared: modified?.isDeclared,
            createdAt: modified?.createdAt,
            updatedAt: modified?.updatedAt,
          };
        });

      Response.successResponseData(
        res,
        filterQuestion,
        SUCCESS,
        res.__("success")
      );
    } catch (error) {
      console.log("error",error);
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
      console.log("reqParam", reqParam);
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
