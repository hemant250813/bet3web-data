const moment = require("moment");
const Response = require("../../services/Response");
const Constants = require("../../services/Constants");
const { SUCCESS, QUESTION } = require("../../services/Constants");
const { base64ImageUpload, s3MediaUrl } = require("../../services/S3Bucket");
const { makeRandomNumber } = require("../../services/Helper");
const { Question, QuestionResult } = require("../../models");

module.exports = {
  /**
   * @description "This function is to deposit to user."
   * @param req
   * @param res
   */
  question: async (req, res) => {
    try {
      console.log("saaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");

      const requestParams = req.body;
      console.log("requestParams", requestParams);
      if (requestParams !== undefined) {
        let imageName1 = "";
        let imageName2 = "";
        let imageName3 = "";
        if (requestParams?.image1 && requestParams?.image1 !== "") {
          //image file modification
          const extension =
            requestParams?.image1 && requestParams?.image1 !== ""
              ? requestParams?.image1.split(";")[0].split("/")[1]
              : "";
          const randomNumber = await makeRandomNumber(5);
          imageName1 =
            requestParams?.image1 && requestParams?.image1 !== ""
              ? `${moment().unix()}${randomNumber}.${extension}`
              : "";

          //profile pic upload
          await base64ImageUpload(
            imageName1,
            QUESTION,
            requestParams?.image1,
            res
          );
        }

        if (requestParams?.image2 && requestParams?.image2 !== "") {
          //image file modification
          const extension =
            requestParams?.image2 && requestParams?.image2 !== ""
              ? requestParams?.image2.split(";")[0].split("/")[1]
              : "";
          const randomNumber = await makeRandomNumber(5);
          imageName2 =
            requestParams?.image2 && requestParams?.image2 !== ""
              ? `${moment().unix()}${randomNumber}.${extension}`
              : "";

          //profile pic upload
          await base64ImageUpload(
            imageName2,
            QUESTION,
            requestParams?.image2,
            res
          );
        }

        if (requestParams?.image3 && requestParams?.image3 !== "") {
          //image file modification
          const extension =
            requestParams?.image3 && requestParams?.image3 !== ""
              ? requestParams?.image3.split(";")[0].split("/")[1]
              : "";
          const randomNumber = await makeRandomNumber(5);
          imageName3 =
            requestParams?.image3 && requestParams?.image3 !== ""
              ? `${moment().unix()}${randomNumber}.${extension}`
              : "";

          //profile pic upload
          await base64ImageUpload(
            imageName3,
            QUESTION,
            requestParams?.image3,
            res
          );
        }

        let questioObj = {
          question: requestParams?.question,
          questionSlug: requestParams?.questionSlug,
          option1: requestParams?.option1,
          option2: requestParams?.option2,
          option3: requestParams?.option3,
          odd1: requestParams?.odds1,
          odd2: requestParams?.odds2,
          odd3: requestParams?.odds3,
          isDeclared: requestParams?.isDeclared,
          image1: imageName1,
          image2: imageName2,
          image3: imageName3,
        };
        console.log("questioObj", questioObj);
        await Question.create(questioObj);
        return Response.successResponseWithoutData(
          res,
          res.locals.__("questionAdded"),
          SUCCESS
        );
      }
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
   * @description "This function is to questions."
   * @param req
   * @param res
   */
  getQuestionAuth: async (req, res) => {
    try {
      console.log("authUserId", authUserId);
      let questionResult = await QuestionResult.find({
        isDeclared: false,
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
                odd1: modified?.odd1,
                odd2: modified?.odd2,
                odd3: modified?.odd3,
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
              odd1: modified?.odd1,
              odd2: modified?.odd2,
              odd3: modified?.odd3,
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
      let questionModified = question?.map((modified) => {
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
        questionModified,
        SUCCESS,
        res.__("success")
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
