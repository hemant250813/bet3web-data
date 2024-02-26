const mongoose = require("mongoose");

const questioResultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    question: {
      type: String,
    },
    answer: {
      type: String,
    },
    odd: {
      type: Number,
    },
    amount: {
      type: Number,
    },
    questionSlug: {
      type: String,
    },
    isDeclared: {
      type: Boolean,
    },
    createDate: "date",
    updatedDate: "date",
  },
  { timestamps: { createDate: "createdAt", updatedDate: "updated_at" } }
);

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
    },
    option1: {
      type: String,
    },
    option2: {
      type: String,
    },
    option3: {
      type: String,
    },
    odd: {
      type: Number,
    },
    questionSlug: {
      type: String,
    },
    isDeclared: {
      type: Boolean,
    },
    answer: {
      type: String,
    },
    createDate: "date",
    updatedDate: "date",
  },
  { timestamps: { createDate: "createdAt", updatedDate: "updated_at" } }
);

const QuestionResult = mongoose.model("QuestionResult", questioResultSchema);
const Question = mongoose.model("Question", questionSchema);

module.exports = {
  QuestionResult,
  Question
};
