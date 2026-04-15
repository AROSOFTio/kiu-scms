import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

const connectionOptions = databaseUrl
  ? (() => {
      const parsed = new URL(databaseUrl);

      return {
        host: parsed.hostname,
        port: Number(parsed.port || 3306),
        user: decodeURIComponent(parsed.username),
        password: decodeURIComponent(parsed.password),
        database: parsed.pathname.replace(/^\//, ''),
      };
    })()
  : {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'scms_user',
      password: process.env.DB_PASSWORD || 'scms_password',
      database: process.env.DB_NAME || 'scms_db',
    };

export const db = mysql.createPool({
  ...connectionOptions,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT || 10000),
});
