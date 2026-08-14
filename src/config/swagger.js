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
      schemas: {
        Login: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string" },
          },
        },
        SignUp: {
          type: "object",
          required: ["email"],
          properties: {
            email: { type: "string", format: "email" },
          },
        },
        VerifyOtp: {
          type: "object",
          required: ["requestId", "otp"],
          properties: {
            requestId: { type: "string", format: "uuid" },
            otp: { type: "string" },
          },
        },
        SetPassword: {
          type: "object",
          required: ["newPassword"],
          properties: {
            newPassword: { type: "string", minLength: 8 },
            confirmPassword: { type: "string", minLength: 8 },
          },
        },
        ChangePassword: {
          type: "object",
          required: ["currentPassword", "newPassword"],
          properties: {
            currentPassword: { type: "string" },
            newPassword: { type: "string", minLength: 8 },
            confirmPassword: { type: "string", minLength: 8 },
          },
        },
        InviteCreate: {
          type: "object",
          required: ["email", "role"],
          properties: {
            email: { type: "string", format: "email" },
            role: { type: "string", enum: ["ADMIN", "MANAGER", "USER"] },
          },
        },
        InviteAccept: {
          type: "object",
          required: ["token"],
          properties: {
            token: { type: "string" },
          },
        },
        InviteReject: {
          type: "object",
          required: ["token"],
          properties: {
            token: { type: "string" },
          },
        },
        SettingsUpdate: {
          type: "object",
          required: ["settings"],
          properties: {
            settings: { type: "object", additionalProperties: true },
          },
        },
        AddAssignee: {
          type: "object",
          required: ["userId"],
          properties: {
            userId: { type: "string", format: "uuid" },
          },
        },
        CreateComment: {
          type: "object",
          required: ["comment"],
          properties: {
            comment: { type: "string", maxLength: 1000 },
          },
        },
        RoleUpdate: {
          type: "object",
          required: ["role"],
          properties: {
            role: { type: "string", enum: ["ADMIN", "MANAGER", "USER"] },
          },
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
