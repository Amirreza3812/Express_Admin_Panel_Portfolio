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
        url: "http://localhost:5000", // آدرس سرور توسعه‌ای
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
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
