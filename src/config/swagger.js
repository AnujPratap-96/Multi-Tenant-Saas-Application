import swaggerJsdoc from "swagger-jsdoc";
import { API_PREFIX } from "./version.js";
import { env } from "./env.js";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Multi-Tenant Task Manager API",
      version: "1.0.0",
      description: "API documentation for the Multi-Tenant Task Manager SaaS backend",
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}${API_PREFIX}`,
        description: "Development server",
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
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/modules/**/*.routes.js"], // Path to the API docs
};

export const swaggerSpec = swaggerJsdoc(options);
