require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { connectDB, sequelize } = require("./src/config/db");
const projectRoutes = require("./routes/publicRoutes");
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const adminsRoutes = require("./routes/adminsRoutes");
const path = require("path");
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/projects", projectRoutes);
app.use("/api/admin/projects", adminRoutes);
app.use("/api/admins", adminsRoutes);
app.use("/api/auth", authRoutes);

// 🔻 اینجا Swagger رو اضافه کن:
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// تست ساده
app.get("/", (req, res) => {
  res.send("API is running...");
});

// اتصال به دیتابیس
connectDB();

sequelize
  .sync({ alter: true })
  .then(() => console.log("✅ Tables synced"))
  .catch((err) => console.error("❌ Sync error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
