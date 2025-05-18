const { db } = require("../utilities/dbConnection");

class PurchaseModel {
  constructor(obj) {
    const [date, time] = new Date().toISOString().split("T");
    const curDate = date.split("-");
    const curTime = time.split(".")[0].replaceAll(":", "");
    const dateB32 = Number(curDate[2] + curDate[1] + curDate[0])
      .toString(32)
      .toUpperCase();
    const timeB32 = Number(curTime).toString(32).toUpperCase();

    // this.id = obj.id;
    this.purchase_number = obj.purchase_number || `PUR${dateB32}${timeB32}`;
    this.purchase_amount = obj.purchase_amount || 0;
    this.total_vouchers = obj.total_vouchers || 0;
    // this.profited_amount = obj.purchase_amount + obj.purchase_amount * 0.03;
    this.profited_amount = obj.profited_amount;
    this.fk_user_id = obj.fk_user_id;
    this.created_at = obj.created_at || new Date();
    this.updated_at = obj.updated_at;
    this.deleted_at = obj.deleted_at;
  }

  static async addPurchase(purchaseObj, purchaseItemsObj, totalVouchersToAdd) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.query(`INSERT INTO purchase SET ?`, purchaseObj);

      if (purchaseItemsObj.length > 0) {
        for (let i of purchaseItemsObj) {
          const obj = {
            purchase_id: rows.insertId,
            product_name: i.title,
            product_price: i.price,
            product_id: i.id,
          };
          await connection.query(`INSERT INTO purchase_items SET ?`, obj);
        }
      }

      if (purchaseObj.purchase_amount > 0) {
        await connection.query(
          `UPDATE users SET current_balance = current_balance - ${purchaseObj.purchase_amount} WHERE id = ${purchaseObj.fk_user_id}`
        );
        
      }

      if (purchaseObj.total_vouchers > 0) {
        await connection.query(
          `UPDATE users SET total_vouchers = total_vouchers - ${purchaseObj.total_vouchers} WHERE id = ${purchaseObj.fk_user_id}`
        );

        await connection.query(
          `UPDATE users SET total_vouchers = total_vouchers + ${totalVouchersToAdd} WHERE id = ${purchaseObj.fk_user_id}`
        );
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

  static async fetchProducts(page = 1, size = 10, userId) {
    try {
      const query = `SELECT * FROM purchase WHERE deleted_at IS NULL AND fk_user_id = ${userId} ORDER BY created_at DESC`;
      const [rows] = await db.query(query);

      const [count] = await db.query(`SELECT COUNT(*) as count FROM purchase WHERE deleted_at IS NULL AND fk_user_id = ${userId}`);
      return {
        purchases: rows,
        pagination: {
          current_page: page,
          size: size,
          total_items: count[0].count,
          no_of_pages: size ? Math.ceil(count[0].count / +size) : 1,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  static async fetchProduct(id) {
    try {
      const [rows] = await db.query(`SELECT * FROM purchase WHERE fk_user_id = ${id} ORDER BY created_at DESC LIMIT 1`);
      if (rows.length > 0) {
        const [purchaseItems] = await db.query(`SELECT * FROM purchase_items WHERE purchase_id = ${rows[0].id}`);
        return { ...rows[0], items: purchaseItems };
      }

      return rows;
    } catch (error) {
      throw error;
    }
  }
  static async fetchLastPurchaseById(id) {
    try {
      const [rows] = await db.query(`SELECT *
      FROM purchase
      WHERE fk_user_id = ${id}
        AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      ORDER BY created_at DESC
      LIMIT 1;
      `);
      // const [rows] = await db.query(`SELECT *
      // FROM purchase
      // WHERE fk_user_id = ${id}
      //   AND created_at >= DATE_SUB(NOW(), INTERVAL 12 HOUR)
      // ORDER BY created_at DESC
      // LIMIT 1;
      // `);

      if (rows.length > 0) {
        const [purchaseItems] = await db.query(`SELECT * FROM purchase_items WHERE purchase_id = ${rows[0].id}`);
        return { ...rows[0], items: purchaseItems };
      } else {
        return null;
      }
    } catch (error) {
      throw error;
    }
  }
  static async totalEarning(id) {
    try {
      const [rows] = await db.query(`SELECT sum(profited_amount - purchase_amount) as total_earning
      FROM purchase 
      WHERE fk_user_id = ${id};
      `);
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = PurchaseModel;
