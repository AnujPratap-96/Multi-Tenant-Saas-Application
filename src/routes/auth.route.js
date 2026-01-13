import {Router } from 'express';
import { validate } from '../middlewares/validate.middleware.js';
import { signUp } from '../controllers/auth.controller.js';
import { signUpSchema } from '../schemas/auth.schema.js';



const router = Router();

// Example route for user login
router.post('/signup', validate(signUpSchema), signUp);

export default router;
