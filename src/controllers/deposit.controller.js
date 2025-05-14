const DepositModel = require("../model/deposit.model");
const depositController = {
    addDeposit: async(req, res) => {
        try {
            const payload = {fk_user_id: req.userId, transaction_number: req.body.transaction_number, image: `${process.env.API_URL}/src/uploads/${req.file.filename}`};
            const depositObj = new DepositModel(payload);
            const deposit = await DepositModel.addDeposit(depositObj);
            if(!deposit) {
                return res.status(400).json({
                    message: "Unable to add deposit",
                });
            }else{
                return res.status(201).json({
                    message: "Deposit added successfully",
                    deposit: deposit,
                });
            }
        } catch (error) {
            return res.status(500).json({
                message: "Internal server error",
                error: error.message,
            });
        }
    },

    fetchDeposits: async(req, res) => {
        try {
            const {page, size} = req.query;
            const userId = req.userId;
            const deposits = await DepositModel.fetchDeposits(page, size, userId);
            return res.status(200).json(deposits);
        } catch (error) {
            return res.status(500).json({
                message: "Internal server error",
                error: error.message,
            });
        }
    },

    fetchDepositsAdminDashbaorad: async(req, res) => {
        try {
            const {page, size, search, status} = req.query;
            const deposits = await DepositModel.fetchDepositsAdminDashboard(page, size, search, status);
            return res.status(200).json(deposits);
        } catch (error) {
            return res.status(500).json({
                message: "Internal server error",
                error: error.message,
            });
        }
    },

    updateDeposit: async(req, res) => {
        try {
            const {id} = req.params;
            const payload = req.body;
            const deposit = await DepositModel.updateDeposit(id, payload);
            if(deposit[0].affectedRows === 0) {
                return res.status(400).json({
                    message: "Unable to update deposit",
                });
            }else{
                return res.status(200).json({
                    message: "Deposit updated successfully"
                });
            }
            
        } catch (error) {
            return res.status(500).json({
                message: "Internal server error",
                error: error.message,
            });
        }
    }
}

module.exports = depositController;