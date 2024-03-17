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
    settelment: {
      type: Boolean,
    },
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

const bankTransaction = new mongoose.Schema(
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
    bankId: {
      type: mongoose.Types.ObjectId,
      ref: "BankAccount",
      maxLength: 100,
    },
    transaction_type: {
      type: String,
      enum: ["deposit", "withdrawl"],
    },
    remark: {
      type: String,
    },
    transactionId: {
      type: String,
    },
    image: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
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

const Transaction = mongoose.model("Transaction", transaction);
const BankTransaction = mongoose.model("BankTransaction", bankTransaction);

module.exports = {
  Transaction,
  BankTransaction,
};
