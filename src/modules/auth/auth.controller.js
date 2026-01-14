import {asyncHandler} from '../../utils/async-handler.js';
import { ApiError } from '../../utils/api-error.js';

export const signUp = asyncHandler(async (req, res) => {
  throw new ApiError(409, "Email already exists");
return res.status(201).json({message: 'User signed up successfully'});

});