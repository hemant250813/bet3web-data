const mongoose = require("mongoose");
require("dotenv").config({ path: "../../.env" });
const { GameSetting } = require("../models");
const logger = require("../logger/logger");
config = require("../config/config").getConfig();
const { ACTIVE, GAME } = require("../services/Constants");

const createGame = async () => {
  try {
    const url = config.MONGO_CONNECTION_STRING;
    logger.info(
      "process.env.MONGO_CONNECTION_STRING :::" +
        process.env.MONGO_CONNECTION_STRING
    );

    const mongooseOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };
    console.log("game mongooseOptions");

    mongoose.connect(url, mongooseOptions);

    mongoose.connection.once("open", async () => {
      logger.info("Connected to database");
      await GameSetting.deleteMany({ delete: "dt" });

      await GameSetting.bulkWrite(
        GAME?.map((data) => ({
          insertOne: { document: data },
        }))
      );

      logger.info("game data has been created :::");
    });
  } catch (error) {
    logger.error("Error", error);
  }
};

createGame();
