const router = require("express").Router();
const depositController = require("../controllers/deposit.controller");
const { verifyToken } = require("../middlewares/auth");

const {upload} = require("../utilities/upload");

router.post("/add", verifyToken(['customer']), upload.single("image"), depositController.addDeposit);
router.get("/", verifyToken(['customer']), depositController.fetchDeposits);
router.get("/all", verifyToken(['admin']), depositController.fetchDepositsAdminDashbaorad);
router.put("/:id", verifyToken(['admin']), depositController.updateDeposit);

module.exports = router;