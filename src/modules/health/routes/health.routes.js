import { Router } from "express";
import { getHealth } from "../controllers/health.controller.js";

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: System health check
 *     description: Returns the status of the server, database, and redis.
 *     tags: [System]
 *     responses:
 *       200:
 *         description: System is healthy
 */
router.get("/", getHealth);

export default router;
