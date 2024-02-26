const { v4: uuidv4 } = require("uuid");
const { ResultTransaction } = require("../models");

module.exports = {
  AppName: "web3",
  forgotTemplate: "forgotPassword",
  newRegistration: "newRegistration",
  resendOtp: "resendOtp",
  emailVerifyTemplate: "userEmailVerification",
  verifyEmail: "verifyEmail",

  /**
   * @description This function use for converting string to uppercase.
   * @param length
   * @returns {*}
   */
  toUpperCase: (str) => {
    if (str.length > 0) {
      const newStr = str
        .toLowerCase()
        .replace(/_([a-z])/, (m) => m.toUpperCase())
        .replace(/_/, "");
      return str.charAt(0).toUpperCase() + newStr.slice(1);
    }
    return "";
  },

  /**
   * @description This function use for create random number.
   * @param length
   * @returns {*}
   */
  makeRandomNumber: (length) => {
    let result = "";
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  },

  /**
   * @description This function use for create random number.
   * @param length
   * @returns {*}
   */
  generateRandomNumber: (length) => {
    let result = "";
    const characters = "0123456789";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  },

  /**
   * @description This function use for create validation unique key.
   * @param apiTag
   * @param error
   * @return {*}
   */
  validationMessageKey: (apiTag, error) => {
    let key = module.exports.toUpperCase(error.details[0].context.key);
    let type = error.details[0].type.split(".");
    type = module.exports.toUpperCase(type[1]);
    key = apiTag + key + type;
    return key;
  },

  /**
   * @description This function use for pagination.
   * @param length
   * @returns {*}
   */
  pagination: async (data, perPage, currentPage) => {
    // Calculate the total number of pages
    const totalPages = Math.ceil(data.length / perPage);

    // Implement pagination logic
    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedData = data.slice(startIndex, endIndex);

    return paginatedData;
  },

  /**
   * @description This function use for pagination.
   * @param length
   * @returns {*}
   */
  searchQuestionByQuery: async (query, questionData) => {
    const results = [];
    for (const question of questionData) {
      for (const key in question) {
        if (
          typeof question[key] === "string" &&
          question[key].toLowerCase().includes(query.toLowerCase())
        ) {
          results.push(question);
          break; // Once found in one field, move to the next question
        }
      }
    }
    return results.length ? results : []; // Return null if question not found
  },

  /**
   * @description This function use for pagination.
   * @param length
   * @returns {*}
   */
  resultTransactionQuestion: async (res, data, amount, result) => {
    try {
      const roundId = uuidv4();
      // CREATE OR UPDATE STATEMENT BY DESCRIPTION
      let description = data?.questionSlug;
      let modifiedDescription = description + "_" + "question_and_answer";
      let checkRTxn = await ResultTransaction.findOne({
        userId: data?.userId,
        description: modifiedDescription,
      });
      // return true;
      if (checkRTxn != null) {
        let final_result = "";
        let final_pl = checkRTxn.pl + parseInt(amount);
        if (final_pl >= 0) {
          final_result = "win";
        } else {
          final_result = "lose";
        }

        // UPDATE
        await checkRTxn.updateOne({
          pl: checkRTxn.pl + parseInt(amount),
          result: final_result,
        });
        return true;
      } else {
        // CREATE
        await ResultTransaction.create({
          userId: data?.userId,
          description: modifiedDescription,
          game: "question_and_answer",
          pl: parseInt(amount),
          result: result,
          roundId: roundId,
        });

        return true;
      }
    } catch (error) {
      console.log("error", error);
      // return Response.errorResponseWithoutData(
      //   res,
      //   res.locals.__("internalError"),
      //   INTERNAL_SERVER
      // );
    }
  },
};
