const { db } = require("../utilities/dbConnection");

class PurchaseItemsModel {
  constructor(obj) {
    this.product_name = obj.product_name;
    this.product_id = obj.product_id;
    this.product_price = obj.product_price;
    this.purchase_id = obj.purchase_id;
  }

  static async addPurchase(obj) {
    try {
      const [rows] = await db.query(`INSERT INTO purchase_items SET ?`, obj);
      return rows;
    } catch (error) {
      throw error;
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
      return rows;
    } catch (error) {
      throw error;
    }
  }
  static async fetchLastPurchaseById(id) {
    try {
      const [rows] = await db.query(`SELECT * FROM purchase WHERE fk_user_id = ${id} AND created_at <= NOW() - INTERVAL 24 HOUR ORDER BY created_at DESC LIMIT 1`);
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = PurchaseItemsModel;
