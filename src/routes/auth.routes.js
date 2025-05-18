const authController = require("../controllers/auth.controller");
const { verifyToken } = require("../middlewares/auth");

const router = require("express").Router();

router.post("/login", authController.login);
router.post("/register", authController.addUser);
router.post("/forget-password", authController.forgetPassword);
router.post("/reset-password", authController.resetPassword);
router.get("/by-accesstoken", authController.getUserByAccesstoken);
router.get("/buy-summary", authController.buySummary);
router.get("/reference", verifyToken(["customer"]), authController.getReference);
router.get("/user", verifyToken(["customer"]), authController.fetchUser);
router.put("/", verifyToken(["customer"]), authController.updatePassword);
router.post("/admin-login", authController.adminLogin);
// Otp Routes
router.post("/verify-otp", verifyToken(["customer"]), authController.verifyOtp);
router.get("/resend-otp", verifyToken(["customer"]), authController.resendOtp);


module.exports = router;
