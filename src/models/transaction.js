const mongoose = require("mongoose");

const transaction = new mongoose.Schema(
  {
    fromId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      maxLength: 100,
    },
    toId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      maxLength: 100,
    },
    transaction_type: {
      type: String,
      enum: ["deposit", "withdrawl", "settlement"],
    },
    // settelment:{
    //   type: Boolean,
    // },
    description: {
      type: String,
    },
    amount: {
      type: Number,
    },
    currency: {
      type: Object,
    },
    createDate: "date",
    updatedDate: "date",
  },
  { timestamps: { createDate: "createdAt", updatedDate: "updated_at" } }
);

module.exports = mongoose.model("Transaction", transaction);
