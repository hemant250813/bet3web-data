const Response = require("../../services/Response");
const Constants = require("../../services/Constants");
const {
  SUCCESS,
} = require("../../services/Constants");
const { Question } = require("../../models");

module.exports = {
  /**
   * @description "This function is to deposit to user."
   * @param req
   * @param res
   */
  question: async (req, res) => {
    try {
      const reqParam = req.body;
      await Question.bulkWrite(
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

  /**
   * @description "This function is to questions."
   * @param req
   * @param res
   */
  getQuestion: async (req, res) => {
    try {
      let question = await Question.find({ isDeclared: false });
      Response.successResponseData(res, question, SUCCESS, res.__("success"));
    } catch (error) {
      return Response.errorResponseWithoutData(
        res,
        res.locals.__("internalError"),
        Constants.INTERNAL_SERVER
      );
    }
  },
};
