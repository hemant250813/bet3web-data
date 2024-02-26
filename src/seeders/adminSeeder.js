const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config({ path: "../../.env" });
const { User, UserLoginHistory, GameSetting } = require("./../models");
const logger = require("../logger/logger");
config = require("../config/config").getConfig();
const { ACTIVE, GAME } = require("../services/Constants");

const createAdmin = async () => {
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
    console.log("admin mongooseOptions", mongooseOptions);

    mongoose.connect(url, mongooseOptions);

    mongoose.connection.once("open", async () => {
      logger.info("Connected to database");
      await User.deleteOne({ username: process.env.ADMIN_USERNAME });
      const hash = await bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10);
      let user = await User.create({
        name: process.env.ADMIN_NAME,
        email: process.env.ADMIN_EMAIL,
        username: process.env.ADMIN_USERNAME,
        status: ACTIVE,
        type: 1,
        creditReference: 1000000000.0,
        balance: 1000000000.0,
        commission: 1,
        password: hash,
      });

      let loginHistory = await UserLoginHistory.create({ userId: user?._id });
      await User.updateOne(
        { _id: user?._id },
        {
          $set: {
            loginHistory: loginHistory?._id,
          },
        }
      );

      logger.info("admin data has been created :::");

      await GameSetting.deleteMany({ delete: "dt" });

      await GameSetting.bulkWrite(
        GAME.map((data) => ({
          insertOne: { document: data },
        }))
      );

      logger.info("game data has been created :::");
    });
  } catch (error) {
    logger.error("Error", error);
  }
};

createAdmin();
