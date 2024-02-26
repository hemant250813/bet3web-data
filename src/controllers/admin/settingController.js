const Response = require("../../services/Response");
const Constants = require("../../services/Constants");
const { SUCCESS } = require("../../services/Constants");
const { settingValidation } = require("../../services/AdminValidation");
const { GameSetting } = require("../../models");

module.exports = {
  /**
   * @description "This function is to deposit to user."
   * @param req
   * @param res
   */
  setting: async (req, res) => {
    try {
      const reqParam = req.body;
      settingValidation(reqParam, res, async (validate) => {
        if (validate) {
          if (reqParam?.game === "all") {
            await GameSetting.updateMany(
              { delete: { $eq: "dt" } }, // Filter
              {
                $set: {
                  min: parseInt(reqParam?.min),
                  max: parseInt(reqParam?.max),
                  probability: parseInt(reqParam?.probability),
                  odd: parseInt(reqParam?.odd)
                },
              } // Update operation
            );
          } else {
            await GameSetting?.updateOne(
              { name: { $eq: reqParam?.game } }, // Filter
              {
                $set: {
                  min: parseInt(reqParam?.min),
                  max: parseInt(reqParam?.max),
                  probability: parseInt(reqParam?.probability),
                  odd: parseInt(reqParam?.odd)
                },
              }
            );
          }

          return Response.successResponseWithoutData(
            res,
            res.locals.__("success"),
            SUCCESS
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
