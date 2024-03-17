const Response = require("../../services/Response");
const {
  SUCCESS,
  INTERNAL_SERVER
} = require("../../services/Constants");
const { getSettingValidation } = require("../../services/UserValidation");
const { GameSetting } = require("../../models");

module.exports = {
  /**
   * @description "This function is to deposit to user."
   * @param req
   * @param res
   */
  gameSetting: async (req, res) => {
    try {
      const reqParam = req.query;
      getSettingValidation(reqParam, res, async (validate) => {
        console.log("gameSetting",reqParam);
        if (validate) {
          let setting = await GameSetting.findOne({
            name: reqParam.game.toLowerCase(),
          });

          Response.successResponseData(
            res,
            setting,
            SUCCESS,
            res.__("success")
          );
        }
      });
    } catch (error) {
      return Response.errorResponseWithoutData(
        res,
        res.locals.__("internalError"),
        INTERNAL_SERVER
      );
    }
  },
};
