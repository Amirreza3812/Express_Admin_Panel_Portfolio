const { Sequelize } = require("sequelize");

// اتصال به دیتابیس
const sequelize = new Sequelize(
  process.env.DB_NAME, // از .env می‌خونه
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    dialect: "postgres",
    logging: false, // برای اینکه توی ترمینال لاگ‌های SQL نشون نده
  }
);

// تست اتصال
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ MySQL connected.");
  } catch (error) {
    console.error("❌ Connection failed:", error);
  }
};

module.exports = { sequelize, connectDB };
