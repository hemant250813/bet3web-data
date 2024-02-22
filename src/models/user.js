const { Decimal128 } = require("mongodb");
const mongoose = require("mongoose");

// Result Transaction
const resultTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    description: {
      type: String,
    },
    pl: {
      type: Number,
    },
    game: {
      type: String,
      enum: [
        "head_tail",
        "rock_paper_scissors",
        "spin_wheel",
        "number_guess",
        "dice_rolling",
        "card_finding",
        "number_slot",
        "number_pool",
      ],
      maxLength: 100,
    },
    roundId: {
      type: String,
      maxLength: 100,
    },
    result: {
      type: String,
      enum: ["win", "loss"],
      maxLength: 30,
    },
    createDate: "date",
    updatedDate: "date",
  },
  { timestamps: { createDate: "createdAt", updatedDate: "updated_at" } }
);
// Result Transaction

// Bank Account
const bankAccountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      maxLength: 100,
    },
    accountNumber: {
      type: Number,
      maxLength: 100,
    },
    accountName: {
      type: String,
      maxLength: 100,
    },
    bankName: {
      type: String,
      maxLength: 100,
    },
    ifscCode: {
      type: String,
      maxLength: 100,
    },
    accountType: {
      type: String,
      default: "saving",
      enum: ["saving", "current"],
      maxLength: 15,
    },
    amount: {
      type: Number,
    },
    is_active: {
      type: String,
      default: "0",
      enum: ["0", "1"],
      maxLength: 5,
    },
    status: {
      type: String,
      enum: ["pending", "rejected", "settled"],
      maxLength: 15,
    },
    createDate: "date",
    updatedDate: "date",
  },
  { timestamps: { createDate: "createdAt", updatedDate: "updated_at" } }
);
// Bank Account

// Login history
const loginHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Types.ObjectId, ref: "User" },
    loginDetails: [{ type: Object }],
    createDate: "date",
    updatedDate: "date",
  },
  { timestamps: { createDate: "createdAt", updatedDate: "updated_at" } }
);
// Login history

// User
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      maxLength: 100,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      maxLength: 100,
    },
    type: {
      type: Number,
      enum: [1, 2],
      required: true,
      Comment: { admin: 1, user: 2 },
    },
    email: {
      type: String,
      maxLength: 100,
    },
    password: {
      type: String,
      required: true,
      maxLength: 100,
    },
    passwordText: {
      type: String,
      maxLength: 100,
    },
    mobileNo: {
      type: Number,
      maxLength: 15,
    },
    country: {
      type: String,
      maxLength: 50,
    },
    verified: {
      type: "date",
      default: null,
      Comment: { date: "verified", null: "not verified" },
    },
    balance: {
      type: Number,
      required: false,
      min: 0,
      max: 200000000000,
    },
    otp: {
      type: String,
      maxLength: 50,
    },
    code_expiry: {
      type: Date,
      maxLength: 100,
    },
    ip_address: {
      system_ip: {
        type: String,
        default: null,
      },
      browser_ip: {
        type: String,
        default: null,
      },
    },
    last_login: {
      type: Date,
    },
    token: {
      type: String,
    },
    status: {
      type: String,
      default: "0",
      enum: ["0", "1", "2"], //0-inactive, 1- active, 2- deleted
    },
    betAllow: {
      type: Boolean,
      default: true,
    },
    bankAccount: {
      type: mongoose.Types.ObjectId,
      ref: "BankAccount",
    },
    loginHistory: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    commission: {
      type: Number,
      required: false,
    },
    createDate: "date",
    updatedDate: "date",
    lastLoginIp: {
      type: String,
      maxLength: 191,
    },
  },
  { timestamps: { createDate: "createdAt", updatedDate: "updated_at" } }
);
// User

const UserLoginHistory = mongoose.model("UserLoginHistory", loginHistorySchema);
const User = mongoose.model("User", userSchema);
const BankAccount = mongoose.model("BankAccount", bankAccountSchema);
const ResultTransaction = mongoose.model(
  "ResultTransaction",
  resultTransactionSchema
);

module.exports = {
  User,
  UserLoginHistory,
  BankAccount,
  ResultTransaction,
};
