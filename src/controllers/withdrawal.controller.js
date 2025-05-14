const WithdrawalModel = require("../model/withdrawal.model");
const AuthModel = require("../model/auth.model");

const withdrawalController = {
  fetchWithdrawals: async (req, res) => {
    try {
      const { page, size } = req.query;
      const userId = req.userId;
      const response = await WithdrawalModel.fetchWithdrawals(page, size, userId);
      return res.status(200).send(response);
    } catch (error) {
      return res.status(500).send(error);
    }
  },
  fetchWallet: async (req, res) => {
    try {
      const userId = req.userId;
      const response = await WithdrawalModel.getLastWithdrawalByUserId(userId);
      if (response) {
        return res.status(200).send({ walletAddress: response.wallet_address, walletType: response.wallet_type });
      } else {
        return res.status(200).send({ walletAddress: null, walletType: null });
      }
    } catch (error) {
      return res.status(500).send(error);
    }
  },

  addWithdrawal: async (req, res) => {
    try {
      const lastWithdrawal = await WithdrawalModel.getLastWithdrawalByUserId(req.userId);
      if (lastWithdrawal) {
        //   const lastRequestTime = new Date(lastWithdrawal.created_at);
        //   const currentTime = new Date();
        //   const timeDifference = (currentTime - lastRequestTime) / (1000 * 60 * 60); // Convert milliseconds to hours

        //   if (timeDifference < 24) {
        //       return res.status(400).json({
        //           message: "You can only request a withdrawal once every 24 hours.",
        //       });
        //   }
        if (lastWithdrawal.status === "pending") {
          return res.status(400).json({
            message: "You already request a withdrawal.",
          });
        }
      }
      const user = await AuthModel.fetchUserById(req.userId);
      const payload = { fk_user_id: req.userId, ...req.body };
      if (user[0].current_balance - payload.withdraw_amount < 50) {
        return res.status(400).json({
          message: "Minimum balance should be 50$",
        });
      }

      const withdrawalObj = new WithdrawalModel(payload);
      const withdrawal = await WithdrawalModel.addWithdrawal(withdrawalObj);
      if (!withdrawal) {
        return res.status(400).json({
          message: "Unable to add withdrawal request",
        });
      } else {
        return res.status(201).json({
          message: "Withdrawal request added successfully",
          withdrawal: withdrawal,
        });
      }
    } catch (error) {
      return res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  fetchWithdrawalsAdminDashboard: async (req, res) => {
    try {
      const { page, size, search, status } = req.query;
      const response = await WithdrawalModel.fetchWithdrawalsAdminDashboard(page, size, search, status);
      return res.status(200).send(response);
    } catch (error) {
      return res.status(500).send(error);
    }
  },

  updateWithdrawal: async (req, res) => {
    try {
      const { id } = req.params;
      const payload = req.body;
      const withdrawal = await WithdrawalModel.updateWithdrawal(id, payload);
      if (withdrawal[0].affectedRows === 0) {
        return res.status(400).json({
          message: "Unable to update withdrawal request",
        });
      } else {
        return res.status(200).json({
          message: "Withdrawal request updated successfully",
        });
      }
    } catch (error) {
      return res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  },
};

module.exports = withdrawalController;
