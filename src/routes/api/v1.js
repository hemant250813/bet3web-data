const router = require("express").Router();
const connect = require("connect");
const { userTokenAuth } = require("../../middlewares/user");
const {
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  getUserDetail,
  logout,
} = require("../../controllers/app/authController");

const {
  userRegistration,
  verifyEmail,
  resendOtp,
} = require("../../controllers/app/userController");

const {
  resulTransaction,
} = require("../../controllers/app/transactionController");

const authMiddleware = (() => {
  const chain = connect();
  [userTokenAuth].forEach((middleware) => {
    chain.use(middleware);
  });
  return chain;
})();

//lrf
router.post("/login", login);
router.post("/forgot_password", forgotPassword);
router.post("/reset_password", resetPassword);
router.post("/change_password", userTokenAuth, changePassword);
router.post("/logout", logout);

router.get("/get-user-detail", userTokenAuth, getUserDetail);
router.post("/registration", userRegistration);
router.post("/otp-verify", verifyEmail);
router.post("/resend-otp", resendOtp);

// transaction
router.post("/bet-placed", userTokenAuth, resulTransaction);
module.exports = router;
