const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Portfolio API",
      version: "1.0.0",
      description: "مستندات API پروژه پورتفولیو",
    },
    servers: [
      {
        url: "https://express-admin-panel-portfolio.onrender.com/", // آدرس سرور توسعه‌ای
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "https",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./routes/*.js"], // مسیر به فایل‌های روت برای مستندسازی
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;
