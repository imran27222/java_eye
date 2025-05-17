const { db } = require("../utilities/dbConnection");

class DepositModel {
  constructor(obj) {
    this.id = obj.id;
    this.transaction_number = obj.transaction_number;
    this.image = obj.image;
    this.fk_user_id = obj.fk_user_id;
    this.status = obj.status || "pending";
    this.created_at = obj.created_at || new Date();
    this.updated_at = obj.updated_at;
    this.deleted_at = obj.deleted_at;password
    this.deposit_amount = obj.deposit_amount || 0;
  }
  static async addDeposit(obj) {
    try {
      const [rows] = await db.query(`INSERT INTO deposits SET ?`, obj);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async fetchDeposits(page, size, userId) {
    try {
      const [rows] = await db.query(`SELECT * FROM deposits WHERE fk_user_id = ${userId} AND deleted_at IS NULL ORDER BY created_at DESC
            ${size && page ? `LIMIT ${size * page - size}, ${Number(size)}` : ""}`);

      const [count] = await db.query(`SELECT COUNT(*) as count FROM deposits WHERE fk_user_id = ${userId} AND deleted_at IS NULL`);
      return {
        deposits: rows,
        pagination: {
          current_page: page,
          size: size,
          total_items: count[0].count,
          total_pages: Math.ceil(count[0].count / size),
        },
      };
    } catch (error) {
      throw error;
    }
  }

  static async fetchDepositsAdminDashboard(page, size, search, status) {
    try {
      const [rows] = await db.query(`SELECT d.*, u.userName, u.email, u.current_balance FROM deposits d JOIN users u ON d.fk_user_id = u.id WHERE d.deleted_at IS NULL 
            ${search && search.length > 0 ? `AND CONCAT_WS(' ', u.userName, u.email, d.transaction_number) LIKE '%${search}%'` : ""}
            ${status && status.length > 0 ? `AND d.status = '${status}'` : ""}
            ORDER BY d.created_at DESC
            ${size && page ? `LIMIT ${size * page - size}, ${Number(size)}` : ""}`);

      const [count] = await db.query(`SELECT COUNT(*) as count FROM deposits d JOIN users u ON d.fk_user_id = u.id WHERE d.deleted_at IS NULL 
            ${search && search.length > 0 ? `AND CONCAT_WS(' ', u.userName, u.email, d.transaction_number) LIKE '%${search}%'` : ""}
            ${status && status.length > 0 ? `AND d.status = '${status}'` : ""}`);
      return {
        deposits: rows,
        pagination: {
          current_page: page,
          size: size,
          total_items: count[0].count,
          total_pages: Math.ceil(count[0].count / size),
        },
      };
    } catch (error) {
      throw error;
    }
  }

    static async updateDeposit(id, payload){
        const connection = await db.getConnection();
        try {
            let rows = null;
            await connection.beginTransaction();
            const depositAmount = Number(payload.amount) || 0;
            if(payload.status === 'rejected') {
                rows = await connection.query(`UPDATE deposits SET status = '${payload.status}', deposit_amount = '${depositAmount}' WHERE id = ${id}`);
            }else{
                await connection.query(`UPDATE deposits SET status = '${payload.status}', deposit_amount = '${depositAmount}' WHERE id = ${id}`);
                rows = await connection.query(`UPDATE users 
                SET current_balance = current_balance + ${depositAmount}
                WHERE id = (
                  SELECT fk_user_id FROM deposits WHERE id = ${id}
                )`);
      }
      await connection.commit();
      return rows;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }
}

module.exports = DepositModel;
