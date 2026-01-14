import {Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import {signUp} from './auth.controller.js';
import { signUpSchema } from './auth.schema.js';



const router = Router();

// Example route for user login
router.post('/signup', validate(signUpSchema), signUp);

export default router;
