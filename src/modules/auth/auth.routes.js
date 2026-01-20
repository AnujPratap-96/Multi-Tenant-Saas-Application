import {Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import {register} from './auth.controller.js';
import { signUpSchema } from './auth.schema.js';



const router = Router();

router.post('/register', validate(signUpSchema), register);

export default router;
