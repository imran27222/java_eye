const router = require("express").Router();
const withdrawalController = require("../controllers/withdrawal.controller");
const { verifyToken } = require("../middlewares/auth");

router.get("/", verifyToken(["customer"]), withdrawalController.fetchWithdrawals);
router.get("/wallet", verifyToken(["customer"]), withdrawalController.fetchWallet);
router.post("/", verifyToken(["customer"]), withdrawalController.addWithdrawal);
router.get("/all", verifyToken(["admin"]), withdrawalController.fetchWithdrawalsAdminDashboard);
router.put("/:id", verifyToken(["admin"]), withdrawalController.updateWithdrawal);

module.exports = router;
