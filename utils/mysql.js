import mysql from 'mysql2/promise';

const db = async () => {
  const config = process.env.NODE_ENV === 'production' 
    ? {
        host: process.env.DB_HOST,          // Production host
        user: process.env.DB_USER,          // Production username
        password: process.env.DB_PASS,      // Production password
        database: process.env.DB_NAME,      // Production database
      }
    : {
        host: process.env.MYSQL_HOST,       // Localhost for development
        user: process.env.MYSQL_USER,       // Local development username
        password: process.env.MYSQL_PASSWORD, // Local development password
        database: process.env.MYSQL_DATABASE, // Local development database
      };

  return mysql.createPool(config);
};

export default db;