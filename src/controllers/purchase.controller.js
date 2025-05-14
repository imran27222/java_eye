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
        return res.status(400).json({
          message: "You can only buy a product once every 24 hours.",
        });
      }
      const user = await AuthModel.fetchUserById(userId);
      if (user[0].current_balance < payload.purchase_amount) {
        return res.status(400).json({
          message: "Insufficient balance",
        });
      }
      if (payload.items.length === 0) {
        return res.status(400).json({
          message: "Please select atleast one item to buy",
        });
      }
      const purchase = new PurchaseModel({ purchase_amount: payload.purchase_amount, fk_user_id: userId });
      const product = await PurchaseModel.addPurchase(purchase, payload.items);
      if (product.insertId === 0) {
        return res.status(400).send({
          message: "Unable to buy product",
        });
      } else {
        purchase.id = product.insertId;

        const user = await AuthModel.update(userId, payload);
        if (user.affectedRows === 0) {
          return res.status(400).send({
            message: "Unable to update user wallet",
          });
        }

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
      console.log(error);
      return res.status(500).send({
        message: "Internal server error",
        error: error.message,
      });
    }
  },
};

module.exports = purchaseController;
