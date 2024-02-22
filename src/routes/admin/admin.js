const router = require("express").Router();
const connect = require("connect");
const { adminTokenAuth } = require("../../middlewares/admin");

const {
  loginSwitch,
  resetPassword,
  changePassword,
  authDetail,
} = require("../../controllers/admin/authController");

const {
  transaction,
  resulTransaction,
} = require("../../controllers/admin/transactionController");

const {
  getUsers,
  activeDeActivateUser,
} = require("../../controllers/admin/userController");

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
router.post("/change-password", adminTokenAuth, changePassword);

//update status and delete user
// router.get("/login-history", adminTokenAuth, loginHistory);

// user
router.get("/user", adminTokenAuth, getUsers);
router.post(
  "/activate-deactivate-status",
  adminTokenAuth,
  activeDeActivateUser
);
// transaction
router.post("/transaction", adminTokenAuth, transaction);
router.get("/get-report", adminTokenAuth, resulTransaction);
module.exports = router;
