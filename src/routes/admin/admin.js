const router = require("express").Router();
const connect = require("connect");
const { adminTokenAuth } = require("../../middlewares/admin");

const {
  loginSwitch,
  resetPassword,
  changePassword,
  authDetail,
  logout,
} = require("../../controllers/admin/authController");

const {
  transaction,
  resulTransaction,
} = require("../../controllers/admin/transactionController");

const {
  getUsers,
  activeDeActivateUser,
} = require("../../controllers/admin/userController");

const { setting } = require("../../controllers/admin/settingController");

const {
  question,
  getQuestion,
  getQuestionAuth,
} = require("../../controllers/admin/questionController");

const {
  result,
  getResult,
} = require("../../controllers/admin/resultController");

const {
  addBankSlider,
  bankSliderList,
  deleteBankSlider,
  bankTransactionList,
  acceptRejectRequest,
} = require("../../controllers/admin/bankTransactionController");

const authMiddleware = (() => {
  const chain = connect();
  [adminTokenAuth].forEach((middleware) => {
    chain.use(middleware);
  });
  return chain;
})();

// lrf
router.post("/login", loginSwitch);
router.get("/auth-detail", adminTokenAuth, authDetail);
router.post("/reset-password", adminTokenAuth, resetPassword);

//update status and delete user
// router.get("/login-history", adminTokenAuth, loginHistory);

// user
router.post("/logout", adminTokenAuth, logout);
router.post("/change-password", adminTokenAuth, changePassword);
router.get("/user", adminTokenAuth, getUsers);
router.post(
  "/activate-deactivate-status",
  adminTokenAuth,
  activeDeActivateUser
);

// transaction
router.post("/transaction", adminTokenAuth, transaction);
router.get("/get-report", adminTokenAuth, resulTransaction);

// setting
router.post("/game-setting", adminTokenAuth, setting);

// question
router.post("/question", adminTokenAuth, question);
router.get("/question", getQuestion);

// result
router.post("/result", adminTokenAuth, result);
router.get("/get-result", adminTokenAuth, getResult);

// bank
router.post("/bank-slider", adminTokenAuth, addBankSlider);
router.post("/delete-bank-slider", adminTokenAuth, deleteBankSlider);
router.get("/bank-slider", bankSliderList);

// bank transaction
router.get("/bank-transaction", adminTokenAuth, bankTransactionList);
router.post("/accept-reject-request", adminTokenAuth, acceptRejectRequest);
module.exports = router;
