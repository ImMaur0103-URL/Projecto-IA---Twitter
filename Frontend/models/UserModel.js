// models/userModel.js
const sql = require('mssql');
const db = require('../_config/database');

class UserModel {
  // Get all users
  static async getAllUsers() {
    try {
      const result = await db.executeQuery('SELECT * FROM Users');
      return result.recordset;
    } catch (err) {
      console.error('Error getting all users:', err);
      throw err;
    }
  }

  // Get user by ID
  static async getUserById(userId) {
    try {
      const result = await db.executeQuery('SELECT * FROM Users WHERE user_id = @userId', [
        { name: 'userId', type: sql.UniqueIdentifier, value: userId }
      ]);
      return result.recordset[0];
    } catch (err) {
      console.error('Error getting user by ID:', err);
      throw err;
    }
  }

  // Get user by username
  static async getUserByUsername(username) {
    try {
      const result = await db.executeQuery('SELECT * FROM Users WHERE username = @username', [
        { name: 'username', type: sql.VarChar, value: username.username }
      ]);
      return await result.recordset[0];
    } catch (err) {
      console.error('Error getting user by username:', err);
      throw err;
    }
  }

  // Create a new user
  static async createUser(userData) {
    try {
      const userId = sql.TYPES.UniqueIdentifier.generateUuidV4();
      await db.executeQuery(`
        INSERT INTO Users (user_id, name, username, mail, picture)
        VALUES (@userId, @name, @username, @mail, @picture)
      `, [
        { name: 'userId', type: sql.UniqueIdentifier, value: userId },
        { name: 'name', type: sql.VarChar, value: userData.name },
        { name: 'username', type: sql.VarChar, value: userData.username },
        { name: 'mail', type: sql.VarChar, value: userData.mail },
        { name: 'picture', type: sql.VarBinary, value: userData.picture || null }
      ]);
      return { ...userData, user_id: userId };
    } catch (err) {
      console.error('Error creating user:', err);
      throw err;
    }
  }

  // Update user
  static async updateUser(userId, userData) {
    try {
      await db.executeQuery(`
        UPDATE Users 
        SET name = @name, 
            username = @username, 
            mail = @mail
            ${userData.picture ? ', picture = @picture' : ''}
        WHERE user_id = @userId
      `, [
        { name: 'userId', type: sql.UniqueIdentifier, value: userId },
        { name: 'name', type: sql.VarChar, value: userData.name },
        { name: 'username', type: sql.VarChar, value: userData.username },
        { name: 'mail', type: sql.VarChar, value: userData.mail },
        ...(userData.picture ? [{ name: 'picture', type: sql.VarBinary, value: userData.picture }] : [])
      ]);
      return { ...userData, user_id: userId };
    } catch (err) {
      console.error('Error updating user:', err);
      throw err;
    }
  }
}

module.exports = UserModel;