const {
  User,
  UserLoginHistory,
  BankAccount,
  ResultTransaction,
} = require("./user");
const Otp = require("./otp");
const { Transaction, BankTransaction } = require("./transaction");
const GameSetting = require("./gameSetting");
const { QuestionResult, Question } = require("./question");

module.exports = {
  User,
  UserLoginHistory,
  BankAccount,
  ResultTransaction,
  Otp,
  Transaction,
  BankTransaction,
  GameSetting,
  QuestionResult,
  Question,
};
