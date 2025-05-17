const { db } = require("../utilities/dbConnection");
const { generateUniqueHash } = require("../utilities/uniqueHash");

class UserModel {
  constructor(obj) {
    // this.id = obj.id;
    this.email = obj.email;
    this.phone_number = obj.phone_number;
    this.password = obj.password;
    this.is_verified = obj.is_verified || false;
    this.current_balance = obj.current_balance || 0;
    this.created_at = obj.created_at || new Date();
    this.updated_at = obj.updated_at;
    this.deleted_at = obj.deleted_at;
    this.referred_by = obj.referred_by;
    this.reference_code = generateUniqueHash();
  }

  static async fetchUser(userPayload) {
    let query = "";
    let values = [];
    try {
      if (userPayload.email) {
        query = `SELECT * FROM users WHERE email = ? AND deleted_at IS NULL AND is_verified = 1`;
        values.push(userPayload.email);
      } else {
        query = `SELECT * FROM users WHERE phone_number = ? AND deleted_at IS NULL AND is_verified = 1`;
        values.push(userPayload.phone_number);
      }
      const [rows] = await db.query(query, values);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async fetchUserForSignUp(userPayload) {
    let query = "";
    let values = [];
    try {
      if (userPayload.email) {
        query = `SELECT * FROM users WHERE email = ? AND deleted_at IS NULL`;
        values.push(userPayload.email);
      } else {
        query = `SELECT * FROM users WHERE phone_number = ? AND deleted_at IS NULL`;
        values.push(userPayload.phone_number);
      }
      const [rows] = await db.query(query, values);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async addUser(obj) {
    try {
      const [rows] = await db.query(`INSERT INTO users SET ?`, obj);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async fetchUserById(id) {
    try {
      const [rows] = await db.query(`SELECT * FROM users WHERE id = ?`, [id]);
      return rows;
    } catch (error) {
      throw error;
    }
  }
  static async fetchUserByReferenceCode(code) {
    try {
      if (code) {
        const [rows] = await db.query(
          `SELECT * FROM users WHERE reference_code = ?`,
          [code]
        );
        return rows;
      } else {
        return null;
      }
    } catch (error) {
      throw error;
    }
  }

  static async update(id, obj) {
    try {
      if (obj.purchase_amount) {
        const [rows] = await db.query(
          `UPDATE users SET current_balance = current_balance - ${obj.purchase_amount} WHERE id = ${id}`
        );
        return rows;
      }

      const [rows] = await db.query(
        `UPDATE users SET is_verified = ${obj.is_verified} WHERE id = ${id}`
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async updatePassword(id, obj) {
    try {
      const [rows] = await db.query(
        `UPDATE users SET password = ? WHERE id = ?`,
        [obj.password, id]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async getReference(id) {
    try {
      const query = `SELECT u1.id, u1.userName, u1.email, u1.current_balance, u1.created_at FROM users u LEFT JOIN users u1 ON u.id = u1.referred_by WHERE u.id = ${id}  AND u1.referred_by IS NOT NULL AND u1.is_verified = 1`;
      const [rows] = await db.query(query);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async updateIsVerified(id, obj) {
    try {
      const isVerified = obj.is_verified || false;
      const query = `UPDATE users SET is_verified = ? WHERE id = ?`;
      const [result] = await db.query(query, [isVerified, id]);
      return result;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UserModel;
