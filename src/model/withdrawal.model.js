const {db} = require('../utilities/dbConnection');

class WithdrawalModel{
    constructor(obj){
        this.id= obj.id;
        this.wallet_address= obj.wallet_address;
        this.wallet_type= obj.wallet_type;
        this.withdraw_amount= obj.withdraw_amount;
        this.status= obj.status || 'pending';
        this.fk_user_id = obj.fk_user_id;
        this.created_at= obj.created_at || new Date();
        this.updated_at= obj.updated_at;
        this.deleted_at= obj.deleted_at;
    }

    static async fetchWithdrawals(page, size, userId){
        try {
            const [rows] = await db.query(`SELECT * FROM withdrawal WHERE fk_user_id = ${userId} AND deleted_at IS NULL ORDER BY created_at DESC
            ${size && page ? `LIMIT ${size * page - size}, ${Number(size)}` : ""}`);

            const [count] = await db.query(`SELECT COUNT(*) as count FROM withdrawal WHERE fk_user_id = ${userId} AND deleted_at IS NULL`);
            return {withdrawals: rows, 
                pagination: {
                    current_page: page,
                    size: size,
                    total_items: count[0].count,
                    total_pages: Math.ceil(count[0].count / size)
                }
            };
        } catch (error) {
            throw error;
        }
    }

    static async addWithdrawal(obj){
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const [rows] = await connection.query(`INSERT INTO withdrawal SET ?`, obj);
            await connection.query(`UPDATE users SET current_balance = current_balance - ${obj.withdraw_amount} WHERE id = ${obj.fk_user_id}`);
            await connection.commit();
            return rows;
        } catch (error) {
            await connection.rollback();
            throw error;
        }finally{
            if(connection){
                connection.release();
            }
        }
    }

    static async getLastWithdrawalByUserId(userId){
        try {
            const query = `SELECT * FROM withdrawal WHERE fk_user_id = ${userId} AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1`;
            const [rows] = await db.query(query);
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            throw error;
        }
      
    }

    static async fetchWithdrawalsAdminDashboard(page, size, search, status){
        try {
            const [rows] = await db.query(`SELECT w.*, u.userName, u.email FROM withdrawal w JOIN users u ON w.fk_user_id = u.id WHERE w.deleted_at IS NULL 
            ${search && search.length > 0 ? `AND CONCAT_WS(' ', u.userName, u.email, w.wallet_address) LIKE '%${search}%'` : ""}
            ${status && status.length > 0 ? `AND w.status = '${status}'` : ""}
            ORDER BY w.created_at DESC
            ${size && page ? `LIMIT ${size * page - size}, ${Number(size)}` : ""}`);

            const [count] = await db.query(`SELECT COUNT(*) as count FROM withdrawal w JOIN users u ON w.fk_user_id = u.id WHERE w.deleted_at IS NULL 
            ${search && search.length > 0 ? `AND CONCAT_WS(' ', u.userName, u.email, w.wallet_address) LIKE '%${search}%'` : ""}
            ${status && status.length > 0 ? `AND w.status = '${status}'` : ""}`);
            return {
                withdrawals: rows, 
                pagination: {
                    current_page: page,
                    size: size,
                    total_items: count[0].count,
                    total_pages: Math.ceil(count[0].count / size)
                }
            };
        } catch (error) {
            throw error;
        }
    }

    static async updateWithdrawal(id, payload){
        const connection = await db.getConnection();
        try {
            let rows = null;
            await connection.beginTransaction();
            if(payload.status === 'confirmed') {
                rows = await connection.query(`UPDATE withdrawal SET status = '${payload.status}' WHERE id = ${id}`);
            }else{
                await connection.query(`UPDATE withdrawal SET status = '${payload.status}' WHERE id = ${id}`);
                rows = await connection.query(`UPDATE users 
                SET current_balance = current_balance + (
                  SELECT withdraw_amount FROM withdrawal WHERE id = ${id}
                ) 
                WHERE id = (
                  SELECT fk_user_id FROM withdrawal WHERE id = ${id}
                )`);
            }
            await connection.commit();
            return rows;
        } catch (error) {
            await connection.rollback();
            throw error;
        }finally {
            if (connection) {
                connection.release();
            }
        }
    }
}

module.exports = WithdrawalModel;