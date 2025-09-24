require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { connectDB, sequelize } = require("./src/config/db");
const globalErrorHandler = require("./src/middlewares/errorHandler");
const AppError = require("./src/utils/AppError");

// Import Routes
// const projectRoutes = require("./routes/publicRoutes"); // Disabled for cafe management
// const adminRoutes = require("./routes/adminRoutes"); // Disabled for cafe management
const authRoutes = require("./routes/authRoutes");
const adminsRoutes = require("./routes/adminsRoutes");

// Import New API v1 Routes
const publicApiRoutes = require("./src/routes/api/v1/public");
const authApiRoutes = require("./src/routes/api/v1/auth");
const commentsApiRoutes = require("./src/routes/api/v1/comments");
const favoritesApiRoutes = require("./src/routes/api/v1/favorites");
const adminApiRoutes = require("./src/routes/admin");

const path = require("path");
const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Ensure JSON responses for API routes
app.use('/api', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// Request Logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Legacy Routes (keeping for backward compatibility)
// app.use("/api/projects", projectRoutes); // Disabled for cafe management
// app.use("/api/admin/projects", adminRoutes); // Disabled for cafe management
app.use("/api/admins", adminsRoutes);
app.use("/api/auth", authRoutes);

// New API v1 Routes (Professional Structure)
app.use("/api/v1/public", publicApiRoutes);
app.use("/api/v1/auth", authApiRoutes);
app.use("/api/v1/comments", commentsApiRoutes);
app.use("/api/v1/favorites", favoritesApiRoutes);
app.use("/api/v1/admin", adminApiRoutes);

// Swagger Documentation
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

// Swagger UI options with stunning dark theme
const swaggerOptions = {
  explorer: true,
  customCss: `
    /* Import premium fonts */
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Fira+Code:wght@400;500;600&display=swap');

    /* Hide default topbar */
    .swagger-ui .topbar { display: none !important; }

    /* Animated gradient background */
    .swagger-ui {
      background: #0a0a0a !important;
      background-image:
        radial-gradient(circle at 25% 25%, #1a1a1a 0%, transparent 50%),
        radial-gradient(circle at 75% 75%, #1e1e1e 0%, transparent 50%),
        radial-gradient(circle at 50% 50%, #141414 0%, transparent 50%) !important;
      color: #ffffff !important;
      font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
      min-height: 100vh !important;
      position: relative !important;
    }

    /* Add subtle particles effect */
    .swagger-ui::before {
      content: '' !important;
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      background-image:
        radial-gradient(2px 2px at 50px 100px, #333, transparent),
        radial-gradient(2px 2px at 150px 250px, #333, transparent),
        radial-gradient(1px 1px at 300px 50px, #444, transparent),
        radial-gradient(1px 1px at 450px 200px, #444, transparent) !important;
      pointer-events: none !important;
      opacity: 0.3 !important;
    }

    /* Main container with modern card design */
    .swagger-ui .wrapper {
      background: rgba(18, 18, 18, 0.95) !important;
      backdrop-filter: blur(20px) saturate(180%) !important;
      border: 1px solid rgba(255, 255, 255, 0.08) !important;
      border-radius: 24px !important;
      margin: 24px !important;
      padding: 48px !important;
      box-shadow:
        0 0 0 1px rgba(255, 255, 255, 0.05),
        0 16px 64px rgba(0, 0, 0, 0.4),
        inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
      position: relative !important;
      z-index: 1 !important;
    }

    /* API Info Header - Neon accent */
    .swagger-ui .info {
      background: rgba(20, 20, 20, 0.8) !important;
      border: 1px solid rgba(0, 255, 157, 0.2) !important;
      border-radius: 20px !important;
      padding: 40px !important;
      margin-bottom: 40px !important;
      position: relative !important;
      overflow: hidden !important;
    }

    .swagger-ui .info::before {
      content: '' !important;
      position: absolute !important;
      top: 0 !important;
      left: -50% !important;
      width: 200% !important;
      height: 1px !important;
      background: linear-gradient(90deg, transparent, #00ff9d, transparent) !important;
      animation: shimmer 3s infinite !important;
    }

    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }

    .swagger-ui .info .title {
      color: #ffffff !important;
      font-size: 3rem !important;
      font-weight: 700 !important;
      background: linear-gradient(135deg, #00ff9d, #00ccff, #9945ff) !important;
      background-size: 200% 200% !important;
      animation: gradient 4s ease infinite !important;
      -webkit-background-clip: text !important;
      -webkit-text-fill-color: transparent !important;
      margin-bottom: 20px !important;
      text-align: center !important;
    }

    @keyframes gradient {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    .swagger-ui .info .description {
      color: #b0b0b0 !important;
      font-size: 1.1rem !important;
      line-height: 1.8 !important;
      text-align: center !important;
      margin: 0 !important;
    }

    /* Clean version styling */
    .swagger-ui .info .version,
    .swagger-ui .info hgroup.main .version,
    .swagger-ui .info .title small,
    .swagger-ui small,
    .swagger-ui .version {
      color: #00ff9d !important;
      font-weight: 600 !important;
      font-size: 0.9rem !important;
    }

    /* Sleek operation blocks */
    .swagger-ui .opblock {
      background: rgba(28, 28, 28, 0.8) !important;
      border: 1px solid rgba(255, 255, 255, 0.05) !important;
      border-radius: 16px !important;
      margin-bottom: 20px !important;
      overflow: hidden !important;
      transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
      position: relative !important;
    }

    .swagger-ui .opblock:hover {
      transform: translateY(-4px) !important;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3) !important;
      border-color: rgba(255, 255, 255, 0.1) !important;
    }

    /* Modern HTTP method styling */
    .swagger-ui .opblock.opblock-get {
      border-left: 4px solid #00ff9d !important;
      box-shadow: inset 0 0 0 1px rgba(0, 255, 157, 0.1) !important;
    }

    .swagger-ui .opblock.opblock-get:hover {
      box-shadow:
        inset 0 0 0 1px rgba(0, 255, 157, 0.2),
        0 0 30px rgba(0, 255, 157, 0.1) !important;
    }

    .swagger-ui .opblock.opblock-post {
      border-left: 4px solid #00ccff !important;
      box-shadow: inset 0 0 0 1px rgba(0, 204, 255, 0.1) !important;
    }

    .swagger-ui .opblock.opblock-post:hover {
      box-shadow:
        inset 0 0 0 1px rgba(0, 204, 255, 0.2),
        0 0 30px rgba(0, 204, 255, 0.1) !important;
    }

    .swagger-ui .opblock.opblock-put {
      border-left: 4px solid #ffaa00 !important;
      box-shadow: inset 0 0 0 1px rgba(255, 170, 0, 0.1) !important;
    }

    .swagger-ui .opblock.opblock-put:hover {
      box-shadow:
        inset 0 0 0 1px rgba(255, 170, 0, 0.2),
        0 0 30px rgba(255, 170, 0, 0.1) !important;
    }

    .swagger-ui .opblock.opblock-delete {
      border-left: 4px solid #ff4444 !important;
      box-shadow: inset 0 0 0 1px rgba(255, 68, 68, 0.1) !important;
    }

    .swagger-ui .opblock.opblock-delete:hover {
      box-shadow:
        inset 0 0 0 1px rgba(255, 68, 68, 0.2),
        0 0 30px rgba(255, 68, 68, 0.1) !important;
    }

    .swagger-ui .opblock.opblock-patch {
      border-left: 4px solid #9945ff !important;
      box-shadow: inset 0 0 0 1px rgba(153, 69, 255, 0.1) !important;
    }

    .swagger-ui .opblock.opblock-patch:hover {
      box-shadow:
        inset 0 0 0 1px rgba(153, 69, 255, 0.2),
        0 0 30px rgba(153, 69, 255, 0.1) !important;
    }

    /* Crystal clear text - Force all white */
    .swagger-ui .opblock-summary,
    .swagger-ui .opblock-summary-path,
    .swagger-ui .opblock-summary-method,
    .swagger-ui .opblock-description-wrapper p,
    .swagger-ui .opblock-description,
    .swagger-ui .opblock-summary-path a,
    .swagger-ui .opblock-summary-description,
    .swagger-ui .parameter__name,
    .swagger-ui .parameter__type,
    .swagger-ui .parameter__deprecated,
    .swagger-ui .parameter__in,
    .swagger-ui .tab li button,
    .swagger-ui .opblock-section-header h4,
    .swagger-ui .markdown p,
    .swagger-ui .markdown,
    .swagger-ui .renderedMarkdown p,
    .swagger-ui .model-title,
    .swagger-ui .prop-type,
    .swagger-ui .prop-enum,
    .swagger-ui .prop-format,
    .swagger-ui .parameter__extension,
    .swagger-ui .response-col_links,
    .swagger-ui label,
    .swagger-ui span,
    .swagger-ui div {
      color: #ffffff !important;
      font-weight: 500 !important;
    }

    .swagger-ui .opblock-summary {
      font-size: 1.1rem !important;
      font-weight: 600 !important;
      color: #ffffff !important;
    }

    /* Fix any remaining gray text */
    .swagger-ui .parameter__type,
    .swagger-ui .parameter__deprecated,
    .swagger-ui .parameter__in,
    .swagger-ui .prop-type,
    .swagger-ui .model .deprecated span,
    .swagger-ui .model .deprecated,
    .swagger-ui .model-deprecated-warning {
      color: #ffffff !important;
      opacity: 0.9 !important;
    }

    /* Parameter descriptions and examples */
    .swagger-ui .parameter .parameter__name.required::after {
      color: #ff4444 !important;
    }

    .swagger-ui .parameter .parameter__name.required {
      color: #ffffff !important;
    }

    /* Futuristic buttons */
    .swagger-ui .btn {
      background: rgba(40, 40, 40, 0.8) !important;
      color: #ffffff !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      border-radius: 12px !important;
      padding: 12px 24px !important;
      font-weight: 600 !important;
      font-size: 0.9rem !important;
      transition: all 0.3s ease !important;
      text-transform: uppercase !important;
      letter-spacing: 0.5px !important;
      position: relative !important;
      overflow: hidden !important;
    }

    .swagger-ui .btn::before {
      content: '' !important;
      position: absolute !important;
      top: 0 !important;
      left: -100% !important;
      width: 100% !important;
      height: 100% !important;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent) !important;
      transition: left 0.5s !important;
    }

    .swagger-ui .btn:hover::before {
      left: 100% !important;
    }

    .swagger-ui .btn:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3) !important;
      border-color: rgba(255, 255, 255, 0.2) !important;
    }

    .swagger-ui .btn.authorize {
      background: linear-gradient(135deg, #00ff9d, #00cc7e) !important;
      color: #000000 !important;
      font-weight: 700 !important;
      box-shadow: 0 0 20px rgba(0, 255, 157, 0.3) !important;
    }

    .swagger-ui .btn.execute {
      background: linear-gradient(135deg, #00ccff, #0099cc) !important;
      color: #000000 !important;
      font-weight: 700 !important;
      box-shadow: 0 0 20px rgba(0, 204, 255, 0.3) !important;
    }

    /* Sleek form inputs */
    .swagger-ui textarea,
    .swagger-ui input[type=text],
    .swagger-ui input[type=password],
    .swagger-ui input[type=email],
    .swagger-ui select {
      background: rgba(30, 30, 30, 0.9) !important;
      color: #ffffff !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      border-radius: 10px !important;
      padding: 14px 18px !important;
      font-family: 'Poppins', sans-serif !important;
      font-size: 0.95rem !important;
      transition: all 0.3s ease !important;
    }

    .swagger-ui textarea:focus,
    .swagger-ui input:focus,
    .swagger-ui select:focus {
      border-color: #00ff9d !important;
      box-shadow: 0 0 0 3px rgba(0, 255, 157, 0.1) !important;
      outline: none !important;
      background: rgba(30, 30, 30, 1) !important;
    }

    /* Code blocks with syntax highlighting */
    .swagger-ui .highlight-code,
    .swagger-ui .microlight,
    .swagger-ui pre {
      background: rgba(15, 15, 15, 0.95) !important;
      color: #ffffff !important;
      border: 1px solid rgba(255, 255, 255, 0.05) !important;
      border-radius: 12px !important;
      padding: 20px !important;
      font-family: 'Fira Code', 'Monaco', monospace !important;
      font-size: 0.9rem !important;
      line-height: 1.6 !important;
    }

    /* Response sections */
    .swagger-ui .response-col_status,
    .swagger-ui .response-col_description,
    .swagger-ui .responses-inner h4,
    .swagger-ui .responses-inner h5 {
      color: #ffffff !important;
      font-weight: 600 !important;
    }

    /* Elegant modals */
    .swagger-ui .modal-ux {
      background: rgba(0, 0, 0, 0.85) !important;
      backdrop-filter: blur(10px) !important;
    }

    .swagger-ui .modal-ux-content {
      background: rgba(20, 20, 20, 0.98) !important;
      color: #ffffff !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      border-radius: 20px !important;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5) !important;
    }

    /* Section headers */
    .swagger-ui .opblock-tag {
      color: #ffffff !important;
      font-size: 1.8rem !important;
      font-weight: 700 !important;
      margin: 40px 0 24px 0 !important;
      padding: 20px 0 !important;
      border-bottom: 2px solid rgba(0, 255, 157, 0.3) !important;
      position: relative !important;
    }

    /* Clean tables */
    .swagger-ui table {
      background: rgba(25, 25, 25, 0.8) !important;
      border: 1px solid rgba(255, 255, 255, 0.05) !important;
      border-radius: 12px !important;
      overflow: hidden !important;
    }

    .swagger-ui table thead tr td,
    .swagger-ui table thead tr th {
      background: rgba(35, 35, 35, 0.9) !important;
      color: #ffffff !important;
      font-weight: 600 !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
    }

    .swagger-ui table tbody tr td {
      color: #e0e0e0 !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
    }

    /* Custom scrollbar */
    .swagger-ui *::-webkit-scrollbar {
      width: 10px !important;
      height: 10px !important;
    }

    .swagger-ui *::-webkit-scrollbar-track {
      background: rgba(30, 30, 30, 0.5) !important;
      border-radius: 5px !important;
    }

    .swagger-ui *::-webkit-scrollbar-thumb {
      background: linear-gradient(135deg, #00ff9d, #00ccff) !important;
      border-radius: 5px !important;
    }

    .swagger-ui *::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(135deg, #00ccff, #9945ff) !important;
    }

    /* Entrance animation */
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .swagger-ui .wrapper {
      animation: slideUp 0.8s ease-out !important;
    }

    .swagger-ui .opblock {
      animation: slideUp 0.6s ease-out !important;
      animation-fill-mode: both !important;
    }

    .swagger-ui .opblock:nth-child(1) { animation-delay: 0.1s !important; }
    .swagger-ui .opblock:nth-child(2) { animation-delay: 0.2s !important; }
    .swagger-ui .opblock:nth-child(3) { animation-delay: 0.3s !important; }
    .swagger-ui .opblock:nth-child(4) { animation-delay: 0.4s !important; }

    /* Authentication Modal - Reset Everything and Start Fresh */

    /* Remove all default Swagger modal styles */
    .swagger-ui .modal-ux,
    .swagger-ui .modal-ux-content,
    .swagger-ui .auth-container,
    .swagger-ui .auth-wrapper {
      all: unset !important;
    }

    /* Overlay */
    .swagger-ui .modal-ux {
      display: block !important;
      position: fixed !important;
      z-index: 10000 !important;
      left: 0 !important;
      top: 0 !important;
      width: 100% !important;
      height: 100% !important;
      background-color: rgba(0, 0, 0, 0.8) !important;
    }

    /* Modal Content */
    .swagger-ui .modal-ux-content {
      display: block !important;
      position: absolute !important;
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) !important;
      background-color: white !important;
      padding: 0 !important;
      border: 2px solid #333 !important;
      border-radius: 8px !important;
      width: 500px !important;
      max-width: 90vw !important;
      max-height: 80vh !important;
      overflow-y: auto !important;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
    }

    /* Auth Container */
    .swagger-ui .auth-container {
      display: block !important;
      padding: 30px !important;
      background: white !important;
      color: black !important;
      font-family: Arial, sans-serif !important;
    }

    /* Title */
    .swagger-ui .auth-container h4 {
      color: black !important;
      font-size: 18px !important;
      font-weight: bold !important;
      margin: 0 0 20px 0 !important;
      text-align: center !important;
    }

    /* All text elements */
    .swagger-ui .auth-container * {
      color: black !important;
    }

    /* Scheme container */
    .swagger-ui .scheme-container {
      background: #f8f8f8 !important;
      border: 1px solid #ddd !important;
      border-radius: 4px !important;
      padding: 15px !important;
      margin: 15px 0 !important;
    }

    /* Bearer title */
    .swagger-ui .scheme-container .schemes-title {
      color: #007acc !important;
      font-weight: bold !important;
      font-size: 14px !important;
      margin-bottom: 10px !important;
    }

    /* Labels */
    .swagger-ui .auth-container label {
      color: black !important;
      font-weight: bold !important;
      display: block !important;
      margin-bottom: 5px !important;
    }

    /* Input fields */
    .swagger-ui .auth-container input {
      width: 100% !important;
      padding: 10px !important;
      border: 1px solid #ccc !important;
      border-radius: 4px !important;
      font-size: 14px !important;
      background: white !important;
      color: black !important;
      box-sizing: border-box !important;
    }

    /* Buttons */
    .swagger-ui .auth-container .auth-btn-wrapper {
      text-align: center !important;
      margin-top: 25px !important;
      padding-top: 20px !important;
      border-top: 1px solid #333 !important;
    }

    .swagger-ui .auth-container .btn {
      background: #00ff9d !important;
      color: #000000 !important;
      border: none !important;
      font-weight: 600 !important;
      padding: 12px 24px !important;
      border-radius: 6px !important;
      cursor: pointer !important;
      margin: 0 10px !important;
      font-size: 14px !important;
    }

    .swagger-ui .auth-container .btn:hover {
      background: #00cc7e !important;
      transform: translateY(-1px) !important;
    }

    .swagger-ui .auth-container .btn.cancel {
      background: #666666 !important;
      color: #ffffff !important;
    }

    .swagger-ui .auth-container .btn.cancel:hover {
      background: #777777 !important;
    }

    /* Close button */
    .swagger-ui .modal-ux-header .close-modal {
      color: #ffffff !important;
      font-size: 24px !important;
      position: absolute !important;
      top: 15px !important;
      right: 20px !important;
      cursor: pointer !important;
    }

    /* Remove any weird borders or artifacts */
    .swagger-ui .auth-container::before,
    .swagger-ui .auth-container::after,
    .swagger-ui .modal-ux-content::before,
    .swagger-ui .modal-ux-content::after {
      display: none !important;
    }

    /* Mobile optimization */
    @media (max-width: 768px) {
      .swagger-ui .wrapper {
        margin: 12px !important;
        padding: 24px !important;
      }

      .swagger-ui .info .title {
        font-size: 2.2rem !important;
      }

      .swagger-ui .auth-container {
        margin: 8px !important;
        padding: 20px !important;
        max-width: calc(100vw - 32px) !important;
      }

      .swagger-ui .auth-container .auth-btn-wrapper {
        flex-direction: column !important;
        gap: 8px !important;
      }
    }
  `,
  customSiteTitle: "🚀 Cafe Management API - Cyberpunk Edition",
  swaggerOptions: {
    requestInterceptor: (req) => {
      req.headers['Content-Type'] = 'application/json';
      return req;
    }
  }
};

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));

// Health Check
app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "🚀 Cafe Management API is running!",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

// Handle undefined routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handling Middleware
app.use(globalErrorHandler);

// اتصال به دیتابیس
connectDB();

sequelize
  .sync({ force: true })
  .then(() => console.log("✅ Tables synced (recreated cleanly)"))
  .catch((err) => console.error("❌ Sync error:", err));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
