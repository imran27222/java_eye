const router = require("express").Router();
const purchaseController = require("../controllers/purchase.controller");
const { verifyToken } = require("../middlewares/auth");

router.post("/buy", verifyToken(["customer"]), purchaseController.purchaseProduct);
router.get("/all", verifyToken(["customer"]), purchaseController.getAllPurchases);

module.exports = router;
