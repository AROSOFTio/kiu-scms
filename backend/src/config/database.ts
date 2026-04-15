import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const hasDiscreteDbConfig = Boolean(
  process.env.DB_HOST ||
  process.env.DB_PORT ||
  process.env.DB_USER ||
  process.env.DB_PASSWORD ||
  process.env.DB_NAME
);
const databaseUrl = process.env.DATABASE_URL;

const connectionOptions = hasDiscreteDbConfig
  ? {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'scms_user',
      password: process.env.DB_PASSWORD || 'scms_password',
      database: process.env.DB_NAME || 'scms_db',
    }
  : databaseUrl
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
      host: 'localhost',
      port: 3306,
      user: 'scms_user',
      password: 'scms_password',
      database: 'scms_db',
    };

export const db = mysql.createPool({
  ...connectionOptions,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT || 10000),
});
