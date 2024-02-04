const router = require("express").Router();
const connect = require("connect");
const { adminTokenAuth } = require("../../middlewares/admin");

const {
  login,
  resetPassword,
  changePassword,
  authDetail,
} = require("../../controllers/admin/authController");

const authMiddleware = (() => {
  const chain = connect();
  [adminTokenAuth].forEach((middleware) => {
    chain.use(middleware);
  });
  return chain;
})();

// lrf
router.post("/login", login);
router.get("/auth-detail", adminTokenAuth, authDetail);
router.post("/reset-password", adminTokenAuth, resetPassword);
router.post("/change-password", adminTokenAuth, changePassword);

//update status and delete user
// router.get("/login-history", adminTokenAuth, loginHistory);
module.exports = router;
