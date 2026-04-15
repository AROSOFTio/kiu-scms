import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

export const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'scms_user',
  password: process.env.DB_PASSWORD || 'scms_password',
  database: process.env.DB_NAME || 'scms_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
