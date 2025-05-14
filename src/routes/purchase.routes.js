const router = require("express").Router();
const purchaseController = require("../controllers/purchase.controller");
const { verifyToken } = require("../middlewares/auth");

router.post("/buy", verifyToken(["customer"]), purchaseController.purchaseProduct);

module.exports = router;
