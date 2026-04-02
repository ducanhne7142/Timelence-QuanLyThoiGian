const mysql = require('mysql2/promise');

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

let pool = null;

const connectDB = async () => {
  try {
    if (pool) {
      return pool;
    }

    console.log('Attempting to connect to MySQL database with config:');
    console.log('Host:', config.host);
    console.log('Port:', config.port);
    console.log('Database:', config.database);
    console.log('User:', config.user);
    console.log('Password:', config.password ? '***' : 'NOT SET');

    pool = mysql.createPool(config);

    // Test connection
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();

    console.log('MySQL Database connected successfully');
    return pool;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    console.error('Full error:', error);
    throw error;
  }
};

const getPool = () => {
  if (!pool) {
    throw new Error('Database not connected. Call connectDB first.');
  }
  return pool;
};

const query = async (queryString, params = []) => {
  const pool = getPool();
  const [rows] = await pool.execute(queryString, params);
  return rows;
};

module.exports = {
  mysql,
  connectDB,
  getPool,
  query
};
