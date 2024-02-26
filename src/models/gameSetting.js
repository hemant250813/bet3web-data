const mongoose = require("mongoose");

const gameSettingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    min: {
      type: Number,
    },
    max: {
      type: Number,
    },
    probability: {
      type: Number,
    },
    odd: {
      type: Number,
    },
    delete: {
      type: String,
    },
    createDate: "date",
    updatedDate: "date",
  },
  { timestamps: { createDate: "createdAt", updatedDate: "updated_at" } }
);

module.exports = mongoose.model("GameSetting", gameSettingSchema);
