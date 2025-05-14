const {db} = require('../utilities/dbConnection');

class AdminUsers {
    constructor(obj){
        this.id = obj.id;
        this.email = obj.email;
        this.password = obj.password;
        this.created_at = obj.created_at || new Date();
    }

    static async fetchAdminUser(email){
        try {
            const [rows] = await db.query(`SELECT * FROM admin_users WHERE email like '${email}'`);
            return rows;
        } catch (error) {
            throw error;
        }
    }
};

module.exports = AdminUsers;