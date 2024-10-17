import mysql from 'mysql2/promise';

//cpanel db for live deployment
// const db = async () => {
//   return mysql.createConnection({
//     host: process.env.DB_HOST, // Use localhost for local development
//     user: process.env.DB_USER,      // Use your MySQL username
//     password: process.env.DB_PASS, // Replace with your MySQL root password
//     database: process.env.DB_NAME, // The database you created
//   });
// };


//local host testing
const db = async () => {
  return mysql.createConnection({
    host: process.env.MYSQL_HOST, // Use localhost for local development
    user: process.env.MYSQL_USER,      // Use your MySQL username
    password: process.env.MYSQL_PASSWORD, // Replace with your MySQL root password
    database: process.env.MYSQL_DATABASE, // The database you created
  });
};

export default db;