const PurchaseModel = require("../model/purchase.model");
const AuthModel = require("../model/auth.model");
const {addWalletUpdateJob}= require('../utilities/queue');

const purchaseController = {
  purchaseProduct: async (req, res) => {
    try {
      const payload = req.body;
      const userId = req.userId;
      // BALANCE CHECK AND DEDUCTION FROM WALLET HERE
      const lastProduct = await PurchaseModel.fetchLastPurchaseById(userId);

      if (lastProduct) {
        return res.status(200).json({
          message: "You can only buy a product once every 24 hours.",
        });
      }
      const user = await AuthModel.fetchUserById(userId);

      if (payload.items.length === 0) {
        return res.status(200).json({
          message: "Please select atleast one item to buy",
        });
      }

      if (payload.payment_type === "balance" && user[0].current_balance < payload.purchase_amount) {
        return res.status(200).json({
          message: "Insufficient balance",
        });
      }
      let totalVouchersToAdd = 0;

      if (payload.items.length % 2 === 0 && payload.items.length > 0) {
        totalVouchersToAdd = Math.floor((payload?.items.length)/2)
      }

      if (payload.payment_type === "voucher" && user[0].total_vouchers < payload.total_vouchers) {
        return res.status(200).json({
          message: "Insufficient vouchers",
        });
      }
     
      const purchase = new PurchaseModel({ purchase_amount: payload.purchase_amount, fk_user_id: userId, total_vouchers: payload.total_vouchers, profited_amount: payload.profited_amount });
      const product = await PurchaseModel.addPurchase(purchase, payload.items, totalVouchersToAdd);
      if (product.insertId === 0) {
        return res.status(200).send({
          message: "Unable to buy product",
        });
      } else {
        purchase.id = product.insertId;

        await addWalletUpdateJob(userId, purchase);
        return res.status(200).send({
          message: "Product bought successfully",
          product: {
            ...purchase,
            items: payload.items.map((item) => ({
              product_id: item.id,
              product_name: item.name,
              product_price: item.price,
            })),
          },
        });
      }
    } catch (error) {
      console.error(error);
      return res.status(200).json({
        message:
          "We are currently experiencing technical difficulties. Please try again later.",
      });
    }
  },
  getAllPurchases: async (req, res) => {
    try {
      const {page, size} = req.query
      const purchases = await PurchaseModel.fetchAllPurchaseItems(req.userId, page, size);
      return res.status(200).json(purchases);
    } catch (error) {
      console.error(error);
      return res.status(200).json({
        message:
          "We are currently experiencing technical difficulties. Please try again later.",
      });
    }
  },
};

module.exports = purchaseController;
