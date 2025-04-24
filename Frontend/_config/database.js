// config/database.js
const sql = require('mssql');

const dbConfig = {
  user: 'UserTweetNode',
  password: '12345678',
  server: 'localhost', 
  database: 'TweeterClone',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

// Create a connection pool
const pool = new sql.ConnectionPool(dbConfig);
const poolConnect = pool.connect();

// Handle pool errors
poolConnect.catch(err => {
  console.error('Error connecting to SQL Server:', err);
});

module.exports = {
  getConnection: async () => {
    try {
      await poolConnect;
      return pool;
    } catch (err) {
      console.error('Error getting connection from pool:', err);
      throw err;
    }
  },
  
  // Helper function for executing queries
  executeQuery: async (query, params = []) => {
    try {
      await poolConnect;
      const request = pool.request();
      
      // Add parameters if any
      params.forEach(param => {
        request.input(param.name, param.type, param.value);
      });
      
      return await request.query(query);
    } catch (err) {
      console.error('SQL query error:', err);
      throw err;
    }
  }
};